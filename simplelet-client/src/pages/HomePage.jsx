// src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";
import SafetyTip from "../components/SafetyTip";
import SimpleAmbientBackground from "../components/SimpleAmbientBackground";
import { useRealTimeListings } from "../hooks";
import slateBg from "../assets/images/slate-bg.jpg";

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
  { value: "distance", label: "Nearest First" },
];

// Property type similarity mapping
const PROPERTY_TYPE_SIMILARITY = {
  studio: ["bedsitter", "single_room"],
  bedsitter: ["studio", "single_room"],
  single_room: ["studio", "bedsitter"],
  "1bed_apartment": ["1bed_bungalow", "2bed_apartment"],
  "1bed_bungalow": ["1bed_apartment", "2bed_bungalow"],
  "2bed_apartment": ["1bed_apartment", "2bed_bungalow", "3bed_apartment"],
  "2bed_bungalow": ["1bed_bungalow", "2bed_apartment"],
  "3bed_apartment": ["2bed_apartment", "3bed_bungalow"],
};

const fetchListings = async (params) => {
  const { data } = await API.get("/listings", { params });
  return data;
};

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Separate state for search input (local only, no API trigger)
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    house_type: searchParams.get("house_type") || "",
    location: searchParams.get("location") || "",
    price_min: searchParams.get("price_min") || "",
    price_max: searchParams.get("price_max") || "",
    sort_by: searchParams.get("sort_by") || "newest",
    nearby: searchParams.get("nearby") || "",
  });

  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showNearby, setShowNearby] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const userId = currentUser?.id || currentUser?.user_id || null;
  const { newListings } = useRealTimeListings(null, userId, filters);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["listings", filters],
    queryFn: () => fetchListings(filters),
  });

  const allListings = [
    ...(newListings || []),
    ...((Array.isArray(data) ? data : data?.data || data?.listings || []) || []),
  ];

  const uniqueListingsMap = new Map();
  allListings.forEach((listing) => {
    if (!uniqueListingsMap.has(listing.id)) {
      uniqueListingsMap.set(listing.id, listing);
    }
  });
  const uniqueListings = Array.from(uniqueListingsMap.values());

  useEffect(() => {
    if (error) {
      toast.error("Failed to load listings");
    }
  }, [error]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // ============ HANDLERS ============

  // Update search input (local state only) – does NOT trigger API
  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  // On form submit: update filters.search and refetch
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput }));
    refetch();
  };

  // Handle filter dropdown/input changes (non-search)
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    // Refetch automatically because filters changed and useQuery will detect
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      house_type: "",
      location: "",
      price_min: "",
      price_max: "",
      sort_by: "newest",
      nearby: "",
    });
    setSearchInput("");
    setShowNearby(false);
    setUserLocation(null);
    refetch();
  };

  // ============ GET USER LOCATION FOR NEARBY SEARCH ============
  const getUserLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setShowNearby(true);
          setFilters((prev) => ({
            ...prev,
            nearby: `${latitude},${longitude}`,
            sort_by: "distance",
          }));
          toast.success("📍 Location found! Showing nearby listings.");
          setIsGettingLocation(false);
          refetch();
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error(
            "Could not get your location. Please enable location services.",
          );
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
      setIsGettingLocation(false);
    }
  };

  // ============ GET SIMILAR PROPERTY TYPES ============
  const getSimilarTypes = (type) => {
    if (!type) return [];
    return PROPERTY_TYPE_SIMILARITY[type] || [];
  };

  // ============ RENDER SUGGESTIONS ============
  const renderSuggestions = () => {
    const currentType = filters.house_type;
    if (!currentType) return null;

    const similarTypes = getSimilarTypes(currentType);
    if (similarTypes.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <span className="text-xs text-gray-400">Similar types:</span>
        {similarTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setFilters((prev) => ({ ...prev, house_type: type }));
            }}
            className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-2 py-0.5 rounded-full border border-white/10 transition"
          >
            {HOUSE_TYPES.find((t) => t.value === type)?.label || type}
          </button>
        ))}
      </div>
    );
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
    return (
      <div className="text-center py-12">
        <p className="text-red-400">
          Failed to load listings. Please try again.
        </p>
        <button onClick={() => refetch()} className="btn-primary mt-4 text-sm">
          Retry
        </button>
      </div>
    );
  }

  const listings = uniqueListings;
  const hasLocation = userLocation || filters.nearby;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed space-y-4 sm:space-y-6 -mx-4 sm:-mx-6 lg:-mx-8 p-4 sm:p-6 lg:p-8"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(${slateBg})`,
        backgroundAttachment: "fixed",
      }}
    >
      {/* New Listings Notification */}
      {newListings.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between backdrop-blur-sm">
          <span className="text-sm text-emerald-300 flex items-center gap-2">
            <span className="animate-pulse">🔔</span>
            {newListings.length} new listing{newListings.length > 1 ? "s" : ""}{" "}
            matching your search!
          </span>
          <button
            onClick={() => refetch()}
            className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-3 py-1 rounded-lg transition"
          >
            View New
          </button>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-black/90 backdrop-blur-md rounded-2xl border border-white/10 p-4 sm:p-6 shadow-xl">
        <SafetyTip page="search" className="mb-4" />

        <form onSubmit={handleSearchSubmit} className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="search"
              placeholder="Search properties..."
              className="flex-1 input"
              value={searchInput}
              onChange={handleSearchInputChange}
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

          {/* ============ NEARBY SEARCH BUTTON ============ */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/10">
            <SafetyTip page="price" className="w-full mb-2" />

            <button
              type="button"
              onClick={getUserLocation}
              disabled={isGettingLocation}
              className={`text-xs px-3 py-1.5 rounded-xl transition ${
                showNearby
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              {isGettingLocation ? (
                <>
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full mr-1.5"></span>
                  Getting location...
                </>
              ) : showNearby ? (
                "📍 Nearby mode ON"
              ) : (
                "📍 Show Nearby"
              )}
            </button>

            {showNearby && (
              <button
                type="button"
                onClick={() => {
                  setShowNearby(false);
                  setUserLocation(null);
                  setFilters((prev) => ({
                    ...prev,
                    nearby: "",
                    sort_by: "newest",
                  }));
                  refetch();
                }}
                className="text-xs text-red-400 hover:text-red-300 transition"
              >
                ✕ Turn off nearby
              </button>
            )}

            {hasLocation && showNearby && (
              <span className="text-[10px] text-gray-500">
                Showing listings near you
              </span>
            )}
          </div>

          {/* Similar Types Suggestions */}
          {renderSuggestions()}

          {/* Active Filters Summary */}
          {(filters.search ||
            filters.house_type ||
            filters.location ||
            filters.price_min ||
            filters.price_max ||
            showNearby) && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-white/10 pt-3">
              <span className="text-xs text-gray-500">
                {data?.total || 0} results found
                {showNearby && " 📍 Nearby"}
                {filters.house_type &&
                  ` • ${HOUSE_TYPES.find((t) => t.value === filters.house_type)?.label}`}
                {filters.location && ` • 📍 ${filters.location}`}
                {filters.price_min && ` • From KSh ${filters.price_min}`}
                {filters.price_max && ` • To KSh ${filters.price_max}`}
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
        <div className="text-center py-12 sm:py-16 bg-black/90 backdrop-blur-md rounded-2xl border border-white/10">
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
          {showNearby && (
            <button
              onClick={() => {
                setShowNearby(false);
                setUserLocation(null);
                setFilters((prev) => ({
                  ...prev,
                  nearby: "",
                  sort_by: "newest",
                }));
                refetch();
              }}
              className="btn-outline text-sm mt-4"
            >
              Turn off nearby search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ============ SMART SEARCH RESULT INFO ============ */}
          {filters.house_type && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 bg-black/80 backdrop-blur-sm p-2 rounded-xl border border-white/5">
              <span>🔍 Showing:</span>
              <span className="text-white font-medium">
                {HOUSE_TYPES.find((t) => t.value === filters.house_type)?.label}
              </span>
              {getSimilarTypes(filters.house_type).length > 0 && (
                <>
                  <span>+ similar:</span>
                  {getSimilarTypes(filters.house_type).map((type) => (
                    <span key={type} className="text-gray-300">
                      {HOUSE_TYPES.find((t) => t.value === type)?.label}
                    </span>
                  ))}
                </>
              )}
              {showNearby && (
                <span className="text-blue-400 ml-2">📍 Nearby</span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {listings.map((listing) => {
              const expiry = getExpiryStatus(
                listing.expiry_status,
                listing.expiry_status_text,
              );
              const isExpired =
                listing.is_expired || listing.expiry_status === "expired";
              const hasBadge = listing.author?.badge;
              const isSimilar =
                filters.house_type &&
                listing.house_type !== filters.house_type &&
                getSimilarTypes(filters.house_type).includes(
                  listing.house_type,
                );

              return (
                <SimpleAmbientBackground
                  key={listing.id}
                  imageUrl={listing.cover_image}
                  intensity={0.2}
                  blur={40}
                  className="rounded-xl overflow-hidden transition-colors duration-700 shadow-xl"
                >
                  <Link to={`/listing/${listing.id}`}>
                    <div
                      className={`card group ${isExpired ? "opacity-60" : ""}`}
                    >
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

                        {/* Similar Type Badge */}
                        {isSimilar && (
                          <span className="absolute bottom-2 left-2 bg-blue-500/80 text-white text-[8px] px-2 py-0.5 rounded-full">
                            Similar
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

                        {/* Days remaining */}
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
                </SimpleAmbientBackground>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}