// src/components/SocketStatusDot.jsx
import { useEffect, useState } from "react";
import useSocket from "../hooks/useSocket";

/**
 * Tiny indicator that shows WebSocket health.
 * Shows only when the user is logged in (userId exists).
 * - Green pulsing dot  → live / connected
 * - Yellow dot         → reconnecting
 * - Red dot            → disconnected
 */
export default function SocketStatusDot() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const userId = user?.id || user?.user_id || null;

  const { isConnected } = useSocket(userId);
  const [reconnecting, setReconnecting] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Track reconnecting state: was connected before → now disconnected
  useEffect(() => {
    if (isConnected) {
      setWasConnected(true);
      setReconnecting(false);
    } else if (wasConnected && !isConnected) {
      setReconnecting(true);
    }
  }, [isConnected, wasConnected]);

  // Don't render anything if no userId (not logged in)
  if (!userId) return null;

  const status = isConnected
    ? "live"
    : reconnecting
      ? "reconnecting"
      : "offline";

  const config = {
    live: {
      dot: "bg-green-400",
      pulse: "animate-pulse",
      label: "Live",
      description: "Real-time updates active",
      text: "text-green-400",
      ring: "border-green-400/30",
    },
    reconnecting: {
      dot: "bg-yellow-400",
      pulse: "animate-ping",
      label: "Reconnecting…",
      description: "Trying to restore real-time connection",
      text: "text-yellow-400",
      ring: "border-yellow-400/30",
    },
    offline: {
      dot: "bg-red-400",
      pulse: "",
      label: "Offline",
      description: "Real-time updates unavailable",
      text: "text-red-400",
      ring: "border-red-400/30",
    },
  }[status];

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${config.ring} bg-black/30 hover:bg-white/5 transition`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip((v) => !v)}
        aria-label={`WebSocket status: ${config.label}`}
      >
        <span className="relative flex h-2 w-2">
          {status !== "offline" && (
            <span
              className={`${config.pulse} absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`}
          />
        </span>
        <span className={`text-[11px] font-medium hidden sm:inline ${config.text}`}>
          {config.label}
        </span>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-[11px] text-gray-300 whitespace-nowrap shadow-xl z-50 pointer-events-none">
          <p className="font-semibold text-white mb-0.5">{config.label}</p>
          <p>{config.description}</p>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#1a1a1a]" />
        </div>
      )}
    </div>
  );
}
