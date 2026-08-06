// src/hooks/useRealTimeComments.js
import { useEffect, useState, useCallback } from "react";
import useSocket from "./useSocket";

export const useRealTimeComments = (listingId, userId) => {
  const { emit, on, off } = useSocket(userId);
  const [comments, setComments] = useState([]);
  const [viewers, setViewers] = useState([]);

  useEffect(() => {
    if (!listingId) return;

    // Join comments room
    emit("join_comments", { listing_id: listingId });

    // Listen for new comments
    const handleCommentAdded = (data) => {
      setComments((prev) => {
        const existing = prev.some(
          (comment) =>
            String(comment.id || comment.comment_id) ===
            String(data.id || data.comment_id),
        );
        if (existing) return prev;
        return [...prev, data];
      });
    };

    const handleCommentRemoved = (data) => {
      setComments((prev) =>
        prev.filter((comment) => comment.comment_id !== data.comment_id),
      );
    };

    const handleCommentsJoined = (data) => {
      setViewers(data.viewers || []);
    };

    on("comment_added", handleCommentAdded);
    on("comment_removed", handleCommentRemoved);
    on("comments_joined", handleCommentsJoined);

    return () => {
      off("comment_added", handleCommentAdded);
      off("comment_removed", handleCommentRemoved);
      off("comments_joined", handleCommentsJoined);
      emit("leave_comments", { listing_id: listingId });
    };
  }, [listingId, emit, on, off]);

  const addComment = useCallback(
    (commentData) => {
      emit("new_comment", {
        listing_id: listingId,
        user_id: userId,
        ...commentData,
      });
    },
    [listingId, userId, emit],
  );

  const deleteComment = useCallback(
    (commentId) => {
      emit("comment_deleted", {
        listing_id: listingId,
        comment_id: commentId,
      });
    },
    [listingId, emit],
  );

  return {
    comments,
    viewers,
    addComment,
    deleteComment,
  };
};

export default useRealTimeComments;
