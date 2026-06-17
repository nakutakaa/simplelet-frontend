// src/components/CommentItem.jsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";

const postReply = async ({ listingId, parentId, content }) => {
  const { data } = await API.post(`/comments/listings/${listingId}/comments`, {
    content,
    parent_id: parentId,
  });
  return data;
};

export default function CommentItem({
  comment,
  listingId,
  depth = 0,
  onReply,
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState(true);
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: postReply,
    onSuccess: () => {
      toast.success("Reply posted!");
      setReplyContent("");
      setShowReplyForm(false);
      queryClient.invalidateQueries(["comments", listingId]);
      if (onReply) onReply();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to post reply");
    },
  });

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      toast.error("Please enter a reply");
      return;
    }
    replyMutation.mutate({
      listingId,
      parentId: comment.id,
      content: replyContent,
    });
  };

  const canReply = depth < 10;
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div
      className={`${depth > 0 ? "ml-6 border-l-2 border-gray-200 pl-4" : ""}`}
    >
      {/* Comment content */}
      <div className="bg-gray-50 rounded-lg p-4 mb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{comment.author_name}</span>
            <span className="text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
            {depth > 0 && (
              <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
                Level {depth}
              </span>
            )}
          </div>
          {comment.is_anonymous && (
            <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">
              Anonymous
            </span>
          )}
        </div>

        <p className="text-gray-700 text-sm mb-2">{comment.content}</p>

        <div className="flex items-center gap-3">
          {canReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-primary-600 hover:underline"
            >
              {showReplyForm ? "Cancel" : "Reply"}
            </button>
          )}
          {comment.replies_count > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-gray-500 hover:underline"
            >
              {showReplies ? "Hide" : "Show"} replies ({comment.replies_count})
            </button>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && canReply && (
        <form onSubmit={handleReplySubmit} className="mb-3 ml-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Reply to ${comment.author_name}...`}
              className="flex-1 input text-sm"
              disabled={replyMutation.isPending}
            />
            <button
              type="submit"
              disabled={replyMutation.isPending || !replyContent.trim()}
              className="btn-primary text-sm px-4"
            >
              {replyMutation.isPending ? "..." : "Reply"}
            </button>
          </div>
        </form>
      )}

      {/* Child Replies - RECURSIVE */}
      {showReplies && hasReplies && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              listingId={listingId}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </div>
      )}

      {/* Load More Replies Button */}
      {comment.replies_count > (comment.replies?.length || 0) && (
        <button
          className="text-xs text-primary-600 hover:underline ml-6 mt-1"
          onClick={() => {
            // Load more replies - we'll implement this next
            toast.info("Load more replies coming soon!");
          }}
        >
          Load more replies (
          {comment.replies_count - (comment.replies?.length || 0)})
        </button>
      )}
    </div>
  );
}
