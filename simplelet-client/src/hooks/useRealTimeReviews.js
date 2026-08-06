// src/hooks/useRealTimeReviews.js
import { useEffect, useState } from "react";
import useSocket from "./useSocket";

export const useRealTimeReviews = (listingId, userId) => {
  const { emit, on, off } = useSocket(userId);
  const [viewers, setViewers] = useState([]);
  const [eventsCount, setEventsCount] = useState(0);

  useEffect(() => {
    if (!listingId) return;

    emit("join_reviews", { listing_id: listingId });

    const handleReviewAdded = () => {
      setEventsCount((prev) => prev + 1);
    };

    const handleReviewRemoved = () => {
      setEventsCount((prev) => prev + 1);
    };

    const handleReviewsJoined = (data) => {
      setViewers(data.viewers || []);
    };

    on("review_added", handleReviewAdded);
    on("review_removed", handleReviewRemoved);
    on("reviews_joined", handleReviewsJoined);

    return () => {
      off("review_added", handleReviewAdded);
      off("review_removed", handleReviewRemoved);
      off("reviews_joined", handleReviewsJoined);
      emit("leave_reviews", { listing_id: listingId });
    };
  }, [listingId, emit, on, off]);

  return {
    viewers,
    eventsCount,
  };
};

export default useRealTimeReviews;
