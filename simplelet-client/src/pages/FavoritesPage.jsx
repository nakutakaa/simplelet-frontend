// src/pages/FavoritesPage.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";

const fetchFavorites = async () => {
  const { data } = await API.get("/favorites/my-favorites");
  return data;
};

const toggleFavorite = async (listingId) => {
  const { data } = await API.post(`/favorites/listings/${listingId}`);
  return data;
};

export default function FavoritesPage() {
  const queryClient = useQueryClient();

  // Fetch favorites
  const { data, isLoading, error } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
  });

  // Toggle favorite mutation
  const mutation = useMutation({
    mutationFn: toggleFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries(["favorites"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to update favorite");
    },
  });

  const handleToggleFavorite = (listingId) => {
    mutation.mutate(listingId);
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
        <p className="text-red-500">Failed to load favorites</p>
      </div>
    );
  }

  const favorites = data?.favorites || [];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">My Favorites</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 mb-4">
            You haven't saved any listings yet
          </p>
          <Link to="/" className="btn-primary">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => (
            <div key={fav.id} className="card group relative">
              <Link to={`/listing/${fav.listing.id}`}>
                {fav.listing.cover_image ? (
                  <img
                    src={fav.listing.cover_image}
                    alt={fav.listing.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
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
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">
                    {fav.listing.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-2">
                    {fav.listing.location}
                  </p>
                  <p className="text-primary-600 font-bold text-xl">
                    KSh {fav.listing.price?.toLocaleString()}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => handleToggleFavorite(fav.listing.id)}
                className="absolute top-2 right-2 bg-white/90 hover:bg-red-50 p-2 rounded-full shadow-md transition"
                title="Remove from favorites"
              >
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
