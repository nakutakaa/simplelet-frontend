// src/pages/ListingDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";
import ImageSwiper from "../components/ImageSwiper";
import CommentItem from "../components/CommentItem";
import ReviewSection from "../components/ReviewSection";
import WhatsAppButton from "../components/WhatsAppButton";
import CredibilityBadge from "../components/CredibilityBadge";

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

// Fetch comments
const fetchComments = async (listingId) => {
  const { data } = await API.get(`/comments/listings/${listingId}/comments`);
  return data;
};

// Fetch reviews
const fetchReviews = async (listingId) => {
  const { data } = await API.get(`/reviews/listings/${listingId}`);
  return data;
};

// Post comment
const postComment = async ({ listingId, content }) => {
  const { data } = await API.post(`/comments/listings/${listingId}/comments`, {
    content,
  });
  return data;
};

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showContact, setShowContact] = useState(false);
  const [swiperOpen, setSwiperOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [commentContent, setCommentContent] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);

  // Check if user is logged in
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = !!token && user;

  // Check favorite status
  useEffect(() => {
    const checkFavorite = async () => {
      if (!id || !isLoggedIn) return;
      try {
        const { data } = await API.get(`/favorites/check/${id}`);
        setIsFavorited(data.is_favorited);
      } catch (error) {
        console.error("Error checking favorite:", error);
      }
    };
    checkFavorite();
  }, [id, isLoggedIn]);

  // Toggle favorite
  const toggleFavorite = async () => {
    if (!isLoggedIn) {
      toast.error("Please login to save favorites");
      navigate("/login");
      return;
    }
    try {
      const { data } = await API.post(`/favorites/listings/${id}`);
      setIsFavorited(data.is_favorited);
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update favorite");
    }
  };

  // Fetch listing data
  const {
    data: listing,
    isLoading,
    error,
    refetch: refetchListing,
  } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => fetchListing(id),
  });

  // Fetch comments
  const {
    data: commentsData,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => fetchComments(id),
    enabled: !!id,
  });

  // Fetch reviews
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => fetchReviews(id),
    enabled: !!id,
  });

  // Post comment mutation
  const commentMutation = useMutation({
    mutationFn: postComment,
    onSuccess: () => {
      toast.success("Comment posted!");
      setCommentContent("");
      queryClient.invalidateQueries(["comments", id]);
      refetchComments();
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || "Failed to post comment";
      toast.error(errorMsg);
    },
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

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to comment");
      navigate("/login");
      return;
    }
    if (!commentContent.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    commentMutation.mutate({
      listingId: id,
      content: commentContent,
    });
  };

  const handleReviewSubmitted = () => {
    refetchReviews();
    refetchListing();
    toast.success("Review submitted! Thank you for your feedback.");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Listing not found</p>
        <button onClick={() => navigate("/")} className="btn-primary mt-4">
          Back to Home
        </button>
      </div>
    );
  }

  const hasImages = listing.images && listing.images.length > 0;
  const author = listing.author || {};
  const isExpired = listing.is_expired || false;
  const expiryStatus = listing.expiry_status || "active";
  const expiryStatusText = listing.expiry_status_text || "Active";
  const daysRemaining = listing.days_remaining;

  // Helper to render feature check
  const renderFeature = (label, value) => {
    if (value === undefined || value === null) return null;
    return (
      <span className={`text-xs ${value ? "text-green-400" : "text-gray-500"}`}>
        {value ? "✅" : "❌"} {label}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Image Gallery */}
      <div className="bg-black rounded-2xl border border-white/10 overflow-hidden mb-6">
        {hasImages ? (
          <div>
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
              {listing.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                  {listing.images.length} photos
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-white text-sm bg-black/50 px-3 py-1 rounded-full transition">
                  Tap to view gallery
                </span>
              </div>
            </div>
            {listing.images.length > 1 && (
              <div className="flex gap-2 p-2 overflow-x-auto">
                {listing.images.slice(0, 5).map((image, idx) => (
                  <button
                    key={image.id}
                    onClick={() => openImageSwiper(idx)}
                    className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition"
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
                    className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-[#1a1a1a] flex items-center justify-center text-white text-sm border border-white/10 hover:border-blue-500 transition"
                  >
                    +{listing.images.length - 5}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-[400px] bg-[#0a0a0a] flex items-center justify-center">
            <svg
              className="w-24 h-24 text-gray-700"
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

      {/* Image Swiper Modal */}
      {swiperOpen && hasImages && (
        <ImageSwiper
          images={listing.images.map((img) => ({
            ...img,
            url: getOptimizedImageUrl(img.url, 1200, 900),
          }))}
          onClose={() => setSwiperOpen(false)}
        />
      )}

      {/* Listing Details */}
      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-4 sm:p-6 shadow-xl">
        {/* Title & Status */}
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {listing.title}
          </h1>
          <div className="flex flex-col items-end gap-1">
            {listing.is_taken && <span className="badge-red">Taken</span>}
            {isExpired && <span className="badge-red">Expired</span>}
            {!isExpired && !listing.is_taken && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${
                  expiryStatus === "active"
                    ? "border-green-500/30 text-green-400 bg-green-500/10"
                    : expiryStatus === "needs_confirmation"
                      ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
                      : "border-orange-500/30 text-orange-400 bg-orange-500/10"
                }`}
              >
                {expiryStatusText}
              </span>
            )}
            {!isExpired && !listing.is_taken && daysRemaining !== undefined && (
              <span className="text-[10px] text-gray-500">
                {daysRemaining} days remaining
              </span>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>{listing.location}</span>
        </div>

        {/* Author Credibility Badge */}
        {author.id && (
          <div className="mb-4 p-3 bg-black/30 rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500">Posted by</p>
                <p className="font-medium text-white">{author.name}</p>
              </div>
              <CredibilityBadge
                userId={author.id}
                score={author.credibility_score}
                badge={author.badge}
                isVerified={author.is_verified}
              />
            </div>
          </div>
        )}

        {/* Price & True Monthly Cost */}
        <div className="mb-4">
          <p className="text-2xl sm:text-3xl font-bold text-transparent bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text">
            KSh {listing.price?.toLocaleString()}
            {listing.price && (
              <span className="text-sm font-normal text-gray-500">
                {" "}
                / month
              </span>
            )}
          </p>
          {listing.true_monthly_cost &&
            listing.true_monthly_cost !== listing.price && (
              <p className="text-xs text-gray-400 mt-1">
                💰 Total monthly: KSh{" "}
                {listing.true_monthly_cost.toLocaleString()}
                (incl. service charge)
              </p>
            )}
        </div>

        {/* Description */}
        {listing.description && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Description
            </h3>
            <p className="text-gray-400 text-sm whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>
        )}

        {/* Favorite Button */}
        {isLoggedIn ? (
          <button
            onClick={toggleFavorite}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition mb-4 ${
              isFavorited
                ? "bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30"
                : "bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill={isFavorited ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {isFavorited ? "Saved" : "Save"}
          </button>
        ) : (
          <Link to="/login" className="inline-block mb-4">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl transition bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              Login to Save
            </button>
          </Link>
        )}

        {/* ============ LAYER 1: UTILITY & FEES ============ */}
        {(listing.service_charge > 0 || listing.trash_fee > 0) && (
          <div className="border-t border-white/10 pt-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              💰 Fees & Charges
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {listing.service_charge > 0 && (
                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500">Service Charge</p>
                  <p className="font-medium text-white text-sm">
                    KSh {listing.service_charge.toLocaleString()}
                  </p>
                </div>
              )}
              {listing.trash_fee > 0 && (
                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500">Trash Fee</p>
                  <p className="font-medium text-white text-sm">
                    KSh {listing.trash_fee.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ LAYER 1: WATER MATRIX ============ */}
        {(listing.water_source ||
          listing.water_metering ||
          listing.water_rationing) && (
          <div className="border-t border-white/10 pt-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              💧 Water Information
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {listing.water_source && (
                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500">Source</p>
                  <p className="font-medium text-white text-sm">
                    {listing.water_source_display}
                  </p>
                </div>
              )}
              {listing.water_metering && (
                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500">Metering</p>
                  <p className="font-medium text-white text-sm">
                    {listing.water_metering_display}
                  </p>
                </div>
              )}
              {listing.water_rationing &&
                listing.water_rationing !== "none" && (
                  <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500">Rationing</p>
                    <p className="font-medium text-white text-sm">
                      {listing.water_rationing_display}
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* ============ LAYER 1: POWER MATRIX ============ */}
        {(listing.power_metering || listing.backup_power) && (
          <div className="border-t border-white/10 pt-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              ⚡ Power Information
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {listing.power_metering && (
                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500">Metering</p>
                  <p className="font-medium text-white text-sm">
                    {listing.power_metering_display}
                  </p>
                </div>
              )}
              {listing.backup_power && (
                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500">Backup Power</p>
                  <p className="font-medium text-white text-sm">
                    {listing.backup_power_display}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ LAYER 1: BUILDING FEATURES ============ */}
        {(listing.has_lift ||
          listing.has_cctv ||
          listing.has_balcony ||
          listing.has_rooftop ||
          listing.has_parking ||
          listing.has_fence) && (
          <div className="border-t border-white/10 pt-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              🏢 Building Features
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {renderFeature("Elevator/Lift", listing.has_lift)}
              {renderFeature("CCTV", listing.has_cctv)}
              {renderFeature("Balcony", listing.has_balcony)}
              {renderFeature("Rooftop Access", listing.has_rooftop)}
              {renderFeature("Dedicated Parking", listing.has_parking)}
              {renderFeature("Perimeter Fence", listing.has_fence)}
            </div>
          </div>
        )}

        {/* ============ LAYER 1: COMMUTE & LOGISTICS ============ */}
        {(listing.matatu_distance ||
          listing.matatu_walk_time ||
          listing.fare_cbd_offpeak ||
          listing.fare_cbd_peak ||
          listing.supermarket_distance ||
          listing.gym_distance) && (
          <div className="border-t border-white/10 pt-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              🚌 Commute & Logistics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {listing.matatu_distance && (
                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500">Matatu Distance</p>
                  <p className="font-medium text-white text-sm">
                    {listing.matatu_distance}m
                  </p>
                </div>
              )}
              {listing.matatu_walk_time && (
                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500">Walk Time</p>
                  <p className="font-medium text-white text-sm">
                    {listing.matatu_walk_time} min
                  </p>
                </div>
              )}
              {listing.fare_cbd_offpeak && (
                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500">
                    Fare to CBD (Off-peak)
                  </p>
                  <p className="font-medium text-white text-sm">
                    KSh {listing.fare_cbd_offpeak}
                  </p>
                </div>
              )}
              {listing.fare_cbd_peak && (
                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500">
                    Fare to CBD (Peak)
                  </p>
                  <p className="font-medium text-white text-sm">
                    KSh {listing.fare_cbd_peak}
                  </p>
                </div>
              )}
              {listing.supermarket_distance && (
                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500">Supermarket</p>
                  <p className="font-medium text-white text-sm">
                    {listing.supermarket_distance}m
                  </p>
                </div>
              )}
              {listing.gym_distance && (
                <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                  <p className="text-[10px] text-gray-500">Gym</p>
                  <p className="font-medium text-white text-sm">
                    {listing.gym_distance}m
                  </p>
                </div>
              )}
            </div>
            {listing.food_delivery_available && (
              <p className="text-xs text-green-400 mt-2">
                ✅ Food delivery available (Bolt/Uber Eats)
              </p>
            )}
          </div>
        )}

        {/* Property Details (Basic) */}
        <div className="border-t border-white/10 pt-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Property Details
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/50 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] text-gray-500">Property Type</p>
              <p className="font-medium text-white text-sm">
                {listing.house_type_display}
              </p>
            </div>
            <div className="bg-black/50 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] text-gray-500">Posted By</p>
              <p className="font-medium text-white text-sm">
                {listing.author?.name}
              </p>
            </div>
            <div className="bg-black/50 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] text-gray-500">Posted On</p>
              <p className="font-medium text-white text-sm">
                {new Date(listing.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-black/50 border border-white/5 rounded-xl p-3">
              <p className="text-[10px] text-gray-500">Status</p>
              <p
                className={`font-medium text-sm ${listing.is_taken ? "text-red-400" : "text-green-400"}`}
              >
                {listing.is_taken ? "Taken" : "Available"}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section with WhatsApp */}
        <div className="border-t border-white/10 pt-6">
          {!showContact ? (
            <button onClick={handleContactClick} className="w-full btn-primary">
              Reveal Contact Number
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-black/50 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-400 mb-2">Contact Seller</p>
                <div className="flex items-center justify-center gap-3">
                  <a
                    href={`tel:${listing.contact_phone}`}
                    className="text-blue-400 font-semibold text-lg hover:text-blue-300 transition"
                  >
                    {listing.contact_phone}
                  </a>
                  <button
                    onClick={handleCopyPhone}
                    className="text-gray-400 hover:text-white transition"
                    title="Copy to clipboard"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  Click to call or copy the number
                </p>
              </div>

              {/* WhatsApp Button */}
              <WhatsAppButton
                listingId={listing.id}
                userPhone={listing.contact_phone}
                listingTitle={listing.title}
                listingPrice={listing.price}
              />
            </div>
          )}
        </div>

        {/* ============ Review Section ============ */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <ReviewSection
            listingId={listing.id}
            listingTitle={listing.title}
            reviews={reviewsData}
            isLoading={reviewsLoading}
            isLoggedIn={isLoggedIn}
            userId={user?.id}
            onReviewSubmitted={handleReviewSubmitted}
          />
        </div>

        {/* Comments Section */}
        <div className="bg-black rounded-2xl border border-white/10 p-4 sm:p-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Comments
            {commentsData && (
              <span className="text-sm text-gray-500 ml-2">
                ({commentsData.total})
              </span>
            )}
          </h3>

          {/* Comment Input */}
          {isLoggedIn ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-3 mb-6">
              <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 input"
                disabled={commentMutation.isPending}
              />
              <button
                type="submit"
                disabled={commentMutation.isPending || !commentContent.trim()}
                className="btn-primary px-6"
              >
                {commentMutation.isPending ? "Posting..." : "Post"}
              </button>
            </form>
          ) : (
            <div className="bg-black/50 border border-white/10 rounded-xl p-4 mb-6 text-center">
              <p className="text-gray-400 text-sm mb-2">
                Want to join the conversation?
              </p>
              <div className="flex justify-center gap-3">
                <Link to="/login" className="btn-primary text-sm">
                  Login
                </Link>
                <Link to="/register" className="btn-outline text-sm">
                  Register
                </Link>
              </div>
              <p className="text-[10px] text-gray-500 mt-2">
                Login or register to comment on this listing
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : commentsData?.comments?.length > 0 ? (
              commentsData.comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  listingId={id}
                  onReply={refetchComments}
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
