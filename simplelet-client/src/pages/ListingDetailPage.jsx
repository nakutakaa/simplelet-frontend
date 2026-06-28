// src/pages/ListingDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";
import ImageSwiper from "../components/ImageSwiper";
import CommentItem from "../components/CommentItem";

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

// Post comment - ONLY for logged-in users
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

  // Check favorite status (only if logged in)
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

  // Toggle favorite (only if logged in)
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

  // Post comment mutation (ONLY for logged-in users)
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
            url: getOptimizedImageUrl(img.url, 1200, 900),
          }))}
          onClose={() => setSwiperOpen(false)}
        />
      )}

      {/* Listing Details */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Title & Status */}
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          {listing.is_taken && (
            <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full">
              Taken
            </span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-gray-500 mb-4">
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

        {/* Price */}
        <div className="mb-4">
          <p className="text-3xl font-bold text-primary-600">
            KSh {listing.price?.toLocaleString()}
            {listing.price && (
              <span className="text-sm font-normal text-gray-500">
                {" "}
                / month
              </span>
            )}
          </p>
        </div>

        {/* Description */}
        {listing.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>
        )}

        {/* Favorite Button - Only for logged-in users */}
        {isLoggedIn ? (
          <button
            onClick={toggleFavorite}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition mb-4 ${
              isFavorited
                ? "bg-red-100 text-red-600 hover:bg-red-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg transition bg-gray-100 text-gray-600 hover:bg-gray-200">
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

        {/* Property Details */}
        <div className="border-t border-gray-100 pt-4 mb-6">
          <h3 className="font-semibold text-lg mb-3">Property Details</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Property Type</p>
              <p className="font-medium">{listing.house_type_display}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Posted By</p>
              <p className="font-medium">{listing.author?.name}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Posted On</p>
              <p className="font-medium">
                {new Date(listing.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500">Status</p>
              <p
                className={`font-medium ${listing.is_taken ? "text-red-600" : "text-green-600"}`}
              >
                {listing.is_taken ? "Taken" : "Available"}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="border-t border-gray-100 pt-6">
          {!showContact ? (
            <button onClick={handleContactClick} className="w-full btn-primary">
              Reveal Contact Number
            </button>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Contact Seller</p>
              <div className="flex items-center justify-center gap-3">
                <a
                  href={`tel:${listing.contact_phone}`}
                  className="text-primary-600 font-semibold text-lg"
                >
                  {listing.contact_phone}
                </a>
                <button
                  onClick={handleCopyPhone}
                  className="text-gray-500 hover:text-primary-600"
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
              <p className="text-xs text-gray-400 mt-2">
                Click to call or copy the number
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
        <h3 className="font-semibold text-lg mb-4">
          Comments
          {commentsData && (
            <span className="text-sm text-gray-500 ml-2">
              ({commentsData.total})
            </span>
          )}
        </h3>

        {/* Comment Input - ONLY for logged-in users */}
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
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
            <p className="text-gray-600 mb-2">Want to join the conversation?</p>
            <div className="flex justify-center gap-3">
              <Link to="/login" className="btn-primary text-sm">
                Login
              </Link>
              <Link to="/register" className="btn-outline text-sm">
                Register
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Login or register to comment on this listing
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {commentsLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
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
            <p className="text-gray-500 text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
