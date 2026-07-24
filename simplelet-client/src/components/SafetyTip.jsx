// src/components/SafetyTip.jsx
import { useState, useEffect } from "react";
import {
  XMarkIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";

const TIP_TYPES = {
  warning: {
    icon: ExclamationTriangleIcon,
    color: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
    hover: "hover:border-yellow-500/50",
  },
  info: {
    icon: InformationCircleIcon,
    color: "border-blue-500/30 bg-blue-500/10 text-blue-400",
    hover: "hover:border-blue-500/50",
  },
  success: {
    icon: ShieldCheckIcon,
    color: "border-green-500/30 bg-green-500/10 text-green-400",
    hover: "hover:border-green-500/50",
  },
  tip: {
    icon: LightBulbIcon,
    color: "border-purple-500/30 bg-purple-500/10 text-purple-400",
    hover: "hover:border-purple-500/50",
  },
};

const SAFETY_TIPS = {
  login: {
    type: "warning",
    message:
      "⚠️ Always verify the property and landlord before making any payment. Never pay without viewing first.",
    dismissible: true,
  },
  register: {
    type: "info",
    message:
      "🔒 Your phone number is your identity on SimpleLet. We keep your data safe and never share it without your consent.",
    dismissible: true,
  },
  create_listing: {
    type: "tip",
    message:
      "📸 Photos taken with your camera are automatically verified. Stolen or gallery images will be rejected to protect renters.",
    dismissible: true,
  },
  create_listing_submit: {
    type: "warning",
    message:
      "⚠️ Never pay an agent or landlord before viewing the property in person. Report any suspicious requests immediately.",
    dismissible: true,
  },
  edit_listing: {
    type: "info",
    message:
      '🔄 Remember to mark your listing as "Taken" once the property is rented. This helps other users find available properties.',
    dismissible: true,
  },
  detail: {
    type: "warning",
    message:
      "⚠️ Be cautious of agents asking for upfront fees. Always visit the property in person before making any payment.",
    dismissible: true,
  },
  review: {
    type: "tip",
    message:
      "⭐ Your honest reviews help others avoid scams. Be detailed about your experience and help the community stay safe.",
    dismissible: true,
  },
  whatsapp: {
    type: "warning",
    message:
      "📱 When contacting the landlord, always request a physical viewing before paying any money.",
    dismissible: true,
  },
  search: {
    type: "info",
    message:
      "🔍 Found a good deal? Always visit the property in person before committing to anything.",
    dismissible: true,
  },
  image_upload: {
    type: "warning",
    message:
      "📸 Camera-only uploads verify your location and prevent stolen photos. Enable location services for verification.",
    dismissible: true,
  },
  favorite: {
    type: "tip",
    message:
      "❤️ Save your favorite listings to compare and track them easily. You can access them anytime from your dashboard.",
    dismissible: true,
  },
  contact: {
    type: "warning",
    message:
      "⚠️ Never share your ID or bank details with strangers. Report any suspicious behavior immediately.",
    dismissible: true,
  },
  price: {
    type: "info",
    message:
      "💰 If a deal seems too good to be true, it probably is. Compare prices with similar properties in the area.",
    dismissible: true,
  },
};

// Storage key for dismissed tips
const DISMISSED_TIPS_KEY = "simplelet_dismissed_tips";

const SafetyTip = ({
  page,
  className = "",
  autoHide = false,
  autoHideDelay = 15000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const tip = SAFETY_TIPS[page];

  // Check if this tip was previously dismissed
  useEffect(() => {
    try {
      const dismissed = JSON.parse(
        localStorage.getItem(DISMISSED_TIPS_KEY) || "[]",
      );
      if (dismissed.includes(page)) {
        setIsVisible(false);
      }
    } catch (e) {
      // Ignore
    }
  }, [page]);

  // Auto-hide after delay
  useEffect(() => {
    if (autoHide && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, isVisible]);

  if (!tip) return null;

  const Icon = TIP_TYPES[tip.type].icon;
  const colorClass = TIP_TYPES[tip.type].color;
  const hoverClass = TIP_TYPES[tip.type].hover;

  const handleDismiss = () => {
    setIsVisible(false);
    // Save dismissed state
    try {
      const dismissed = JSON.parse(
        localStorage.getItem(DISMISSED_TIPS_KEY) || "[]",
      );
      if (!dismissed.includes(page)) {
        dismissed.push(page);
        localStorage.setItem(DISMISSED_TIPS_KEY, JSON.stringify(dismissed));
      }
    } catch (e) {
      // Ignore
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`rounded-xl border ${colorClass} ${hoverClass} p-3 sm:p-4 transition-all duration-300 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-xs sm:text-sm flex-1 leading-relaxed">
          {tip.message}
        </p>
        {tip.dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
            aria-label="Dismiss tip"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============ ROTATING TIPS COMPONENT ============
export const RotatingSafetyTips = ({
  pages,
  interval = 10000,
  className = "",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % pages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [pages.length, interval]);

  const currentPage = pages[currentIndex];

  return <SafetyTip page={currentPage} className={className} />;
};

export default SafetyTip;
