// src/pages/HomePage.jsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom"; // ✅ You already have this import
import API from "../services/api";
import toast from "react-hot-toast";

const fetchListings = async () => {
  const { data } = await API.get("/listings");
  return data;
};

export default function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["listings"],
    queryFn: fetchListings,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    toast.error("Failed to load listings");
    return (
      <div className="text-center py-12">
        <p className="text-red-500">
          Failed to load listings. Please try again.
        </p>
      </div>
    );
  }

  const listings = data?.listings || [];

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          No listings found. Be the first to post!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map((listing) => (
        // ✅ Wrap the entire card with Link
        <Link key={listing.id} to={`/listing/${listing.id}`}>
          <div className="card group cursor-pointer transition-transform hover:scale-[1.02]">
            {listing.cover_image ? (
              <img
                src={listing.cover_image}
                alt={listing.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
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
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                {listing.title}
              </h3>
              <p className="text-gray-500 text-sm mb-2 flex items-center gap-1">
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
              <p className="text-primary-600 font-bold text-xl">
                KSh {listing.price?.toLocaleString()}
              </p>
              {listing.is_taken && (
                <span className="inline-block mt-2 bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                  Taken
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
