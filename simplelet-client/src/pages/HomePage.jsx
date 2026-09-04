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

  // Active query parameters (triggers React Query & URL sync)
  const [activeFilters, setActiveFilters] = useState({
    search: searchParams.get("search") || "",
    house_type: searchParams.get("house_type") || "",
    location: searchParams.get("location") || "",
    price_min: searchParams.get("price_min") || "",
    price_max: searchParams.get("price_max") || "",
    sort_by: searchParams.get("sort_by") || "newest",
    nearby: searchParams.get("nearby") || "",
  });

  // Local form inputs state (for typing without triggering re-fetches)
  const [formInputs, setFormInputs] = useState(activeFilters);

  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showNearby, setShowNearby] = useState(Boolean(searchParams.get("nearby")));

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const userId = currentUser?.id || currentUser?.user_id || null;
  const { newListings } = useRealTimeListings(null, userId, activeFilters);

  // Query only depends on activeFilters
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["listings", activeFilters],
    queryFn: () => fetchListings(activeFilters),
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

  // Sync URL search params only when active query filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params, { replace: true });
  }, [activeFilters, setSearchParams]);

  useEffect(() => {
    if (error) {
      toast.error("Failed to load listings");
    }
  }, [error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormInputs((prev) => ({ ...prev, [name]: value }));
  };

  // Submit search query
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setActiveFilters(formInputs);
  };

  // Immediate select update for dropdowns
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formInputs, [name]: value };
    setFormInputs(updated);
    setActiveFilters(updated);
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
    setFormInputs(reset);
    setActiveFilters(reset);
    setShowNearby(false);
    setUserLocation(null);
  };

  const getUserLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setShowNearby(true);
          const updated = {
            ...formInputs,
            nearby: `${latitude},${longitude}`,
            sort_by: "distance",
          };
          setFormInputs(updated);
          setActiveFilters(updated);
          toast.success("📍 Location found! Showing nearby listings.");
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast.error("Could not get your location. Please enable location services.");
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
      setIsGettingLocation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const listings = uniqueListings;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed space-y-4 p-4 sm:p-6"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(${slateBg})`,
      }}
    >
      <div className="bg-black/90 backdrop-blur-md rounded-2xl border border-white/10 p-4 sm:p-6">
        <SafetyTip page="search" className="mb-4" />

        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="search"
              value={formInputs.search}
              onChange={handleInputChange}
              placeholder="Search properties..."
              className="flex-1 input"
            />
            <button type="submit" className="btn-primary w-full sm:w-auto">
              Search
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="label">Type</label>
              <select
                name="house_type"
                value={formInputs.house_type}
                onChange={handleSelectChange}
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
                value={formInputs.location}
                onChange={handleInputChange}
                placeholder="e.g., Kilimani"
                className="input"
              />
            </div>

            <div>
              <label className="label">Min Price</label>
              <input
                type="number"
                name="price_min"
                value={formInputs.price_min}
                onChange={handleInputChange}
                placeholder="0"
                className="input"
              />
            </div>

            <div>
              <label className="label">Max Price</label>
              <input
                type="number"
                name="price_max"
                value={formInputs.price_max}
                onChange={handleInputChange}
                placeholder="1000000"
                className="input"
              />
            </div>

            <div>
              <label className="label">Sort By</label>
              <select
                name="sort_by"
                value={formInputs.sort_by}
                onChange={handleSelectChange}
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

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="text-xs bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition"
            >
              Apply Filter Changes
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-white transition"
            >
              Clear Filters
            </button>
          </div>
        </form>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <SimpleAmbientBackground
            key={listing.id}
            imageUrl={listing.cover_image}
            intensity={0.2}
            className="rounded-xl overflow-hidden"
          >
            <Link to={`/listing/${listing.id}`}>
              <div className="p-4 border border-white/10 rounded-xl bg-black/60">
                <h3 className="font-semibold text-white">{listing.title}</h3>
                <p className="text-gray-400 text-sm">{listing.location}</p>
                <p className="text-blue-400 font-bold mt-2">
                  KSh {listing.price?.toLocaleString()}
                </p>
              </div>
            </Link>
          </SimpleAmbientBackground>
        ))}
      </div>
    </div>
  );
}
