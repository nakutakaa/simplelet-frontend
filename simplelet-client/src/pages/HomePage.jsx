// src/pages/HomePage.jsx
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";
import SafetyTip from "../components/SafetyTip";
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

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const fetchListings = async (params) => {
  const { data } = await API.get("/listings", { params });
  return data;
};

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef(null);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  // Form input state (drives live inputs)
  const [filters, setFilters] = useState(() => ({
    search: searchParams.get("search") || "",
    house_type: searchParams.get("house_type") || "",
    location: searchParams.get("location") || "",
    price_min: searchParams.get("price_min") || "",
    price_max: searchParams.get("price_max") || "",
    sort_by: searchParams.get("sort_by") || "newest",
    nearby: searchParams.get("nearby") || "",
  }));

  // Active query parameters used exclusively for TanStack Query requests
  const [activeFilters, setActiveFilters] = useState(filters);

  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showNearby, setShowNearby] = useState(Boolean(searchParams.get("nearby")));

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const userId = currentUser?.id || currentUser?.user_id || null;

  const updateURL = useCallback((paramsToUpdate) => {
    const params = new URLSearchParams();
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Unified debounce: applies text changes softly to activeFilters after 350ms pause
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveFilters(filters);
      updateURL(filters);
    }, 350);

    return () => clearTimeout(timer);
  }, [filters, updateURL]);

  const { newListings = [] } = useRealTimeListings(null, userId, activeFilters);

  // TanStack Query soft background updates
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["listings", activeFilters],
    queryFn: () => fetchListings(activeFilters),
    placeholderData: (previousData) => previousData,
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Instant submission on Enter or button click
    setActiveFilters(filters);
    updateURL(filters);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
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

          const updatedFilters = { ...filters, nearby: coordsString, sort_by: "distance" };
          setFilters(updatedFilters);
          setActiveFilters(updatedFilters);
          updateURL(updatedFilters);
          
          toast.success("Location found! Showing nearby listings.");
          setIsGettingLocation(false);
        },
        (err) => {
          console.error("Geolocation error:", err);
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

  const rawListings = Array.from(uniqueListingsMap.values());

  const randomizedListings = useMemo(() => {
    return shuffleArray(rawListings);
  }, [rawListings.length]);

  const handleOpenStories = (index = 0) => {
    if (randomizedListings.length === 0) return;
    setSelectedStoryIndex(index);
    setIsStoryModalOpen(true);
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
      {/* Filter Header Panel */}
      <div className="bg-black/90 backdrop-blur-md rounded-2xl border border-white/10 p-3 sm:p-6 shadow-xl space-y-4">
        <SafetyTip page="search" />

        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                name="search"
                placeholder="Search properties, areas..."
                className="w-full input text-sm pr-8"
                value={filters.search}
                onChange={handleInputChange}
              />
              {isFetching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                </div>
              )}
            </div>

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

          <div className={`${mobileFiltersOpen ? "block" : "hidden sm:grid"} grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 pt-2`}>
            <div>
              <label className="label text-[11px] sm:text-xs">Type</label>
              <select
                name="house_type"
                value={filters.house_type}
                onChange={handleInputChange}
                className="input text-xs sm:text-sm"
              >
                {HOUSE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label text-[11px] sm:text-xs">Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
                placeholder="100000"
                className="input text-xs sm:text-sm"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="label text-[11px] sm:text-xs">Sort By</label>
              <select
                name="sort_by"
                value={filters.sort_by}
                onChange={handleInputChange}
                className="input text-xs sm:text-sm"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={getUserLocation}
              disabled={isGettingLocation}
              className={`text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                showNearby
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              {isGettingLocation ? "Getting location..." : showNearby ? "Nearby mode ON" : "Show Nearby"}
              {isFetching && <span className="animate-pulse text-blue-400">•</span>}
            </button>

            {randomizedListings.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenStories(0)}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <span>Watch All Stories ({randomizedListings.length})</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Stories Entry Feed */}
      {randomizedListings.length === 0 ? (
        <div className="text-center py-12 bg-black/90 backdrop-blur-md rounded-2xl border border-white/10">
          <p className="text-gray-400 text-sm">No property stories available right now.</p>
        </div>
      ) : (
        <div className="bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <h3 className="text-xs uppercase tracking-wider font-bold text-blue-400">
              Property Status Feed (Tap to view)
            </h3>
            <span className="text-[11px] text-gray-400">
              {randomizedListings.length} {randomizedListings.length === 1 ? "Listing" : "Listings"}
            </span>
          </div>

          <div className="flex items-start gap-4 sm:gap-6 overflow-x-auto pb-3 pt-1 scrollbar-none">
            {randomizedListings.map((listing, index) => {
              const cover =
                listing.cover_image ||
                (Array.isArray(listing.images) && listing.images[0]?.url) ||
                (Array.isArray(listing.images) && listing.images[0]);

              return (
                <div
                  key={listing.id}
                  onClick={() => handleOpenStories(index)}
                  className="flex flex-col items-center gap-2 min-w-[80px] sm:min-w-[96px] cursor-pointer group transition-transform duration-200 hover:scale-105"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3px] bg-gradient-to-tr from-blue-600 via-sky-400 to-indigo-500 shadow-md group-hover:shadow-blue-500/40 relative">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#121212] border-2 border-black relative">
                      {cover ? (
                        <img
                          src={cover}
                          alt={listing.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-500 bg-gray-900">
                          House
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-center w-20 sm:w-24 text-center">
                    <span className="text-xs text-gray-200 font-semibold line-clamp-1 group-hover:text-blue-400 transition-colors">
                      {listing.title}
                    </span>
                    {listing.price && (
                      <span className="text-[10px] text-gray-400 font-medium">
                        KSh {Number(listing.price).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full-Screen Stories Player Modal */}
      <ListingStoriesModal
        listings={randomizedListings}
        initialIndex={selectedStoryIndex}
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
      />
    </div>
  );
}
