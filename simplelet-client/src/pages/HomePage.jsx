// src/pages/HomePage.jsx
import { useState, useRef, useCallback, useMemo } from "react";
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
  const [searchInput, setSearchInput] = useState(() => searchParams.get("search") || "");

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

          const updatedFilters = { ...filters, nearby: coordsString, sort_by: "distance" };
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

  const rawListings = Array.from(uniqueListingsMap.values());

  // Randomizes listings so story order changes on refresh/load
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
            <input
              ref={searchInputRef}
              type="text"
              name="search"
              placeholder="Search properties, areas..."
              className="flex-1 input text-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
              className={`text-xs px-3 py-1.5 rounded-xl transition ${
                showNearby
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                  : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              {isGettingLocation ? "Getting location..." : showNearby ? "Nearby mode ON" : "Show Nearby"}
            </button>

            {randomizedListings.length > 0 && (
              <button
                type="button"
                onClick={() => handleOpenStories(0)}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-2"
              >
                <span>Watch All Stories ({randomizedListings.length})</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* WhatsApp Status Avatar Strip / Stories Entry Feed */}
      {randomizedListings.length === 0 ? (
        <div className="text-center py-12 bg-black/90 backdrop-blur-md rounded-2xl border border-white/10">
          <p className="text-gray-400 text-sm">No property stories available right now.</p>
        </div>
      ) : (
        <div className="bg-black/80 backdrop-blur-md rounded-2xl border border-white/10 p-4 space-y-4">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-blue-400">
            Property Status Feed (Tap to view)
          </h3>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
            {randomizedListings.map((listing, index) => {
              const cover =
                listing.cover_image ||
                (Array.isArray(listing.images) && listing.images[0]?.url) ||
                (Array.isArray(listing.images) && listing.images[0]);

              return (
                <div
                  key={listing.id}
                  onClick={() => handleOpenStories(index)}
                  className="flex flex-col items-center gap-1.5 min-w-[76px] cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-blue-600 to-sky-400 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#121212] border-2 border-black">
                      {cover ? (
                        <img src={cover} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                          House
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-300 font-medium line-clamp-1 text-center w-16">
                    {listing.title}
                  </span>
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
