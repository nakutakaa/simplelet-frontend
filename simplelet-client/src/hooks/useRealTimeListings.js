// src/hooks/useRealTimeListings.js
import { useEffect, useState, useCallback } from "react";
import useSocket from "./useSocket";

export const useRealTimeListings = (listingId, userId, searchParams = null) => {
  const { emit, on, off } = useSocket(userId);
  const [listingStatus, setListingStatus] = useState(null);
  const [newListings, setNewListings] = useState([]);
  const [viewers, setViewers] = useState([]);

  // Join listing room for status updates
  useEffect(() => {
    if (!listingId) return;

    emit("join_listing", { listing_id: listingId });

    const handleStatusUpdate = (data) => {
      setListingStatus({
        listing_id: data.listing_id,
        is_taken: data.is_taken,
        updated_at: data.updated_at,
      });
    };

    const handleListingJoined = (data) => {
      setViewers(data.viewers || []);
    };

    on("listing_status_update", handleStatusUpdate);
    on("listing_joined", handleListingJoined);

    return () => {
      off("listing_status_update", handleStatusUpdate);
      off("listing_joined", handleListingJoined);
      emit("leave_listing", { listing_id: listingId });
    };
  }, [listingId, emit, on, off]);

  // Join search feed for new listings
  useEffect(() => {
    if (!searchParams) return;

    emit("join_search_feed", {
      search_params: searchParams,
      user_id: userId,
    });

    const handleNewListing = (data) => {
      setNewListings((prev) => [data, ...prev].slice(0, 50)); // Keep latest 50
    };

    on("new_listing", handleNewListing);

    return () => {
      off("new_listing", handleNewListing);
    };
  }, [searchParams, userId, emit, on, off]);

  const updateListingStatus = useCallback(
    (isTaken) => {
      emit("listing_status_changed", {
        listing_id: listingId,
        is_taken: isTaken,
      });
    },
    [listingId, emit],
  );

  const broadcastNewListing = useCallback(
    (listingData) => {
      emit("new_listing_created", {
        listing_id: listingData.id,
        title: listingData.title,
        location: listingData.location,
        price: listingData.price,
        image_url: listingData.image_url,
        house_type: listingData.house_type,
      });
    },
    [emit],
  );

  return {
    listingStatus,
    newListings,
    viewers,
    updateListingStatus,
    broadcastNewListing,
  };
};

export default useRealTimeListings;
