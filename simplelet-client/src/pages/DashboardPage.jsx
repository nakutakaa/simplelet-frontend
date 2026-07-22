// src/pages/DashboardPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";

// Fetch user's listings
const fetchMyListings = async () => {
  const { data } = await API.get("/listings/my-listings");
  return data;
};

// Fetch user profile (for credibility score)
const fetchUserProfile = async () => {
  const { data } = await API.get("/auth/me");
  return data;
};

// Delete listing
const deleteListing = async (listingId) => {
  const { data } = await API.delete(`/listings/${listingId}`);
  return data;
};

// Toggle taken status
const toggleTaken = async (listingId) => {
  const { data } = await API.patch(`/listings/${listingId}/toggle-taken`);
  return data;
};

// Confirm/renew listing
const confirmListing = async (listingId) => {
  const { data } = await API.post(`/listings/${listingId}/confirm`);
  return data;
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  // Fetch listings
  const {
    data: listingsData,
    isLoading: listingsLoading,
    error: listingsError,
  } = useQuery({
    queryKey: ["myListings"],
    queryFn: fetchMyListings,
  });

  // Fetch user profile
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      toast.success("Listing deleted successfully");
      queryClient.invalidateQueries(["myListings"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to delete");
    },
  });

  // Toggle taken mutation
  const toggleMutation = useMutation({
    mutationFn: toggleTaken,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries(["myListings"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to update");
    },
  });

  // Confirm/renew mutation
  const confirmMutation = useMutation({
    mutationFn: confirmListing,
    onSuccess: (data) => {
      toast.success(data.message || "Listing renewed successfully!");
      queryClient.invalidateQueries(["myListings"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to confirm listing");
    },
  });

  const handleDelete = (listingId) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      setDeletingId(listingId);
      deleteMutation.mutate(listingId);
    }
  };

  const handleToggleTaken = (listingId) => {
    setTogglingId(listingId);
    toggleMutation.mutate(listingId);
  };

  const handleConfirm = (listingId) => {
    setConfirmingId(listingId);
    confirmMutation.mutate(listingId);
  };

  // Get expiry status color
  const getExpiryStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-400";
      case "needs_confirmation":
        return "text-yellow-400";
      case "warning":
        return "text-orange-400";
      case "expired":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  // Get expiry status badge
  const getExpiryBadge = (status, statusText) => {
    const colors = {
      active: "bg-green-500/20 border-green-500/30 text-green-400",
      needs_confirmation:
        "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
      warning: "bg-orange-500/20 border-orange-500/30 text-orange-400",
      expired: "bg-red-500/20 border-red-500/30 text-red-400",
    };
    return (
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full border ${colors[status] || colors.active}`}
      >
        {statusText || status}
      </span>
    );
  };

  if (listingsLoading || userLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (listingsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Failed to load your listings</p>
      </div>
    );
  }

  const listings = listingsData?.listings || [];
  const user = userData || {};

  // Calculate stats
  const activeListings = listings.filter(
    (l) => !l.is_taken && l.is_active && !l.is_expired,
  );
  const takenListings = listings.filter((l) => l.is_taken && l.is_active);
  const expiredListings = listings.filter((l) => l.is_expired || !l.is_active);
  const needsConfirmation = listings.filter(
    (l) =>
      l.expiry_status === "needs_confirmation" || l.expiry_status === "warning",
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white heading-gradient">
            My Dashboard
          </h1>
          <p className="text-gray-400 text-sm">
            Welcome back, {user.name || "User"}!
          </p>
        </div>
        <Link to="/create-listing" className="btn-primary text-sm sm:text-base">
          + Post New Listing
        </Link>
      </div>

      {/* User Credibility Badge */}
      {user.badge && (
        <div className="mb-6 p-4 bg-[#0a0a0a] rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="text-2xl">{user.badge.badge}</div>
          <div>
            <p className="text-white font-medium">
              Credibility Score:{" "}
              <span className="text-blue-400">
                {user.credibility_score}/100
              </span>
            </p>
            <p className="text-gray-400 text-sm">
              {user.badge.level === "verified" &&
                "✅ You're a verified user! Your listings are trusted."}
              {user.badge.level === "trusted" &&
                "🟡 You're a trusted user. Keep up the good work!"}
              {user.badge.level === "caution" &&
                "🟠 Your credibility is average. Improve by getting more positive reviews."}
              {user.badge.level === "warning" &&
                "🔴 Your credibility is low. Please address any issues with your listings."}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 shadow-xl">
          <p className="text-gray-400 text-sm">Total</p>
          <p className="text-2xl font-bold text-white">{listings.length}</p>
        </div>
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 shadow-xl">
          <p className="text-gray-400 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-400">
            {activeListings.length}
          </p>
        </div>
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 shadow-xl">
          <p className="text-gray-400 text-sm">Taken</p>
          <p className="text-2xl font-bold text-orange-400">
            {takenListings.length}
          </p>
        </div>
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 shadow-xl">
          <p className="text-gray-400 text-sm">Expired</p>
          <p className="text-2xl font-bold text-red-400">
            {expiredListings.length}
          </p>
        </div>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-[#0a0a0a] rounded-2xl border border-white/10">
          <svg
            className="w-16 h-16 text-gray-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="text-gray-400 mb-4">
            You haven't posted any listings yet
          </p>
          <Link to="/create-listing" className="btn-primary">
            Post Your First Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {listings.map((listing) => {
            const isExpired = listing.is_expired || !listing.is_active;
            const status = listing.expiry_status || "active";
            const statusText = listing.expiry_status_text || "Active";

            return (
              <div
                key={listing.id}
                className={`bg-[#0a0a0a] rounded-2xl border overflow-hidden shadow-xl transition-all duration-300 ${
                  isExpired
                    ? "border-red-500/30 opacity-60"
                    : "border-white/10 hover:border-blue-500/30"
                }`}
              >
                {/* Image */}
                <div className="h-48 bg-[#0a0a0a] relative">
                  {listing.images && listing.images[0] ? (
                    <img
                      src={listing.images[0].thumbnail}
                      alt={listing.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Status Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {listing.is_taken && (
                      <span className="badge-red text-[10px]">Taken</span>
                    )}
                    {isExpired && (
                      <span className="badge-red text-[10px]">Expired</span>
                    )}
                    {!isExpired && !listing.is_taken && (
                      <span className="badge-green text-[10px]">Active</span>
                    )}
                  </div>

                  {/* Expiry Status Badge */}
                  <div className="absolute top-3 right-3">
                    {getExpiryBadge(status, statusText)}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 text-white truncate">
                    {listing.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {listing.location}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <p className="text-transparent bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text font-bold text-xl">
                      KSh {listing.price?.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Renewals: {listing.renewal_count || 0}
                    </p>
                  </div>

                  {/* WhatsApp Verification Status */}
                  {listing.whatsapp_sent_at && (
                    <div className="mb-3 text-[10px] text-gray-500">
                      📱 WhatsApp:{" "}
                      {listing.whatsapp_replied ? (
                        <span className="text-green-400">✓ Verified</span>
                      ) : (
                        <span className="text-yellow-400">
                          ⏳ Awaiting reply
                        </span>
                      )}
                      {listing.whatsapp_replied &&
                        listing.whatsapp_response && (
                          <span className="ml-1">
                            (
                            {listing.whatsapp_response === "yes"
                              ? "Available"
                              : "Taken"}
                            )
                          </span>
                        )}
                    </div>
                  )}

                  {/* Days Remaining */}
                  {!isExpired &&
                    !listing.is_taken &&
                    listing.days_remaining !== undefined && (
                      <p
                        className={`text-xs mb-3 ${getExpiryStatusColor(status)}`}
                      >
                        {status === "active" &&
                          `✅ ${listing.days_remaining} days remaining`}
                        {status === "needs_confirmation" &&
                          `⏰ ${listing.days_remaining} days remaining - Please confirm availability`}
                        {status === "warning" &&
                          `⚠️ ${listing.days_remaining} days remaining - Expiring soon!`}
                      </p>
                    )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/edit-listing/${listing.id}`}
                      className="flex-1 text-center bg-white/5 hover:bg-white/10 text-gray-300 py-2 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all duration-300 text-sm"
                    >
                      Edit
                    </Link>

                    {/* Confirm/Renew Button - Show for active listings needing confirmation */}
                    {!isExpired && !listing.is_taken && (
                      <button
                        onClick={() => handleConfirm(listing.id)}
                        disabled={confirmingId === listing.id}
                        className={`flex-1 py-2 rounded-xl transition-all duration-300 text-sm ${
                          status === "active"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:bg-blue-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/30 animate-pulse"
                        }`}
                      >
                        {confirmingId === listing.id ? "..." : "Renew"}
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleTaken(listing.id)}
                      disabled={togglingId === listing.id || isExpired}
                      className={`flex-1 py-2 rounded-xl transition-all duration-300 text-sm ${
                        isExpired
                          ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                          : listing.is_taken
                            ? "bg-green-500/20 text-green-400 border border-green-500/20 hover:bg-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/30"
                      }`}
                    >
                      {togglingId === listing.id
                        ? "..."
                        : listing.is_taken
                          ? "Mark Available"
                          : "Mark Taken"}
                    </button>

                    <button
                      onClick={() => handleDelete(listing.id)}
                      disabled={deletingId === listing.id}
                      className="flex-1 bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30 py-2 rounded-xl transition-all duration-300 text-sm"
                    >
                      {deletingId === listing.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
