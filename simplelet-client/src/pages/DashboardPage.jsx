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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load your listings</p>
      </div>
    );
  }

  const listings = data?.listings || [];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <Link to="/create-listing" className="btn-primary">
          + Post New Listing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total Listings</p>
          <p className="text-2xl font-bold">{listings.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Active Listings</p>
          <p className="text-2xl font-bold text-green-600">
            {listings.filter((l) => !l.is_taken && l.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Taken</p>
          <p className="text-2xl font-bold text-orange-600">
            {listings.filter((l) => l.is_taken && l.is_active).length}
          </p>
        </div>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500 mb-4">
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
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              {/* Image */}
              <div className="h-48 bg-gray-200 relative">
                {listing.images && listing.images[0] ? (
                  <img
                    src={listing.images[0].thumbnail}
                    alt={listing.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                {listing.is_taken && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                    Taken
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{listing.title}</h3>
                <p className="text-gray-500 text-sm mb-2">{listing.location}</p>
                <p className="text-primary-600 font-bold text-xl mb-3">
                  KSh {listing.price?.toLocaleString()}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    to={`/edit-listing/${listing.id}`}
                    className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggleTaken(listing.id)}
                    disabled={togglingId === listing.id}
                    className={`flex-1 py-2 rounded-lg transition ${
                      listing.is_taken
                        ? "bg-green-100 hover:bg-green-200 text-green-700"
                        : "bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
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
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg transition"
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
