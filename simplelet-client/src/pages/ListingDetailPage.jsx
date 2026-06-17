// src/pages/ListingDetailPage.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";
import ImageSwiper from "../components/ImageSwiper";

// Helper function to get optimized Cloudinary URL
const getOptimizedImageUrl = (url, width = 800, height = 600) => {
  if (!url) return "";
  if (url.includes("cloudinary.com")) {
    return url.replace(
      "/upload/",
      `/upload/w_${width},h_${height},c_limit,q_auto,f_auto/`,
    );
  }
  return url;
};

const getThumbnailUrl = (url) => {
  if (!url) return "";
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", "/upload/w_150,h_150,c_fill,q_auto,f_auto/");
  }
  return url;
};

// Fetch listing details
const fetchListing = async (id) => {
  const { data } = await API.get(`/listings/${id}`);
  return data;
};

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showContact, setShowContact] = useState(false);
  const [swiperOpen, setSwiperOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch listing data
  const {
    data: listing,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => fetchListing(id),
  });

  const handleContactClick = () => {
    setShowContact(true);
  };

  const handleCopyPhone = () => {
    if (listing?.contact_phone) {
      navigator.clipboard.writeText(listing.contact_phone);
      toast.success("Phone number copied to clipboard!");
    }
  };

  const openImageSwiper = (index) => {
    setSelectedImageIndex(index);
    setSwiperOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Listing not found</p>
        <button onClick={() => navigate("/")} className="btn-primary mt-4">
          Back to Home
        </button>
      </div>
    );
  }

  const hasImages = listing.images && listing.images.length > 0;

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Image Gallery */}
      <div className="bg-black rounded-xl overflow-hidden mb-6">
        {hasImages ? (
          <div>
            {/* Main Image - Optimized */}
            <div
              className="relative cursor-pointer group"
              onClick={() => openImageSwiper(0)}
            >
              <img
                src={getOptimizedImageUrl(listing.images[0].url, 800, 600)}
                alt={listing.title}
                className="w-full h-[400px] object-cover"
                loading="eager"
              />

              {/* Image count badge */}
              {listing.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                  {listing.images.length} photos
                </div>
              )}

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-sm bg-black/50 px-3 py-1 rounded-full transition">
                  Tap to view gallery
                </span>
              </div>
            </div>

            {/* Thumbnail strip - Optimized */}
            {listing.images.length > 1 && (
              <div className="flex gap-2 p-2 overflow-x-auto">
                {listing.images.slice(0, 5).map((image, idx) => (
                  <button
                    key={image.id}
                    onClick={() => openImageSwiper(idx)}
                    className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-transparent hover:border-primary-500 transition"
                  >
                    <img
                      src={getThumbnailUrl(image.url)}
                      alt={`Thumb ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
                {listing.images.length > 5 && (
                  <button
                    onClick={() => openImageSwiper(5)}
                    className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center text-white text-sm"
                  >
                    +{listing.images.length - 5}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-[400px] bg-gray-200 flex items-center justify-center">
            <svg
              className="w-24 h-24 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Image Swiper Modal - Pass optimized images */}
      {swiperOpen && hasImages && (
        <ImageSwiper
          images={listing.images.map((img) => ({
            ...img,
            url: getOptimizedImageUrl(img.url, 1200, 900), // Full-screen optimized
          }))}
          onClose={() => setSwiperOpen(false)}
        />
      )}

      {/* Rest of the listing details remains the same */}
      {/* ... existing listing details code ... */}
    </div>
  );
}
