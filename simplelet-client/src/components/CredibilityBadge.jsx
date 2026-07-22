// src/components/CredibilityBadge.jsx
import React from "react";

const CredibilityBadge = ({
  userId,
  score,
  badge,
  isVerified,
  size = "md",
}) => {
  // Size classes
  const sizeClasses = {
    sm: {
      container: "px-2 py-1 text-xs",
      badge: "text-xs",
      score: "text-[10px]",
    },
    md: {
      container: "px-3 py-1.5 text-sm",
      badge: "text-sm",
      score: "text-xs",
    },
    lg: {
      container: "px-4 py-2 text-base",
      badge: "text-base",
      score: "text-sm",
    },
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  // Badge colors and icons
  const badgeConfig = {
    verified: {
      color: "bg-green-500/20 border-green-500/30 text-green-400",
      icon: "🟢",
      label: "Verified",
    },
    trusted: {
      color: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
      icon: "🟡",
      label: "Trusted",
    },
    caution: {
      color: "bg-orange-500/20 border-orange-500/30 text-orange-400",
      icon: "🟠",
      label: "Caution",
    },
    warning: {
      color: "bg-red-500/20 border-red-500/30 text-red-400",
      icon: "🔴",
      label: "Warning",
    },
    default: {
      color: "bg-gray-500/20 border-gray-500/30 text-gray-400",
      icon: "⚪",
      label: "Unrated",
    },
  };

  // Determine badge level
  let badgeLevel = "default";
  if (score >= 80) badgeLevel = "verified";
  else if (score >= 60) badgeLevel = "trusted";
  else if (score >= 40) badgeLevel = "caution";
  else if (score >= 0) badgeLevel = "warning";

  // Use passed badge if available, otherwise computed
  const currentBadge = badge?.level || badgeLevel;
  const config = badgeConfig[currentBadge] || badgeConfig.default;

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border ${config.color} ${sizes.container}`}
    >
      <span className={sizes.badge}>{config.icon}</span>
      <span className={sizes.badge}>{config.label}</span>
      {score !== undefined && (
        <span className={`${sizes.score} opacity-60`}>({score})</span>
      )}
    </div>
  );
};

export default CredibilityBadge;
