// src/components/MapPicker.jsx
import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icon for selected pin
const pinIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Green pin for verified
const verifiedPinIcon = new L.Icon({
  iconUrl:
    "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Red pin for warning
const warningPinIcon = new L.Icon({
  iconUrl:
    "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function LocationMarker({
  onLocationSelect,
  initialPosition,
  setPinLocation,
  isVerified,
}) {
  const [position, setPosition] = useState(initialPosition);

  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      console.log("📍 Pin dropped at:", lat, lng);
      setPosition([lat, lng]);
      if (setPinLocation) {
        setPinLocation({ latitude: lat, longitude: lng });
      }
      if (onLocationSelect) {
        onLocationSelect({ latitude: lat, longitude: lng });
      }
      map.flyTo(e.latlng, 16);
    },
  });

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  // Choose icon based on verification status
  let icon = pinIcon;
  if (isVerified === true) {
    icon = verifiedPinIcon;
  } else if (isVerified === false) {
    icon = warningPinIcon;
  }

  return position ? (
    <Marker position={position} icon={icon}>
      <Popup>
        <div className="text-sm">
          <p className="font-semibold">📍 Property Location</p>
          <p className="text-gray-500 text-xs">
            Latitude: {position[0].toFixed(6)}
            <br />
            Longitude: {position[1].toFixed(6)}
          </p>
          {isVerified === true && (
            <p className="text-xs text-green-400 mt-1">✅ Verified Location</p>
          )}
          {isVerified === false && (
            <p className="text-xs text-red-400 mt-1">
              ⚠️ Location needs verification
            </p>
          )}
          <p className="text-[10px] text-blue-400 mt-1">
            Click on the map to move pin
          </p>
        </div>
      </Popup>
    </Marker>
  ) : null;
}

export default function MapPicker({
  onLocationSelect,
  initialCenter,
  initialZoom = 14,
  height = "300px",
  setPinLocation,
  isVerified,
  showSearch = false,
}) {
  // Default center (Nairobi)
  const defaultCenter = initialCenter || [-1.286389, 36.817223];
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapRef, setMapRef] = useState(null);

  // Handle map reference
  const handleMapReady = (map) => {
    setMapRef(map);
  };

  // Search for location using Nominatim (OpenStreetMap)
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a location to search");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=KE`,
      );
      const data = await response.json();
      setSearchResults(data);
      if (data.length === 0) {
        toast.warning("No locations found. Try a different search term.");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search location. Please try again.");
    }
    setIsSearching(false);
  };

  // Fly to a search result
  const flyToLocation = (lat, lon, name) => {
    if (mapRef) {
      mapRef.flyTo([lat, lon], 16);
      setPinLocation({ latitude: lat, longitude: lon });
      if (onLocationSelect) {
        onLocationSelect({ latitude: lat, longitude: lon });
      }
      toast.success(`📍 Moved to: ${name}`);
    }
    setSearchResults([]);
    setSearchQuery("");
  };

  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      {/* Search Bar */}
      {showSearch && (
        <div className="p-3 bg-black/50 border-b border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location (e.g., Kilimani, Nairobi)"
              className="flex-1 input text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="btn-primary text-sm px-4"
            >
              {isSearching ? "..." : "Search"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    flyToLocation(
                      parseFloat(result.lat),
                      parseFloat(result.lon),
                      result.display_name.split(",")[0],
                    )
                  }
                  className="w-full text-left text-xs text-gray-300 hover:text-white hover:bg-white/5 p-1.5 rounded transition"
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={defaultCenter}
        zoom={initialZoom}
        style={{ height: height, width: "100%" }}
        zoomControl={true}
        attributionControl={true}
        ref={handleMapReady}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          onLocationSelect={onLocationSelect}
          initialPosition={defaultCenter}
          setPinLocation={setPinLocation}
          isVerified={isVerified}
        />
      </MapContainer>

      {/* Footer */}
      <div className="p-2 bg-black/50 text-center border-t border-white/5">
        <p className="text-[10px] text-gray-400">
          📍 Click anywhere on the map to drop a pin at the property location
        </p>
        {isVerified === true && (
          <p className="text-[10px] text-green-400 mt-0.5">
            ✅ Location verified
          </p>
        )}
        {isVerified === false && (
          <p className="text-[10px] text-yellow-400 mt-0.5">
            ⚠️ Please verify the pin location
          </p>
        )}
      </div>
    </div>
  );
}
