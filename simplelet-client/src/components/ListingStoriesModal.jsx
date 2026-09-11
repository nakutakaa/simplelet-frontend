import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import API from "../services/api";
import AuthPromptModal from "./AuthPromptModal";

const getOptimizedImageUrl = (url, width = 1000, height = 1200) => {
  if (!url) return "";
  if (url.includes("cloudinary.com")) {
    return url.replace(
      "/upload/",
      `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`
    );
  }
  return url;
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getListingImages = (item) => {
  if (!item) return [];
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images.map((img) =>
      typeof img === "string" ? img : img.url || img.src
    );
  }
  if (item.cover_image) return [item.cover_image];
  if (item.image_url) return [item.image_url];
  return [];
};

export default function ListingStoriesModal({
  listings = [],
  initialIndex = null,
  isOpen,
  onClose,
}) {
  const navigate = useNavigate();
  const [storyQueue, setStoryQueue] = useState([]);
  const [currentListingIndex, setCurrentListingIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Refs for stable interval access
  const timerRef = useRef(null);
  const pauseTimeoutRef = useRef(null);
  const currentImageIndexRef = useRef(0);
  const currentListingIndexRef = useRef(0);
  const storyQueueRef = useRef([]);
  const isPausedRef = useRef(false);

  const STORY_DURATION = 5000;

  // Sync refs with state
  useEffect(() => {
    currentImageIndexRef.current = currentImageIndex;
  }, [currentImageIndex]);

  useEffect(() => {
    currentListingIndexRef.current = currentListingIndex;
  }, [currentListingIndex]);

  useEffect(() => {
    storyQueueRef.current = storyQueue;
  }, [storyQueue]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // ============ INITIALIZE STORY QUEUE ============
  useEffect(() => {
    if (isOpen && listings.length > 0) {
      setIsLoading(true);
      setCurrentImageIndex(0);
      setProgress(0);

      const hasValidInitialIndex =
        typeof initialIndex === "number" &&
        initialIndex >= 0 &&
        initialIndex < listings.length;

      if (hasValidInitialIndex) {
        setStoryQueue(listings);
        setCurrentListingIndex(initialIndex);
      } else {
        const randomized = shuffleArray(listings);
        setStoryQueue(randomized);
        setCurrentListingIndex(0);
      }

      setTimeout(() => setIsLoading(false), 300);
    }
  }, [isOpen, initialIndex, listings.length]);

  const currentListing = storyQueue[currentListingIndex] || null;
  const listingId = currentListing?.id || currentListing?._id;
  const images = getListingImages(currentListing);
  const hasImages = images.length > 0;

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  // Reset image index when listing changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setProgress(0);
  }, [currentListingIndex]);

  // ============ CHECK FAVORITE STATUS ============
  useEffect(() => {
    const checkFavorite = async () => {
      if (!listingId || !isLoggedIn) return;
      try {
        const { data } = await API.get(`/favorites/check/${listingId}`);
        setIsFavorited(data.is_favorited);
      } catch (err) {
        // silent catch
      }
    };
    checkFavorite();
  }, [listingId, isLoggedIn]);

  // ============ STABLE NEXT/PREV HANDLERS ============
  const handleNextSlide = useCallback(() => {
    const queue = storyQueueRef.current;
    const listingIdx = currentListingIndexRef.current;
    const imageIdx = currentImageIndexRef.current;
    const currentImages = getListingImages(queue[listingIdx]);

    if (currentImages.length > 0 && imageIdx < currentImages.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      if (listingIdx < queue.length - 1) {
        setCurrentListingIndex((prev) => prev + 1);
      } else {
        const reshuffled = shuffleArray(queue);
        setStoryQueue(reshuffled);
        setCurrentListingIndex(0);
      }
    }
  }, []);

  const handlePrevSlide = useCallback(() => {
    const imageIdx = currentImageIndexRef.current;
    const listingIdx = currentListingIndexRef.current;

    if (imageIdx > 0) {
      setCurrentImageIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      if (listingIdx > 0) {
        setCurrentListingIndex((prev) => prev - 1);
      }
    }
  }, []);

  // Pause timer when Auth Modal is visible
  const isTimerActive = isOpen && !isPaused && !isLoading && !showAuthModal;

  // ============ PROGRESS TIMER ============
  useEffect(() => {
    if (!isTimerActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const interval = 50;
    const step = (interval / STORY_DURATION) * 100;

    timerRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextSlide();
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerActive, currentImageIndex, currentListingIndex, handleNextSlide]);

  // ============ CLEANUP ON UNMOUNT ============
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, []);

  // ============ KEYBOARD NAVIGATION ============
  useEffect(() => {
    if (!isOpen || showAuthModal) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") handlePrevSlide();
      if (e.key === "ArrowRight") handleNextSlide();
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showAuthModal, handleNextSlide, handlePrevSlide, onClose]);

  // ============ PAUSE HANDLERS ============
  const handlePauseStart = () => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    setIsPaused(true);
  };

  const handlePauseEnd = () => {
    pauseTimeoutRef.current = setTimeout(() => setIsPaused(false), 150);
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

  // ============ ACTIONS ============
  const handleViewDetails = (e) => {
    e.stopPropagation();
    if (!listingId) {
      toast.error("Invalid listing identifier");
      return;
    }
    onClose();
    navigate(`/listing/${listingId}`);
  };

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      setIsPaused(true);
      setShowAuthModal(true);
      return;
    }
    if (!listingId) return;

    try {
      const { data } = await API.post(`/favorites/listings/${listingId}`);
      setIsFavorited(data.is_favorited);
      toast.success(data.message || "Favorite updated");
    } catch (err) {
      toast.error("Failed to update favorite");
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (!listingId) return;

    const url = `${window.location.origin}/listing/${listingId}`;
    if (navigator.share) {
      navigator
        .share({
          title: currentListing?.title,
          text: `Check out ${currentListing?.title} on SimpleLet`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  // ============ RENDER GUARDS ============
  if (!isOpen) return null;

  if (isLoading || !currentListing) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 text-sm mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  const currentCover = hasImages ? images[currentImageIndex] : "";

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center sm:p-4">
        {/* Background Blur */}
        {currentCover && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl pointer-events-none scale-110"
            style={{ backgroundImage: `url(${currentCover})` }}
          />
        )}

        {/* Main Container Frame */}
        <div className="relative w-full max-w-md h-full sm:h-[90vh] sm:rounded-3xl bg-[#0a0a0a] overflow-hidden flex flex-col justify-between border border-white/10 shadow-2xl z-10">
          {/* Top Progress Segment Bars */}
          <div className="absolute top-0 inset-x-0 z-30 p-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent space-y-2">
            <div className="flex items-center gap-1.5 w-full">
              {hasImages ? (
                images.map((_, idx) => {
                  let barWidth = "0%";
                  if (idx < currentImageIndex) barWidth = "100%";
                  else if (idx === currentImageIndex) barWidth = `${progress}%`;

                  return (
                    <div
                      key={idx}
                      className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden"
                    >
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

            {/* Header Bar */}
            <div className="flex items-center justify-between text-white pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                {currentListing.house_type_display || "PROPERTY"}
              </span>

              <button
                onClick={onClose}
                className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-white transition cursor-pointer"
                aria-label="Close stories"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Story Screen Media Viewport */}
          <div
            onClick={handleTapOverlay}
            onMouseDown={handlePauseStart}
            onMouseUp={handlePauseEnd}
            onMouseLeave={handlePauseEnd}
            onTouchStart={handlePauseStart}
            onTouchEnd={handlePauseEnd}
            className="relative flex-1 w-full h-full bg-[#0a0a0a] flex items-center justify-center cursor-pointer select-none"
          >
            {hasImages ? (
              <img
                src={getOptimizedImageUrl(currentCover)}
                alt={currentListing.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="text-gray-500 text-sm">No Images Available</div>
            )}

            {/* Nav Buttons for Desktop */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevSlide();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white hidden sm:block transition cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextSlide();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white hidden sm:block transition cursor-pointer"
              aria-label="Next"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>

            {/* Paused Indicator */}
            {isPaused && !showAuthModal && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 rounded-full p-4">
                <div className="w-8 h-8 flex items-center justify-center text-white text-2xl">
                  ⏸
                </div>
              </div>
            )}
          </div>

          {/* Bottom Property Banner */}
          <div className="absolute bottom-0 inset-x-0 z-30 p-5 bg-gradient-to-t from-black via-black/90 to-transparent space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-baseline">
                <h2 className="text-xl font-bold text-white line-clamp-1">
                  {currentListing.title}
                </h2>
                <span className="text-xl font-black text-transparent bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text">
                  KSh {currentListing.price?.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-300">📍 {currentListing.location}</p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleViewDetails}
                className="flex-1 text-center py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                View Full Details
              </button>

              <button
                onClick={toggleFavorite}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition cursor-pointer"
                aria-label="Favorite"
              >
                {isFavorited ? (
                  <HeartSolidIcon className="w-5 h-5 text-blue-500" />
                ) : (
                  <HeartIcon className="w-5 h-5 text-gray-300" />
                )}
              </button>

              <button
                onClick={handleShare}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition cursor-pointer"
                aria-label="Share"
              >
                <ShareIcon className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            <div className="text-center pt-1">
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">
                Property {currentListingIndex + 1} of {storyQueue.length} • Tap
                left/right to browse
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setIsPaused(false);
        }}
        title="Save Your Favorite Properties"
        message="Log in or create an account to save properties and access them anytime."
      />
    </>
  );
}
