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
  { value: "", label: "All Property Types" },
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

  // Primary filters state for queries and URL params
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    house_type: searchParams.get("house_type") || "",
    location: searchParams.get("location") || "",
    price_min: searchParams.get("price_min") || "",
    price_max: searchParams.get("price_max") || "",
    sort_by: searchParams.get("sort_by") || "newest",
    nearby: searchParams.get("nearby") || "",
  });

  // Local state for fast text input typing before debouncing triggers state update
  const [searchInput, setSearchInput] = useState(filters.search);

  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showNearby, setShowNearby] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const userId = currentUser?.id || currentUser?.user_id || null;
  const { newListings } = useRealTimeListings(null, userId, filters);

  // Debounce user input to prevent refetching/reloading on every single character
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput]);

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

  // Sync URL search params cleanly without forcing full component reloads
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, search: searchInput }));
    refetch();
  };

  const clearFilters = () => {
    setSearchInput("");
    setFilters({
      search: "",
      house_type: "",
      location: "",
      price_min: "",
      price_max: "",
      sort_by: "newest",
      nearby: "",
    });
    setShowNearby(false);
    setUserLocation(null);
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
            "Could not get your location. Please enable location services."
          );
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
      setIsGettingLocation(false);
    }
  };

  const getSimilarTypes = (type) => {
    if (!type) return [];
    return PROPERTY_TYPE_SIMILARITY[type] || [];
  };

  const renderSuggestions = () => {
    const currentType = filters.house_type;
    if (!currentType) return null;

    const similarTypes = getSimilarTypes(currentType);
    if (similarTypes.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-white/10">
        <span className="text-xs font-medium text-slate-400">Suggested categories:</span>
        {similarTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setFilters((prev) => ({ ...prev, house_type: type }));
            }}
            className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-full border border-slate-700/60 transition shadow-sm"
          >
            {HOUSE_TYPES.find((t) => t.value === type)?.label || type}
          </button>
        ))}
      </div>
    );
  };

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
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.85)), url(${slateBg})`,
        backgroundAttachment: "fixed",
      }}
    >
      {/* Realtime Notification */}
      {newListings.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between backdrop-blur-sm shadow-md">
          <span className="text-sm text-emerald-300 flex items-center gap-2 font-medium">
            <span className="animate-pulse">🔔</span>
            {newListings.length} new listing{newListings.length > 1 ? "s" : ""}{" "}
            matching your criteria!
          </span>
          <button
            onClick={() => refetch()}
            className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-lg transition font-semibold"
          >
            View New
          </button>
        </div>
      )}

      {/* Redesigned Search and Filter Section */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4">
        <SafetyTip page="search" />

        <form onSubmit={handleSearchSubmit} className="space-y-4">
          {/* Main Search Input */}
          <div className="relative flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                name="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search properties, areas, keywords..."
                className="w-full bg-slate-950/80 text-white placeholder-slate-400 text-sm sm:text-base rounded-xl pl-11 pr-4 py-3 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
              <svg
                className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
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
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30"
            >
              Search
            </button>
          </div>

          {/* Filter Bar Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">
                Type
              </label>
              <select
                name="house_type"
                value={filters.house_type}
                onChange={handleFilterChange}
                className="w-full bg-slate-950/80 text-white text-sm rounded-xl px-3 py-2.5 border border-slate-800 focus:border-blue-500 outline-none transition"
              >
                {HOUSE_TYPES.map((type) => (
                  <option key={type.value} value={type.value} className="bg-slate-900">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="e.g. Kilimani"
                className="w-full bg-slate-950/80 text-white placeholder-slate-500 text-sm rounded-xl px-3 py-2.5 border border-slate-800 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">
                Min Price
              </label>
              <input
                type="number"
                name="price_min"
                value={filters.price_min}
                onChange={handleFilterChange}
                placeholder="KSh Min"
                className="w-full bg-slate-950/80 text-white placeholder-slate-500 text-sm rounded-xl px-3 py-2.5 border border-slate-800 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">
                Max Price
              </label>
              <input
                type="number"
                name="price_max"
                value={filters.price_max}
                onChange={handleFilterChange}
                placeholder="KSh Max"
                className="w-full bg-slate-950/80 text-white placeholder-slate-500 text-sm rounded-xl px-3 py-2.5 border border-slate-800 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">
                Sort By
              </label>
              <select
                name="sort_by"
                value={filters.sort_by}
                onChange={handleFilterChange}
                className="w-full bg-slate-950/80 text-white text-sm rounded-xl px-3 py-2.5 border border-slate-800 focus:border-blue-500 outline-none transition"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Controls & Geolocation Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={getUserLocation}
                disabled={isGettingLocation}
                className={`text-xs font-semibold px-4 py-2 rounded-xl border transition flex items-center gap-2 ${
                  showNearby
                    ? "bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-sm"
                    : "bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700"
                }`}
              >
                {isGettingLocation ? (
                  <>
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full"></span>
                    Getting location...
                  </>
                ) : showNearby ? (
                  "📍 Nearby Mode Active"
                ) : (
                  "📍 Locate Properties Near Me"
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
            </div>

            {(filters.search ||
              filters.house_type ||
              filters.location ||
              filters.price_min ||
              filters.price_max ||
              showNearby) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
              >
                Reset All Filters ✕
              </button>
            )}
          </div>

          {/* Similar suggestions */}
          {renderSuggestions()}
        </form>
      </div>

      {/* Grid Display */}
      {listings.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl">
          <svg
            className="w-16 h-16 text-slate-600 mx-auto mb-4"
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
          <p className="text-slate-400 text-base">
            No listings found matching your parameters. Try adjusting filters or{" "}
            <Link
              to="/create-listing"
              className="text-blue-400 hover:text-blue-300 transition font-medium"
            >
              post your own listing!
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {listings.map((listing) => {
            const expiry = getExpiryStatus(
              listing.expiry_status,
              listing.expiry_status_text
            );
            const isExpired =
              listing.is_expired || listing.expiry_status === "expired";
            const hasBadge = listing.author?.badge;
            const isSimilar =
              filters.house_type &&
              listing.house_type !== filters.house_type &&
              getSimilarTypes(filters.house_type).includes(listing.house_type);

            return (
              <SimpleAmbientBackground
                key={listing.id}
                imageUrl={listing.cover_image}
                intensity={0.2}
                blur={40}
                className="rounded-xl overflow-hidden transition-all duration-300 shadow-xl hover:shadow-2xl border border-slate-800/80"
              >
                <Link to={`/listing/${listing.id}`}>
                  <div className={`card group ${isExpired ? "opacity-60" : ""}`}>
                    <div className="aspect-[4/3] bg-slate-950 overflow-hidden relative">
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
                            className="w-16 h-16 text-slate-800"
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

                      {listing.is_taken ? (
                        <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
                          Taken
                        </span>
                      ) : isExpired ? (
                        <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
                          Expired
                        </span>
                      ) : (
                        <span
                          className={`absolute top-2 right-2 ${expiry.bg} ${expiry.color} text-[10px] font-semibold px-2 py-0.5 rounded-full border border-current/20 backdrop-blur-sm`}
                        >
                          {expiry.label}
                        </span>
                      )}

                      {hasBadge && (
                        <span className="absolute top-2 left-2 text-xs">
                          {getCredibilityBadge(hasBadge)}
                        </span>
                      )}

                      {isSimilar && (
                        <span className="absolute bottom-2 left-2 bg-indigo-600/90 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full shadow">
                          Similar
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-base mb-1 line-clamp-1 text-white group-hover:text-blue-400 transition">
                        {listing.title}
                      </h3>

                      <p className="text-slate-400 text-xs sm:text-sm mb-2 flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-slate-500"
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
                        </svg>
                        {listing.location}
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-transparent bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text font-bold text-lg">
                          KSh {listing.price?.toLocaleString()}
                        </p>
                        {listing.true_monthly_cost &&
                          listing.true_monthly_cost !== listing.price && (
                            <p className="text-[10px] text-slate-500">
                              +
                              {listing.service_charge
                                ? `KSh ${listing.service_charge}`
                                : ""}
                            </p>
                          )}
                      </div>

                      {!isExpired &&
                        !listing.is_taken &&
                        listing.days_remaining !== undefined && (
                          <p className={`text-[10px] mt-1.5 ${expiry.color}`}>
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
      )}
    </div>
  );
}