// src/pages/HomePage.jsx
import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";
import SafetyTip from "../components/SafetyTip";
import SimpleAmbientBackground from "../components/SimpleAmbientBackground";
import ListingStoriesModal from "../components/ListingStoriesModal";
import { useRealTimeListings } from "../hooks";
import slateBg from "../assets/images/slate-bg.jpg";

const HOUSE_TYPES = [
  { value: "", label: "All Types" },
  { value: "bedsitter", label: "Bedsitter" },
  { value: "studio", label: "Studio" },
  { value: "single_room", label: "Single Room" },
  { value: "1bed_bungalow", label: "1 Bed Bungalow" },
  { value: "2bed_bungalow", label: "2 Bed Bungalow" },
  { value: "1bed_apartment", label: "1 Bed Apartment" },
  { value: "2bed_apartment", label: "2 Bed Apartment" },
  { value: "3bed_apartment", label: "3 Bed Apartment" },
  { value: "commercial", label: "Commercial Space" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "distance", label: "Nearest First" },
];

const fetchListings = async (params) => {
  const { data } = await API.get("/listings", { params });
  return data;
};

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef(null);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || "");

  // Stories Modal state
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  const [filters, setFilters] = useState(() => ({
    house_type: searchParams.get("house_type") || "",
    location: searchParams.get("location") || "",
    price_min: searchParams.get("price_min") || "",
    price_max: searchParams.get("price_max") || "",
    sort_by: searchParams.get("sort_by") || "newest",
    nearby: searchParams.get("nearby") || "",
  }));

  const [activeFilters, setActiveFilters] = useState(() => ({
    search: searchParams.get("search") || "",
    house_type: searchParams.get("house_type") || "",
    location: searchParams.get("location") || "",
    price_min: searchParams.get("price_min") || "",
    price_max: searchParams.get("price_max") || "",
    sort_by: searchParams.get("sort_by") || "newest",
    nearby: searchParams.get("nearby") || "",
  }));

  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showNearby, setShowNearby] = useState(Boolean(searchParams.get("nearby")));

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const userId = currentUser?.id || currentUser?.user_id || null;

  const { newListings = [] } = useRealTimeListings(null, userId, activeFilters);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["listings", activeFilters],
    queryFn: () => fetchListings(activeFilters),
  });

  const updateURL = useCallback((paramsToUpdate) => {
    const params = new URLSearchParams();
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  const executeSearch = () => {
    const newActive = { ...filters, search: searchInput };
    setActiveFilters(newActive);
    updateURL(newActive);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch();
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeSearch();
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);

    if (name === "house_type" || name === "sort_by") {
      const newActive = { ...updatedFilters, search: activeFilters.search };
      setActiveFilters(newActive);
      updateURL(newActive);
    }
  };

  const clearFilters = () => {
    const reset = {
      search: "",
      house_type: "",
      location: "",
      price_min: "",
      price_max: "",
      sort_by: "newest",
      nearby: "",
    };
    setSearchInput("");
    setFilters(reset);
    setActiveFilters(reset);
    setShowNearby(false);
    setUserLocation(null);
    updateURL(reset);
  };

  const getUserLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const coordsString = `${latitude},${longitude}`;
          setUserLocation({ lat: latitude, lng: longitude });
          setShowNearby(true);

          const updatedFilters = {
            ...filters,
            nearby: coordsString,
            sort_by: "distance",
          };
          setFilters(updatedFilters);

          const newActive = { ...updatedFilters, search: activeFilters.search };
          setActiveFilters(newActive);
          updateURL(newActive);
          toast.success("Location found! Showing nearby listings.");
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Could not get your location.");
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
      setIsGettingLocation(false);
    }
  };

  const rawData = Array.isArray(data) ? data : data?.data || data?.listings || [];
  const allListings = [...newListings, ...rawData];
  const uniqueListingsMap = new Map();
  allListings.forEach((listing) => {
    if (listing?.id && !uniqueListingsMap.has(listing.id)) {
      uniqueListingsMap.set(listing.id, listing);
    }
  });
  const listings = Array.from(uniqueListingsMap.values());

  const handleOpenStories = (index = 0) => {
    if (listings.length === 0) return;
    setSelectedStoryIndex(index);
    setIsStoryModalOpen(true);
  };

  const getExpiryStatus = (status, statusText) => {
    const configs = {
      active: { color: "text-green-400", bg: "bg-green-500/20", label: "Available" },
      needs_confirmation: { color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Confirm Soon" },
      warning: { color: "text-orange-400", bg: "bg-orange-500/20", label: "Expiring Soon" },
      expired: { color: "text-red-400", bg: "bg-red-500/20", label: "Expired" },
    };
    const config = configs[status] || configs.active;
    return { ...config, label: statusText || config.label };
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
        <p className="text-red-400 text-sm sm:text-base">Failed to load listings. Please try again.</p>
        <button onClick={() => refetch()} className="btn-primary mt-4 text-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed space-y-4 sm:space-y-6 rounded-2xl p-2 sm:p-6 lg:p-8"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url(${slateBg})`,
        backgroundAttachment: "fixed",
      }}
    >
      {newListings.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between backdrop-blur-sm">
          <span className="text-xs sm:text-sm text-emerald-300 flex items-center gap-2">
            <span className="animate-pulse">●</span>
            {newListings.length} new listing{newListings.length > 1 ? "s" : ""} matching your search!
          </span>
          <button
            onClick={() => refetch()}
            className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-3 py-1 rounded-lg transition"
          >
            View New
          </button>
        </div>
      )}

      {/* Search and Filter Panel */}
      <div className="bg-black/90 backdrop-blur-md rounded-2xl border border-white/10 p-3 sm:p-6 shadow-xl">
        <SafetyTip page="search" className="mb-3 sm:mb-4" />

        <form onSubmit={handleSearchSubmit} className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              ref={searchInputRef}
              type="text"
              name="search"
              placeholder="Search properties, areas..."
              className="flex-1 input text-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1 sm:flex-none text-sm py-2 px-4">
                Search
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="sm:hidden px-3 py-2 bg-white/10 text-xs text-gray-300 rounded-lg border border-white/10 flex items-center gap-1"
              >
                Filters {mobileFiltersOpen ? "▲" : "▼"}
              </button>
            </div>
          </div>

          {/* Filters Grid */}
          <div className={`${mobileFiltersOpen ? "block" : "hidden sm:grid"} grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 pt-2`}>
            <div>
              <label className="label text-[11px] sm:text-xs">Type</label>
              <select
                name="house_type"
                value={filters.house_type}
                onChange={handleFilterChange}
                className="input text-xs sm:text-sm"
              >
                {HOUSE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label text-[11px] sm:text-xs">Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="e.g., Kilimani"
                className="input text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="label text-[11px] sm:text-xs">Min Price</label>
              <input
                type="number"
                name="price_min"
                value={filters.price_min}
                onChange={handleFilterChange}
                placeholder="0"
                className="input text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="label text-[11px] sm:text-xs">Max Price</label>
              <input
                type="number"
                name="price_max"
                value={filters.price_max}
                onChange={handleFilterChange}
                placeholder="100000"
                className="input text-xs sm:text-sm"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="label text-[11px] sm:text-xs">Sort By</label>
              <select
                name="sort_by"
                value={filters.sort_by}
                onChange={handleFilterChange}
                className="input text-xs sm:text-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Bar with Nearby and Stories View Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2">
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
                  "Nearby mode ON"
                ) : (
                  "Show Nearby"
                )}
              </button>

              {showNearby && (
                <button
                  type="button"
                  onClick={() => {
                    setShowNearby(false);
                    setUserLocation(null);
                    const updatedFilters = { ...filters, nearby: "", sort_by: "newest" };
                    setFilters(updatedFilters);
                    const newActive = { ...updatedFilters, search: activeFilters.search };
                    setActiveFilters(newActive);
                    updateURL(newActive);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 transition"
                >
                  Turn off nearby
                </button>
              )}
            </div>

            {listings.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenStories(0)}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <span>Watch Stories</span>
              </button>
            )}
          </div>

          {/* Active Filters Summary */}
          {(activeFilters.search ||
            activeFilters.house_type ||
            activeFilters.location ||
            activeFilters.price_min ||
            activeFilters.price_max ||
            showNearby) && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-t border-white/10 pt-2 text-xs">
              <span className="text-gray-400">
                {data?.total || listings.length} results found
                {showNearby && " • Nearby"}
                {activeFilters.house_type &&
                  ` • ${HOUSE_TYPES.find((t) => t.value === activeFilters.house_type)?.label}`}
                {activeFilters.location && ` • ${activeFilters.location}`}
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-blue-400 hover:text-blue-300 transition underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Listings Grid with Stories Tap trigger */}
      {listings.length === 0 ? (
        <div className="text-center py-12 bg-black/90 backdrop-blur-md rounded-2xl border border-white/10">
          <p className="text-gray-400 text-sm">
            No listings found. Try adjusting filters or{" "}
            <Link to="/create-listing" className="text-blue-400 hover:text-blue-300">
              post your listing!
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {listings.map((listing, index) => {
            const expiry = getExpiryStatus(
              listing.expiry_status,
              listing.expiry_status_text
            );
            const isExpired = listing.is_expired || listing.expiry_status === "expired";

            return (
              <SimpleAmbientBackground
                key={listing.id}
                imageUrl={listing.cover_image || listing.images?.[0]?.url}
                intensity={0.2}
                blur={40}
                className="rounded-xl overflow-hidden shadow-xl cursor-pointer"
              >
                <div onClick={() => handleOpenStories(index)} className={`card group ${isExpired ? "opacity-60" : ""}`}>
                  <div className="aspect-[4/3] bg-[#0a0a0a] overflow-hidden relative">
                    {listing.cover_image || listing.images?.[0]?.url ? (
                      <img
                        src={listing.cover_image || listing.images?.[0]?.url}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-700"
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
                  </div>

                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-sm sm:text-base mb-0.5 line-clamp-1 text-white group-hover:text-blue-400 transition">
                      {listing.title}
                    </h3>

                    <p className="text-gray-400 text-xs mb-1.5 flex items-center gap-1">
                      📍 {listing.location}
                    </p>

                    <div className="flex items-center justify-between">
                      <p className="text-transparent bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text font-bold text-base sm:text-lg">
                        KSh {listing.price?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </SimpleAmbientBackground>
            );
          })}
        </div>
      )}

      {/* Stories Viewer Modal */}
      <ListingStoriesModal
        listings={listings}
        initialIndex={selectedStoryIndex}
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
      />
    </div>
  );
}
