// src/components/LocationPermission.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const LocationPermission = ({ onLocationGranted, onLocationDenied }) => {
  const [permissionState, setPermissionState] = useState("prompt"); // 'prompt', 'granted', 'denied', 'unavailable'

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setPermissionState("unavailable");
      toast.error("📍 Geolocation is not supported by your browser.");
      if (onLocationDenied) onLocationDenied();
      return;
    }

    // Check current permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          if (result.state === "granted") {
            setPermissionState("granted");
            getCurrentPosition();
          } else if (result.state === "denied") {
            setPermissionState("denied");
            if (onLocationDenied) onLocationDenied();
          } else {
            // 'prompt' - ask the user
            setPermissionState("prompt");
          }
        })
        .catch(() => {
          // Fallback: try to get position directly
          setPermissionState("prompt");
        });
    } else {
      // Fallback for browsers without permissions API
      setPermissionState("prompt");
    }
  }, []);

  const getCurrentPosition = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPermissionState("granted");
        toast.success("📍 Location access granted!");
        if (onLocationGranted) {
          onLocationGranted({ latitude, longitude });
        }
      },
      (error) => {
        console.warn("Location error:", error.message);
        if (error.code === 1) {
          // User denied permission
          setPermissionState("denied");
          toast.error(
            "📍 Location access denied. You can still browse, but nearby features will be limited.",
          );
          if (onLocationDenied) onLocationDenied();
        } else {
          setPermissionState("unavailable");
          toast.error("📍 Could not get your location. Please try again.");
          if (onLocationDenied) onLocationDenied();
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const requestLocation = () => {
    getCurrentPosition();
  };

  const skipLocation = () => {
    setPermissionState("denied");
    toast.info("📍 You can enable location later from your browser settings.");
    if (onLocationDenied) onLocationDenied();
  };

  // If already granted or denied, don't show the prompt
  if (
    permissionState === "granted" ||
    permissionState === "denied" ||
    permissionState === "unavailable"
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-6 sm:p-8 max-w-md w-full shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">📍</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
          Enable Location Services
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-center text-sm mb-6">
          SimpleLet uses your location to:
        </p>

        <ul className="space-y-2 mb-6">
          <li className="flex items-start gap-3 text-sm text-gray-300">
            <span className="text-blue-400 mt-0.5">✅</span>
            <span>Show properties near you</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-300">
            <span className="text-blue-400 mt-0.5">✅</span>
            <span>Verify you're at the property when posting</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-gray-300">
            <span className="text-blue-400 mt-0.5">✅</span>
            <span>Find the fastest route to listings</span>
          </li>
        </ul>

        {/* Location benefits notice */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 mb-6">
          <p className="text-[11px] text-blue-300 text-center">
            🔒 Your location is only used to improve your experience. We never
            share your data with third parties.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={requestLocation}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <span className="text-lg">📍</span>
            Allow Location Access
          </button>

          <button
            onClick={skipLocation}
            className="w-full text-sm text-gray-400 hover:text-white transition py-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationPermission;
