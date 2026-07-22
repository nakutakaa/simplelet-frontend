// src/components/ReviewSection.jsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";

// Submit review mutation
const submitReview = async ({
  listingId,
  rating,
  comment,
  flagType,
  flagDescription,
}) => {
  const { data } = await API.post("/reviews", {
    listing_id: listingId,
    rating,
    comment,
    flag_type: flagType,
    flag_description: flagDescription,
  });
  return data;
};

// Report scam mutation
const reportScam = async ({ listingId, description }) => {
  const { data } = await API.post(
    `/reviews/listings/${listingId}/report-scam`,
    {
      description,
    },
  );
  return data;
};

const ReviewSection = ({
  listingId,
  listingTitle,
  reviews,
  isLoading,
  isLoggedIn,
  userId,
  onReviewSubmitted,
}) => {
  const queryClient = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [flagType, setFlagType] = useState("");
  const [flagDescription, setFlagDescription] = useState("");
  const [showScamReport, setShowScamReport] = useState(false);
  const [scamDescription, setScamDescription] = useState("");

  // Submit review mutation
  const reviewMutation = useMutation({
    mutationFn: submitReview,
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      setShowReviewForm(false);
      setRating(0);
      setComment("");
      setFlagType("");
      setFlagDescription("");
      if (onReviewSubmitted) onReviewSubmitted();
      queryClient.invalidateQueries(["reviews", listingId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to submit review");
    },
  });

  // Report scam mutation
  const scamMutation = useMutation({
    mutationFn: reportScam,
    onSuccess: (data) => {
      toast.success(data.message || "Scam report submitted successfully");
      setShowScamReport(false);
      setScamDescription("");
      queryClient.invalidateQueries(["reviews", listingId]);
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.error || "Failed to submit scam report",
      );
    },
  });

  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    reviewMutation.mutate({
      listingId,
      rating,
      comment,
      flagType,
      flagDescription,
    });
  };

  const handleReportScam = (e) => {
    e.preventDefault();
    if (!scamDescription.trim()) {
      toast.error("Please describe why you think this is a scam");
      return;
    }
    scamMutation.mutate({
      listingId,
      description: scamDescription,
    });
  };

  // Render star rating
  const renderStars = (
    ratingValue,
    interactive = false,
    setValue = null,
    setHover = null,
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setValue && setValue(star)}
            onMouseEnter={() => setHover && setHover(star)}
            onMouseLeave={() => setHover && setHover(0)}
            className={interactive ? "cursor-pointer" : "cursor-default"}
            disabled={!interactive}
          >
            {star <= (hoverRating || rating || ratingValue) ? (
              <StarIcon
                className={`w-5 h-5 ${interactive ? "text-yellow-400 hover:scale-110 transition" : "text-yellow-400"}`}
              />
            ) : (
              <StarOutline
                className={`w-5 h-5 ${interactive ? "text-gray-500 hover:text-yellow-400/50 transition" : "text-gray-500"}`}
              />
            )}
          </button>
        ))}
      </div>
    );
  };

  // Flag types for reviews
  const flagOptions = [
    { value: "", label: "No issue" },
    { value: "upfront_fee", label: "Demanded upfront viewing fee" },
    { value: "price_higher", label: "Price higher than listed" },
    { value: "already_rented", label: "Already rented" },
    { value: "fake_photos", label: "Fake photos" },
    { value: "scam", label: "Scam" },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const reviewsList = reviews?.reviews || [];
  const averageRating = reviews?.average_rating || 0;
  const totalReviews = reviews?.total || 0;
  const ratingDistribution = reviews?.rating_distribution || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Reviews & Ratings
          <span className="text-sm text-gray-500 ml-2">({totalReviews})</span>
        </h3>
        {isLoggedIn && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="text-sm text-blue-400 hover:text-blue-300 transition"
          >
            + Write a Review
          </button>
        )}
      </div>

      {/* Rating Summary */}
      {totalReviews > 0 && (
        <div className="flex items-center gap-6 p-4 bg-black/30 rounded-xl border border-white/5">
          <div className="text-center">
            <p className="text-3xl font-bold text-white">
              {averageRating.toFixed(1)}
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              {renderStars(Math.round(averageRating))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{totalReviews} reviews</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star] || 0;
              const percentage =
                totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-6">{star}★</span>
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-6">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && isLoggedIn && (
        <form
          onSubmit={handleSubmitReview}
          className="p-4 bg-black/30 border border-white/10 rounded-xl"
        >
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-white">Write a Review</p>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="text-gray-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          {/* Rating */}
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1">Your Rating *</p>
            {renderStars(rating, true, setRating, setHoverRating)}
          </div>

          {/* Comment */}
          <div className="mb-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this property..."
              className="w-full input resize-none text-sm"
              rows={3}
            />
          </div>

          {/* Flag Type */}
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1">Issue (Optional)</p>
            <select
              value={flagType}
              onChange={(e) => setFlagType(e.target.value)}
              className="w-full input text-sm"
            >
              {flagOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Flag Description */}
          {flagType && (
            <div className="mb-3">
              <input
                type="text"
                value={flagDescription}
                onChange={(e) => setFlagDescription(e.target.value)}
                placeholder="Additional details about the issue..."
                className="w-full input text-sm"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={reviewMutation.isPending}
            className="w-full btn-primary disabled:opacity-50"
          >
            {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}

      {/* Reviews List */}
      {reviewsList.length > 0 ? (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
          {reviewsList.slice(0, 5).map((review) => (
            <div
              key={review.id}
              className="p-3 bg-black/20 rounded-xl border border-white/5"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">
                    {review.user?.name || "Anonymous"}
                  </span>
                  {review.is_phone_verified && (
                    <span className="text-xs text-blue-400">✓ Verified</span>
                  )}
                  {review.is_verified_visit && (
                    <span className="text-xs text-green-400">✓ Visited</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {renderStars(review.rating)}
                </div>
              </div>
              {review.comment && (
                <p className="text-gray-400 text-sm">{review.comment}</p>
              )}
              {review.is_flagged && (
                <p className="text-xs text-orange-400 mt-1">
                  ⚠️ Reported: {review.flag_type?.replace("_", " ")}
                </p>
              )}
              <p className="text-[10px] text-gray-500 mt-1">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
          {reviewsList.length > 5 && (
            <p className="text-center text-xs text-gray-500 mt-2">
              +{reviewsList.length - 5} more reviews
            </p>
          )}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4 text-sm">
          No reviews yet. Be the first to review this property!
        </p>
      )}

      {/* Report Scam Button */}
      {isLoggedIn && !showScamReport && (
        <button
          onClick={() => setShowScamReport(true)}
          className="text-xs text-red-400 hover:text-red-300 transition"
        >
          🚨 Report as Scam
        </button>
      )}

      {/* Scam Report Form */}
      {showScamReport && isLoggedIn && (
        <form
          onSubmit={handleReportScam}
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
        >
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-red-400">🚨 Report Scam</p>
            <button
              type="button"
              onClick={() => setShowScamReport(false)}
              className="text-gray-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>
          <textarea
            value={scamDescription}
            onChange={(e) => setScamDescription(e.target.value)}
            placeholder="Describe why you think this listing is a scam..."
            className="w-full input resize-none text-sm"
            rows={2}
            required
          />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={scamMutation.isPending}
              className="flex-1 btn-danger text-sm"
            >
              {scamMutation.isPending ? "Submitting..." : "Report Scam"}
            </button>
            <button
              type="button"
              onClick={() => setShowScamReport(false)}
              className="flex-1 btn-outline text-sm"
            >
              Cancel
            </button>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            ⚠️ Multiple scam reports will automatically quarantine this listing
          </p>
        </form>
      )}
    </div>
  );
};

export default ReviewSection;
