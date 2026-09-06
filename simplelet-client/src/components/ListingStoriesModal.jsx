// src/pages/ListingStoriesModal.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, HeartIcon, ShareIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import API from "../services/api";
import CredibilityBadge from "./CredibilityBadge";

const getOptimizedImageUrl = (url, width = 1000, height = 1200) => {
  if (!url) return "";
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`);
  }
  return url;
};

export default function ListingStoriesModal({ listings = [], initialIndex = 0, isOpen, onClose }) {
  const navigate = useNavigate();
  const [currentListingIndex, setCurrentListingIndex] = useState(initialIndex);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const timerRef = useRef(null);
  const STORY_DURATION = 5000; // 5 seconds per image slide

  const currentListing = listings[currentListingIndex] || null;
  const images = currentListing?.images || [];
  const hasImages = images.length > 0;
  const author = currentListing?.author || {};

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  // Reset image index when listing changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setProgress(0);
  }, [currentListingIndex]);

  // Check favorite state
  useEffect(() => {
    const checkFavorite = async () => {
      if (!currentListing?.id || !isLoggedIn) return;
      try {
        const { data } = await API.get(`/favorites/check/${currentListing.id}`);
        setIsFavorited(data.is_favorited);
      } catch (err) {
        // silent catch
      }
    };
    checkFavorite();
  }, [currentListing?.id, isLoggedIn]);

  // Story Progress Timer
  useEffect(() => {
    if (!isOpen || isPaused || !hasImages) return;

    const interval = 50; // update every 50ms
    const step = (interval / STORY_DURATION) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextSlide();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [isOpen, isPaused, currentImageIndex, currentListingIndex, hasImages]);

  const handleNextSlide = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      // Go to next listing
      if (currentListingIndex < listings.length - 1) {
        setCurrentListingIndex((prev) => prev + 1);
      } else {
        onClose(); // End of all stories
      }
    }
  };

  const handlePrevSlide = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      // Go to previous listing
      if (currentListingIndex > 0) {
        setCurrentListingIndex((prev) => prev - 1);
      }
    }
  };

  const handleTapOverlay = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const width = rect.width;

    if (tapX < width * 0.35) {
      handlePrevSlide();
    } else {
      handleNextSlide();
    }
  };

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error("Please login to save listings");
      navigate("/login");
      return;
    }
    try {
      const { data } = await API.post(`/favorites/listings/${currentListing.id}`);
      setIsFavorited(data.is_favorited);
      toast.success(data.message || "Favorite updated");
    } catch (err) {
      toast.error("Failed to update favorite");
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/listings/${currentListing?.id}`;
    if (navigator.share) {
      navigator.share({
        title: currentListing?.title,
        text: `Check out ${currentListing?.title} on SimpleLet`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  if (!isOpen || !currentListing) return null;

  const currentCover = hasImages ? images[currentImageIndex]?.url : "";

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center sm:p-4">
      
      {/* Background Ambient Blur */}
      {currentCover && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl pointer-events-none scale-110"
          style={{ backgroundImage: `url(${currentCover})` }}
        />
      )}

      {/* Main Story Container Frame */}
      <div className="relative w-full max-w-md h-full sm:h-[90vh] sm:rounded-3xl bg-[#0a0a0a] overflow-hidden flex flex-col justify-between border border-white/10 shadow-2xl z-10">
        
        {/* Top Progress Segment Bars */}
        <div className="absolute top-0 inset-x-0 z-30 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent space-y-2">
          <div className="flex items-center gap-1.5 w-full">
            {hasImages ? (
              images.map((_, idx) => {
                let barWidth = "0%";
                if (idx < currentImageIndex) barWidth = "100%";
                else if (idx === currentImageIndex) barWidth = `${progress}%`;

                return (
                  <div key={idx} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-75 ease-linear"
                      style={{ width: barWidth }}
                    />
                  </div>
                );
              })
            ) : (
              <div className="w-full h-1 bg-blue-500 rounded-full" />
            )}
          </div>

          {/* Header Info Bar */}
          <div className="flex items-center justify-between text-white pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                {currentListing.house_type_display || "PROPERTY"}
              </span>
              {author.id && (
                <CredibilityBadge
                  userId={author.id}
                  score={author.credibility_score}
                  badge={author.badge}
                  isVerified={author.is_verified}
                />
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-white transition"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Interactive Tap Area / Cover Media Display */}
        <div
          onClick={handleTapOverlay}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
          className="relative flex-1 w-full h-full bg-[#121212] flex items-center justify-center cursor-pointer select-none"
        >
          {hasImages ? (
            <img
              src={getOptimizedImageUrl(currentCover)}
              alt={currentListing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-gray-500 text-sm">No Images Available</div>
          )}

          {/* Side Next / Prev Arrows for Desktop Hover */}
          <button
            onClick={(e) => { e.stopPropagation(); handlePrevSlide(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white hidden sm:block"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNextSlide(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white hidden sm:block"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom Property Overlay Info Card */}
        <div className="absolute bottom-0 inset-x-0 z-30 p-5 bg-gradient-to-t from-black via-black/90 to-transparent space-y-4">
          
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <h2 className="text-xl font-bold text-white line-clamp-1">{currentListing.title}</h2>
              <span className="text-xl font-black text-blue-400">
                KSh {currentListing.price?.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-300">📍 {currentListing.location}</p>
          </div>

          {/* Quick Action Bar */}
          <div className="flex items-center gap-3 pt-1">
            {/* View Full Details */}
            <Link
              to={`/listings/${currentListing.id}`}
              className="flex-1 text-center py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition"
            >
              View Full Details
            </Link>

            {/* Favorite */}
            <button
              onClick={toggleFavorite}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition"
            >
              {isFavorited ? (
                <HeartSolidIcon className="w-5 h-5 text-blue-500" />
              ) : (
                <HeartIcon className="w-5 h-5 text-gray-300" />
              )}
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition"
            >
              <ShareIcon className="w-5 h-5 text-gray-300" />
            </button>
          </div>

          {/* Swipe Indicator Footer */}
          <div className="text-center pt-1">
            <p className="text-[10px] text-gray-400 font-medium tracking-wide">
              Listing {currentListingIndex + 1} of {listings.length} • Tap left/right to browse
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
