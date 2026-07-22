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

  // Get expiry status color and label
  const getExpiryStatus = (status, statusText) => {
    const configs = {
      active: {
        color: "text-green-400",
        bg: "bg-green-500/20",
        label: "✅ Available",
      },
      needs_confirmation: {
        color: "text-yellow-400",
        bg: "bg-yellow-500/20",
        label: "⏰ Confirm Soon",
      },
      warning: {
        color: "text-orange-400",
        bg: "bg-orange-500/20",
        label: "⚠️ Expiring Soon",
      },
      expired: {
        color: "text-red-400",
        bg: "bg-red-500/20",
        label: "❌ Expired",
      },
    };
    const config = configs[status] || configs.active;
    return { ...config, label: statusText || config.label };
  };

  // Get credibility badge
  const getCredibilityBadge = (badge) => {
    if (!badge) return null;
    const icons = {
      verified: "🟢",
      trusted: "🟡",
      caution: "🟠",
      warning: "🔴",
    };
    return icons[badge.level] || "⚪";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    toast.error("Failed to load listings");
    return (
      <div className="text-center py-12">
        <p className="text-red-400">
          Failed to load listings. Please try again.
        </p>
      </div>
    );
  }

  const listings = data?.listings || [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search and Filter Bar */}
      <div className="bg-black rounded-2xl border border-white/10 p-4 sm:p-6 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search properties..."
              className="flex-1 input"
            />
            <button type="submit" className="btn-primary w-full sm:w-auto">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              Search
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            <div>
              <label className="label">Type</label>
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

            <div>
              <label className="label">Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="e.g., Kilimani"
                className="input"
              />
            </div>

            <div>
              <label className="label">Min Price</label>
              <input
                type="number"
                name="price_min"
                value={filters.price_min}
                onChange={handleFilterChange}
                placeholder="0"
                className="input"
              />
            </div>

            <div>
              <label className="label">Max Price</label>
              <input
                type="number"
                name="price_max"
                value={filters.price_max}
                onChange={handleFilterChange}
                placeholder="1000000"
                className="input"
              />
            </div>

            <div>
              <label className="label">Sort By</label>
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
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-white/10 pt-3">
              <span className="text-xs text-gray-500">
                {data?.total || 0} results found
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                Clear all filters ✕
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Listings Grid */}
      {listings.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-black rounded-2xl border border-white/10">
          <svg
            className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4"
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
          <p className="text-gray-400 text-sm sm:text-base">
            No listings found. Try adjusting your filters or{" "}
            <Link
              to="/create-listing"
              className="text-blue-400 hover:text-blue-300 transition"
            >
              post your own listing!
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {listings.map((listing) => {
            const expiry = getExpiryStatus(
              listing.expiry_status,
              listing.expiry_status_text,
            );
            const isExpired =
              listing.is_expired || listing.expiry_status === "expired";
            const hasBadge = listing.author?.badge;

            return (
              <Link key={listing.id} to={`/listing/${listing.id}`}>
                <div className={`card group ${isExpired ? "opacity-60" : ""}`}>
                  <div className="aspect-[4/3] bg-[#0a0a0a] overflow-hidden relative">
                    {listing.cover_image ? (
                      <img
                        src={listing.cover_image}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-12 h-12 sm:w-16 sm:h-16 text-gray-700"
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

                    {/* Status Badge on Image */}
                    {listing.is_taken ? (
                      <span className="absolute top-2 right-2 bg-red-500/90 text-white text-[10px] px-2 py-0.5 rounded-full">
                        Taken
                      </span>
                    ) : isExpired ? (
                      <span className="absolute top-2 right-2 bg-red-500/90 text-white text-[10px] px-2 py-0.5 rounded-full">
                        Expired
                      </span>
                    ) : (
                      <span
                        className={`absolute top-2 right-2 ${expiry.bg} ${expiry.color} text-[10px] px-2 py-0.5 rounded-full border border-current/20`}
                      >
                        {expiry.label}
                      </span>
                    )}

                    {/* Credibility Badge on Image */}
                    {hasBadge && (
                      <span className="absolute top-2 left-2 text-xs">
                        {getCredibilityBadge(hasBadge)}
                      </span>
                    )}
                  </div>

                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-sm sm:text-base mb-0.5 line-clamp-1 text-white group-hover:text-blue-400 transition">
                      {listing.title}
                    </h3>

                    <p className="text-gray-500 text-xs sm:text-sm mb-1.5 flex items-center gap-1">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
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

                    <div className="flex items-center justify-between">
                      <p className="text-transparent bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text font-bold text-base sm:text-xl">
                        KSh {listing.price?.toLocaleString()}
                      </p>
                      {listing.true_monthly_cost &&
                        listing.true_monthly_cost !== listing.price && (
                          <p className="text-[10px] text-gray-500">
                            +
                            {listing.service_charge
                              ? `KSh ${listing.service_charge}`
                              : ""}
                          </p>
                        )}
                    </div>

                    {/* Days remaining (if not expired) */}
                    {!isExpired &&
                      !listing.is_taken &&
                      listing.days_remaining !== undefined && (
                        <p className={`text-[10px] mt-1 ${expiry.color}`}>
                          {listing.days_remaining} days remaining
                        </p>
                      )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
