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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Failed to load favorites</p>
      </div>
    );
  }

  const favorites = data?.favorites || [];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6 heading-gradient">
        My Favorites
      </h1>

      {favorites.length === 0 ? (
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
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <p className="text-gray-400 mb-4">
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
                <div className="aspect-[4/3] bg-[#0a0a0a] overflow-hidden">
                  {fav.listing.cover_image ? (
                    <img
                      src={fav.listing.cover_image}
                      alt={fav.listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
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
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 text-white group-hover:text-blue-400 transition line-clamp-1">
                    {fav.listing.title}
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
                    {fav.listing.location}
                  </p>
                  <p className="text-transparent bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text font-bold text-xl">
                    KSh {fav.listing.price?.toLocaleString()}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => handleToggleFavorite(fav.listing.id)}
                className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm hover:bg-red-500/20 p-2 rounded-full border border-white/10 hover:border-red-500/30 transition-all duration-300 group/btn"
                title="Remove from favorites"
              >
                <svg
                  className="w-5 h-5 text-red-400 hover:text-red-500 transition"
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
