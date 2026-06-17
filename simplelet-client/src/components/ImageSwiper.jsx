// src/components/ImageSwiper.jsx
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

export default function ImageSwiper({ images, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  const currentImage = images[currentIndex];

  // Handle next/prev
  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsZoomed(false);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsZoomed(false);
  };

  // Touch events for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        prevImage();
      } else if (e.key === "ArrowRight") {
        nextImage();
      } else if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  // Zoom functionality
  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
    setZoomPosition({ x: 0, y: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isZoomed || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({
      x: Math.min(Math.max(x, 0), 100),
      y: Math.min(Math.max(y, 0), 100),
    });
  };
  // Helper to optimize images in swiper
  const getSwiperImageUrl = (url) => {
    if (!url) return "";
    if (url.includes("cloudinary.com")) {
      return url.replace(
        "/upload/",
        "/upload/w_1200,h_900,c_limit,q_auto,f_auto/",
      );
    }
    return url;
  };

  // In the img tag:
  <img
    ref={imageRef}
    src={getSwiperImageUrl(currentImage.url)}
    alt={`Slide ${currentIndex + 1}`}
    className="max-h-screen max-w-screen object-contain"
    draggable={false}
    loading="eager"
  />;

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with controls */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white">
          <span className="text-sm">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={toggleZoom}
            className="text-white hover:text-gray-300 transition"
            title={isZoomed ? "Zoom out" : "Zoom in"}
          >
            {isZoomed ? <ZoomOut size={24} /> : <ZoomIn size={24} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 transition"
              title="Close"
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Main image area */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden cursor-pointer"
        onMouseMove={handleMouseMove}
        onClick={!isZoomed ? toggleZoom : undefined}
      >
        <div
          className="relative transition-transform duration-200"
          style={{
            transform: isZoomed ? `scale(2)` : "scale(1)",
            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
            cursor: isZoomed ? "zoom-out" : "zoom-in",
          }}
        >
          <img
            ref={imageRef}
            src={currentImage.url}
            alt={`Slide ${currentIndex + 1}`}
            className="max-h-screen max-w-screen object-contain"
            draggable={false}
          />
        </div>
      </div>

      {/* Navigation buttons (desktop) */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition hidden md:block"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition hidden md:block"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Swipe indicator (mobile) */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-xs">
          ← Swipe to navigate →
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex justify-center gap-2 overflow-x-auto">
            {images.map((image, idx) => (
              <button
                key={image.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsZoomed(false);
                }}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition ${
                  idx === currentIndex
                    ? "border-white"
                    : "border-transparent opacity-60"
                }`}
              >
                <img
                  src={image.thumbnail}
                  alt={`Thumb ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
