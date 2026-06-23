// src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";

// House types for filter dropdown
const HOUSE_TYPES = [
  { value: "", label: "All Types" },
  { value: "bedsitter", label: "Bedsitter" },
  { value: "studio", label: "Studio" },
  { value: "single_room", label: "Single Room" },
  { value: "1bed_bungalow", label: "1 Bedroom Bungalow" },
  { value: "2bed_bungalow", label: "2 Bedroom Bungalow" },
  { value: "1bed_apartment", label: "1 Bedroom Apartment" },
  { value: "2bed_apartment", label: "2 Bedroom Apartment" },
  { value: "3bed_apartment", label: "3 Bedroom Apartment" },
  { value: "commercial", label: "Commercial Space" },
];

// Sort options
const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const fetchListings = async (params) => {
  const { data } = await API.get("/listings", { params });
  return data;
};

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get search params from URL
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    house_type: searchParams.get("house_type") || "",
    location: searchParams.get("location") || "",
    price_min: searchParams.get("price_min") || "",
    price_max: searchParams.get("price_max") || "",
    sort_by: searchParams.get("sort_by") || "newest",
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["listings", filters],
    queryFn: () => fetchListings(filters),
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    refetch();
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      house_type: "",
      location: "",
      price_min: "",
      price_max: "",
      sort_by: "newest",
    });
  };

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

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by title, location, or description..."
              className="flex-1 min-w-[200px] input"
            />
            <button type="submit" className="btn-primary">
              Search
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 block mb-1">
                Property Type
              </label>
              <select
                name="house_type"
                value={filters.house_type}
                onChange={handleFilterChange}
                className="input"
              >
                {HOUSE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 block mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="e.g., Kilimani"
                className="input"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 block mb-1">
                Min Price
              </label>
              <input
                type="number"
                name="price_min"
                value={filters.price_min}
                onChange={handleFilterChange}
                placeholder="0"
                className="input"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 block mb-1">
                Max Price
              </label>
              <input
                type="number"
                name="price_max"
                value={filters.price_max}
                onChange={handleFilterChange}
                placeholder="1000000"
                className="input"
              />
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="text-xs text-gray-500 block mb-1">
                Sort By
              </label>
              <select
                name="sort_by"
                value={filters.sort_by}
                onChange={handleFilterChange}
                className="input"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(filters.search ||
            filters.house_type ||
            filters.location ||
            filters.price_min ||
            filters.price_max) && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {data?.total || 0} results found
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-primary-600 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No listings found. Try adjusting your filters or{" "}
            <Link
              to="/create-listing"
              className="text-primary-600 hover:underline"
            >
              post your own listing!
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <Link key={listing.id} to={`/listing/${listing.id}`}>
              <div className="card group cursor-pointer transition-transform hover:scale-[1.02]">
                {listing.cover_image ? (
                  <div className="w-full h-48 bg-gray-100 overflow-hidden">
                    <img
                      src={listing.cover_image}
                      alt={listing.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
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
      )}
    </div>
  );
}
