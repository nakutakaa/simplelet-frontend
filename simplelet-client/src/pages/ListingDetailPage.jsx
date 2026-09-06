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
import SafetyTip from "../components/SafetyTip";
import FullScreenMap from "../components/FullScreenMap";
import { useRealTimeComments, useRealTimeReviews } from "../hooks";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ArrowsPointingOutIcon, HeartIcon, ShareIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const verifiedPinIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const getErrorMessage = (error) => {
  const status = error.response?.status;
  const data = error.response?.data;
  const errorCode = data?.error_code || data?.error || "";

  const errorMap = {
    listing_not_found: "❌ Listing not found.",
    listing_expired: "⌛ This listing has expired.",
    comment_failed: "❌ Failed to post comment.",
  };

  if (errorCode && errorMap[errorCode]) return errorMap[errorCode];
  if (status === 401) return "🔒 Please login to continue.";
  return data?.message || data?.error || "❌ Something went wrong.";
};

const getOptimizedImageUrl = (url, width = 1000, height = 750) => {
  if (!url) return "";
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", `/upload/w_${width},h_${height},c_limit,q_auto,f_auto/`);
  }
  return url;
};

const getThumbnailUrl = (url) => {
  if (!url) return "";
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", "/upload/w_200,h_200,c_fill,q_auto,f_auto/");
  }
  return url;
};

const fetchListing = async (id) => (await API.get(`/listings/${id}`)).data;
const fetchComments = async (listingId) => (await API.get(`/comments/listings/${listingId}/comments`)).data;
const fetchReviews = async (listingId) => (await API.get(`/reviews/listings/${listingId}`)).data;
const postComment = async ({ listingId, content }) => (await API.post(`/comments/listings/${listingId}/comments`, { content })).data;

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showContact, setShowContact] = useState(false);
  const [swiperOpen, setSwiperOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [commentContent, setCommentContent] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isLoggedIn = !!token && user;
  const userId = user?.id || user?.user_id || null;

  const { comments: liveComments } = useRealTimeComments(id, userId);
  const { viewers: liveReviewViewers, eventsCount: liveReviewEventsCount } = useRealTimeReviews(id, userId);

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

  const toggleFavorite = async () => {
    if (!isLoggedIn) {
      toast.error("🔒 Please login to save listings");
      navigate("/login");
      return;
    }
    try {
      const { data } = await API.post(`/favorites/listings/${id}`);
      setIsFavorited(data.is_favorited);
      toast.success(data.message || "Favorite updated!");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const { data: listing, isLoading, error, refetch: refetchListing } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => fetchListing(id),
    retry: 1,
  });

  const { data: commentsData, isLoading: commentsLoading, refetch: refetchComments } = useQuery({
    queryKey: ["comments", id],
    queryFn: () => fetchComments(id),
    enabled: !!id,
  });

  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => fetchReviews(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (liveComments.length > 0) refetchComments();
  }, [liveComments.length, refetchComments]);

  useEffect(() => {
    if (liveReviewEventsCount > 0) {
      refetchReviews();
      refetchListing();
    }
  }, [liveReviewEventsCount, refetchReviews, refetchListing]);

  const commentMutation = useMutation({
    mutationFn: postComment,
    onSuccess: () => {
      toast.success("💬 Comment posted!");
      setCommentContent("");
      setIsCommenting(false);
      queryClient.invalidateQueries(["comments", id]);
      refetchComments();
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
      setIsCommenting(false);
    },
  });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing?.title,
        text: `Check out this listing on SimpleLet: ${listing?.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("🔗 Link copied to clipboard!");
    }
  };

  const handleCopyPhone = () => {
    if (listing?.contact_phone) {
      navigator.clipboard.writeText(listing.contact_phone);
      toast.success("📋 Phone number copied!");
    }
  };

  const openImageSwiper = (index) => {
    setSelectedImageIndex(index);
    setSwiperOpen(true);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) return navigate("/login");
    if (!commentContent.trim()) return toast.error("Please enter a comment");

    setIsCommenting(true);
    commentMutation.mutate({ listingId: id, content: commentContent });
  };

  const getMapLocation = () => {
    let lat, lng, source;
    if (listing?.pin_latitude != null && listing?.pin_longitude != null) {
      lat = parseFloat(listing.pin_latitude);
      lng = parseFloat(listing.pin_longitude);
      source = "pin";
    } else if (listing?.latitude != null && listing?.longitude != null) {
      lat = parseFloat(listing.latitude);
      lng = parseFloat(listing.longitude);
      source = "gps";
    }
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
    return { lat, lng, source };
  };

  const mapLocation = getMapLocation();
  const hasLocation = mapLocation !== null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">{error ? getErrorMessage(error) : "❌ Listing not found"}</p>
        <button onClick={() => navigate("/")} className="btn-primary mt-4">Back to Home</button>
      </div>
    );
  }

  const hasImages = listing.images && listing.images.length > 0;
  const author = listing.author || {};
  const isExpired = listing.is_expired || false;
  const isLocationVerified = Boolean(listing.location_verified || listing.pin_verified);
  const mainCover = hasImages ? listing.images[0].url : "";

  return (
    <div className="min-h-screen bg-[#121212] text-white -mt-4 sm:-mt-8 -mx-3 sm:-mx-6 lg:-mx-8">
      {/* Dynamic Spotify Ambient Hero Section */}
      <div className="relative w-full bg-gradient-to-b from-emerald-900/40 via-[#121212]/90 to-[#121212] pt-8 pb-6 px-4 sm:px-8 overflow-hidden">
        {/* Ambient Blur Layer derived from Cover Image */}
        {mainCover && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25 blur-3xl scale-125 pointer-events-none transition-all duration-700"
            style={{ backgroundImage: `url(${mainCover})` }}
          />
        )}

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
            
            {/* Spotify Album-Art Cover Preview Frame */}
            <div 
              onClick={() => hasImages && openImageSwiper(0)}
              className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 flex-shrink-0 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] cursor-pointer group border border-white/10"
            >
              {hasImages ? (
                <img
                  src={getOptimizedImageUrl(mainCover, 800, 800)}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              ) : (
                <div className="w-full h-full bg-[#282828] flex items-center justify-center text-gray-500">
                  No Image Available
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-medium">
                  🔍 View Gallery ({listing.images?.length || 0})
                </span>
              </div>
            </div>

            {/* Header Track Details */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold tracking-wider uppercase text-emerald-400">
                <SparklesIcon className="w-4 h-4" />
                <span>{listing.house_type_display || "PROPERTY"}</span>
                {isLocationVerified && <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full">VERIFIED LOCATION</span>}
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                {listing.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-gray-300 text-sm">
                <span>📍 {listing.location}</span>
                <span>•</span>
                <span>Posted by <strong className="text-white">{author.name || "Owner"}</strong></span>
              </div>

              {/* Price & Badge Banner */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                  KSh {listing.price?.toLocaleString()}
                  <span className="text-xs font-normal text-gray-400"> / mo</span>
                </span>

                {listing.is_taken && <span className="bg-red-500/20 border border-red-500/30 text-red-400 text-xs px-2.5 py-1 rounded-full font-semibold">TAKEN</span>}
                {isExpired && <span className="bg-gray-500/20 border border-gray-500/30 text-gray-400 text-xs px-2.5 py-1 rounded-full font-semibold">EXPIRED</span>}
              </div>
            </div>
          </div>

          {/* Gallery Media Strip (Spotify Track Playlist Style) */}
          {hasImages && listing.images.length > 1 && (
            <div className="mt-6 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {listing.images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => openImageSwiper(idx)}
                  className={`relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                    selectedImageIndex === idx ? "border-emerald-500 scale-105 shadow-lg shadow-emerald-500/20" : "border-white/10 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={getThumbnailUrl(img.url)} alt={`Media ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Floating Controls Bar (Spotify Action Bar) */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#181818] rounded-2xl border border-white/5 shadow-xl">
          <div className="flex items-center gap-3">
            {/* Play/Contact CTA Button */}
            <button
              onClick={() => setShowContact(!showContact)}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 transition transform"
            >
              <span>📞</span>
              <span>{showContact ? "Hide Contact" : "Contact Owner"}</span>
            </button>

            {/* Favorite Button */}
            <button
              onClick={toggleFavorite}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition hover:scale-105"
              title="Save to Favorites"
            >
              {isFavorited ? (
                <HeartSolidIcon className="w-6 h-6 text-red-500" />
              ) : (
                <HeartIcon className="w-6 h-6 text-gray-300" />
              )}
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition hover:scale-105"
              title="Share Listing"
            >
              <ShareIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Author Credibility */}
          {author.id && (
            <div className="flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
              <span className="text-xs text-gray-400">Listed by <strong className="text-white">{author.name}</strong></span>
              <CredibilityBadge
                userId={author.id}
                score={author.credibility_score}
                badge={author.badge}
                isVerified={author.is_verified}
              />
            </div>
          )}
        </div>

        {/* Revealed Contact Card */}
        {showContact && (
          <div className="p-6 bg-[#181818] border border-emerald-500/30 rounded-2xl shadow-2xl animate-fadeIn space-y-4">
            <SafetyTip page="contact" className="mb-2" />
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-400">Direct Contact Number</p>
              <div className="flex items-center justify-center gap-3">
                <a href={`tel:${listing.contact_phone}`} className="text-2xl font-bold text-emerald-400 hover:underline">
                  {listing.contact_phone}
                </a>
                <button onClick={handleCopyPhone} className="text-gray-400 hover:text-white transition">📋</button>
              </div>
            </div>
            <WhatsAppButton
              listingId={listing.id}
              userPhone={listing.contact_phone}
              listingTitle={listing.title}
              listingPrice={listing.price}
            />
          </div>
        )}

        {/* Overview & Description Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 bg-[#181818] rounded-2xl border border-white/5 space-y-4">
              <h2 className="text-xl font-bold text-white">About Listing</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                {listing.description || "No description provided."}
              </p>
            </div>

            {/* Building Features & Utilities */}
            <div className="p-6 bg-[#181818] rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-lg font-bold text-white">Amenities & Features</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FeatureCard label="Elevator / Lift" value={listing.has_lift} />
                <FeatureCard label="CCTV Security" value={listing.has_cctv} />
                <FeatureCard label="Private Balcony" value={listing.has_balcony} />
                <FeatureCard label="Rooftop Access" value={listing.has_rooftop} />
                <FeatureCard label="Dedicated Parking" value={listing.has_parking} />
                <FeatureCard label="Perimeter Fence" value={listing.has_fence} />
              </div>
            </div>
          </div>

          {/* Pricing & Logistics Summary Sidebar */}
          <div className="space-y-6">
            <div className="p-6 bg-[#181818] rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-lg font-bold text-white">Cost Breakdown</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400">Base Rent</span>
                  <span className="font-semibold text-white">KSh {listing.price?.toLocaleString()}</span>
                </div>
                {listing.service_charge > 0 && (
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Service Charge</span>
                    <span className="font-semibold text-white">KSh {listing.service_charge?.toLocaleString()}</span>
                  </div>
                )}
                {listing.trash_fee > 0 && (
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Trash Fee</span>
                    <span className="font-semibold text-white">KSh {listing.trash_fee?.toLocaleString()}</span>
                  </div>
                )}
                {listing.true_monthly_cost && (
                  <div className="flex justify-between pt-1 text-emerald-400 font-bold">
                    <span>True Monthly Cost</span>
                    <span>KSh {listing.true_monthly_cost?.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        {hasLocation && (
          <div className="p-6 bg-[#181818] rounded-2xl border border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Location Overview</h3>
              <button
                onClick={() => setIsMapFullScreen(true)}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                <ArrowsPointingOutIcon className="w-4 h-4" /> Full Screen
              </button>
            </div>
            <div className="h-64 rounded-xl overflow-hidden border border-white/10 relative">
              <MapContainer center={[mapLocation.lat, mapLocation.lng]} zoom={15} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[mapLocation.lat, mapLocation.lng]} icon={isLocationVerified ? verifiedPinIcon : L.Icon.Default} />
                <Circle center={[mapLocation.lat, mapLocation.lng]} radius={400} pathOptions={{ color: "#10b981", fillOpacity: 0.15 }} />
              </MapContainer>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="p-6 bg-[#181818] rounded-2xl border border-white/5">
          <ReviewSection
            listingId={listing.id}
            listingTitle={listing.title}
            reviews={reviewsData}
            isLoading={reviewsLoading}
            isLoggedIn={isLoggedIn}
            userId={user?.id}
            onReviewSubmitted={() => {
              refetchReviews();
              refetchListing();
            }}
          />
        </div>

        {/* Comments Section */}
        <div className="p-6 bg-[#181818] rounded-2xl border border-white/5 space-y-6">
          <h3 className="text-lg font-bold text-white">Community Discussion</h3>
          {isLoggedIn ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-3">
              <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <button type="submit" disabled={isCommenting} className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-xl text-sm transition">
                Post
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-400">Please <Link to="/login" className="text-emerald-400 underline">login</Link> to participate in the conversation.</p>
          )}

          <div className="space-y-4">
            {commentsData?.comments?.map((comment) => (
              <CommentItem key={comment.id} comment={comment} listingId={id} onReply={refetchComments} />
            ))}
          </div>
        </div>

      </div>

      {/* Fullscreen Gallery Swiper */}
      {swiperOpen && hasImages && (
        <ImageSwiper
          images={listing.images.map((img) => ({ ...img, url: getOptimizedImageUrl(img.url, 1200, 900) }))}
          onClose={() => setSwiperOpen(false)}
        />
      )}

      {/* Full Screen Map */}
      {hasLocation && (
        <FullScreenMap
          isOpen={isMapFullScreen}
          onClose={() => setIsMapFullScreen(false)}
          location={mapLocation}
          title={listing.title}
          isVerified={isLocationVerified}
        />
      )}
    </div>
  );
}

// Sub-component for features
function FeatureCard({ label, value }) {
  if (value === undefined || value === null) return null;
  return (
    <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-medium ${value ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-white/5 border-white/5 text-gray-500"}`}>
      <span>{value ? "✓" : "✕"}</span>
      <span>{label}</span>
    </div>
  );
}
