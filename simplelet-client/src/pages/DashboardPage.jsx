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

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Fetch listings
  const { data, isLoading, error } = useQuery({
    queryKey: ["myListings"],
    queryFn: fetchMyListings,
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Failed to load your listings</p>
      </div>
    );
  }

  const listings = data?.listings || [];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white heading-gradient">
          My Listings
        </h1>
        <Link to="/create-listing" className="btn-primary text-sm sm:text-base">
          + Post New Listing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 shadow-xl">
          <p className="text-gray-400 text-sm">Total Listings</p>
          <p className="text-2xl font-bold text-white">{listings.length}</p>
        </div>
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 shadow-xl">
          <p className="text-gray-400 text-sm">Active Listings</p>
          <p className="text-2xl font-bold text-green-400">
            {listings.filter((l) => !l.is_taken && l.is_active).length}
          </p>
        </div>
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 shadow-xl">
          <p className="text-gray-400 text-sm">Taken</p>
          <p className="text-2xl font-bold text-orange-400">
            {listings.filter((l) => l.is_taken && l.is_active).length}
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
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden shadow-xl hover:border-blue-500/30 transition-all duration-300"
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
                {listing.is_taken && (
                  <span className="absolute top-3 right-3 badge-red">
                    Taken
                  </span>
                )}
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
                <p className="text-transparent bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text font-bold text-xl mb-3">
                  KSh {listing.price?.toLocaleString()}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/edit-listing/${listing.id}`}
                    className="flex-1 text-center bg-white/5 hover:bg-white/10 text-gray-300 py-2 rounded-xl border border-white/10 hover:border-blue-500/30 transition-all duration-300 text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggleTaken(listing.id)}
                    disabled={togglingId === listing.id}
                    className={`flex-1 py-2 rounded-xl transition-all duration-300 text-sm ${
                      listing.is_taken
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
          ))}
        </div>
      )}
    </div>
  );
}
