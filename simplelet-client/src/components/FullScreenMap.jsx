// src/components/FullScreenMap.jsx
import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";

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

// Custom marker icons
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

const defaultPinIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const FullScreenMap = ({
  isOpen,
  onClose,
  location,
  title,
  isVerified,
  nearbyAmenities = {},
}) => {
  const [map, setMap] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const controlsRef = useRef(null);

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.warn("Fullscreen not supported:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn("Exit fullscreen failed:", err);
      });
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Open in Google Maps
  const openInGoogleMaps = () => {
    if (!location) return;
    const { lat, lng } = location;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  if (!isOpen || !location) return null;

  const { lat, lng, source } = location;
  const icon = isVerified ? verifiedPinIcon : defaultPinIcon;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-sm animate-fadeIn flex items-center justify-center"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        className="relative w-full h-full max-w-7xl max-h-screen p-2 sm:p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============ TOP CONTROLS BAR - MOBILE FRIENDLY ============ */}
        <div
          ref={controlsRef}
          className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 pointer-events-none"
        >
          {/* Title - left side (hidden on mobile to save space) */}
          <div className="pointer-events-auto bg-black/70 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/10 shadow-xl hidden sm:block">
            <h3 className="text-white font-semibold text-xs sm:text-sm">
              📍 {title || "Property Location"}
            </h3>
            {isVerified && (
              <span className="text-[8px] sm:text-[10px] text-green-400">
                ✅ Verified
              </span>
            )}
          </div>

          {/* Controls - right side (mobile responsive) */}
          <div className="pointer-events-auto flex flex-wrap items-center justify-center sm:justify-end gap-1 sm:gap-2 bg-black/70 backdrop-blur-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-white/10 shadow-xl w-full sm:w-auto">
            {/* Open in Google Maps - Icon only on mobile, text on desktop */}
            <button
              onClick={openInGoogleMaps}
              className="flex items-center gap-1 sm:gap-1.5 text-gray-300 hover:text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all duration-300 hover:bg-white/10 text-xs sm:text-sm"
              aria-label="Open in Google Maps"
            >
              <span className="text-base sm:text-lg">🗺️</span>
              <span className="hidden sm:inline">Open in Google Maps</span>
              <span className="sm:hidden text-[10px]">Open in Google Maps</span>
            </button>

            <div className="w-px h-4 sm:h-6 bg-white/10 hidden xs:block" />

            {/* Fullscreen toggle - Icon only on mobile */}
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1 sm:gap-1.5 text-gray-300 hover:text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all duration-300 hover:bg-white/10 text-xs sm:text-sm"
              aria-label={
                isFullscreen ? "Exit full screen" : "Enter full screen"
              }
            >
              {isFullscreen ? (
                <>
                  <ArrowsPointingInIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                  <span className="sm:hidden text-[10px]">Exit</span>
                </>
              ) : (
                <>
                  <ArrowsPointingOutIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Fullscreen</span>
                  <span className="sm:hidden text-[10px]">Full</span>
                </>
              )}
            </button>

            <div className="w-px h-4 sm:h-6 bg-white/10 hidden xs:block" />

            {/* Close button - Icon only on mobile */}
            <button
              onClick={onClose}
              className="flex items-center gap-1 sm:gap-1.5 text-gray-300 hover:text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-all duration-300 hover:bg-white/10 text-xs sm:text-sm"
              aria-label="Close full screen map"
            >
              <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Keyboard shortcut hint - hidden on mobile */}
        <div className="absolute top-16 sm:top-20 left-1/2 transform -translate-x-1/2 z-10 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5 pointer-events-none hidden sm:block">
          <p className="text-[8px] text-gray-400">
            ESC to close • F for fullscreen • Scroll to zoom
          </p>
        </div>

        {/* ============ MAP CONTAINER ============ */}
        <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 mt-12 sm:mt-16">
          <MapContainer
            center={[lat, lng]}
            zoom={16}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
            attributionControl={true}
            ref={setMap}
          >
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Property marker */}
            <Marker position={[lat, lng]} icon={icon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{title || "Property"}</p>
                  <p className="text-gray-500 text-xs">
                    Latitude: {lat.toFixed(6)}
                    <br />
                    Longitude: {lng.toFixed(6)}
                  </p>
                  {isVerified && (
                    <p className="text-green-400 text-xs mt-1">
                      ✅ Location Verified
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    Source: {source || "GPS"}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* 500m radius circle */}
            <Circle
              center={[lat, lng]}
              radius={500}
              pathOptions={{
                color: isVerified ? "green" : "blue",
                fillOpacity: 0.1,
                weight: 2,
              }}
            />

            {/* Nearby amenities markers */}
            {nearbyAmenities.matatu_distance && (
              <Marker
                position={[lat + 0.002, lng + 0.003]}
                icon={
                  new L.Icon({
                    iconUrl:
                      "https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png",
                    shadowUrl:
                      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                    iconSize: [20, 33],
                    iconAnchor: [10, 33],
                    popupAnchor: [1, -28],
                    shadowSize: [33, 33],
                  })
                }
              >
                <Popup>
                  🚌 Matatu stop ({nearbyAmenities.matatu_distance}m)
                </Popup>
              </Marker>
            )}

            {nearbyAmenities.supermarket_distance && (
              <Marker
                position={[lat - 0.001, lng + 0.004]}
                icon={
                  new L.Icon({
                    iconUrl:
                      "https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png",
                    shadowUrl:
                      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                    iconSize: [20, 33],
                    iconAnchor: [10, 33],
                    popupAnchor: [1, -28],
                    shadowSize: [33, 33],
                  })
                }
              >
                <Popup>
                  🛒 Supermarket ({nearbyAmenities.supermarket_distance}m)
                </Popup>
              </Marker>
            )}

            {nearbyAmenities.gym_distance && (
              <Marker
                position={[lat + 0.003, lng - 0.002]}
                icon={
                  new L.Icon({
                    iconUrl:
                      "https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png",
                    shadowUrl:
                      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
                    iconSize: [20, 33],
                    iconAnchor: [10, 33],
                    popupAnchor: [1, -28],
                    shadowSize: [33, 33],
                  })
                }
              >
                <Popup>💪 Gym ({nearbyAmenities.gym_distance}m)</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>

        {/* Bottom info bar - mobile friendly */}
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-white/10 text-center pointer-events-none">
          <p className="text-[8px] sm:text-[10px] text-gray-400 hidden xs:block">
            🖱️ Scroll to zoom • Drag to pan
          </p>
          <p className="text-[8px] sm:text-[10px] text-gray-500">
            📍 {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FullScreenMap;
