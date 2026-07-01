// src/components/CommentItem.jsx
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import API from "../services/api";

const postReply = async ({
  listingId,
  parentId,
  content,
  isAnonymous,
  guestName,
  guestPhone,
}) => {
  const { data } = await API.post(`/comments/listings/${listingId}/comments`, {
    content,
    parent_id: parentId,
    is_anonymous: isAnonymous,
    guest_name: isAnonymous ? guestName : undefined,
    guest_phone: isAnonymous ? guestPhone : undefined,
  });
  return data;
};

const fetchMoreReplies = async (commentId, page) => {
  const { data } = await API.get(
    `/comments/${commentId}/replies?page=${page}&per_page=10`,
  );
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
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [repliesPage, setRepliesPage] = useState(1);
  const [allReplies, setAllReplies] = useState(comment.replies || []);
  const queryClient = useQueryClient();

  // Query for fetching more replies
  const { data: moreRepliesData, refetch: refetchMoreReplies } = useQuery({
    queryKey: ["replies", comment.id, repliesPage],
    queryFn: () => fetchMoreReplies(comment.id, repliesPage),
    enabled: false, // Don't fetch automatically
  });

  const replyMutation = useMutation({
    mutationFn: postReply,
    onSuccess: () => {
      toast.success("Reply posted!");
      setReplyContent("");
      setGuestName("");
      setGuestPhone("");
      setShowReplyForm(false);
      // Invalidate both comments and replies queries
      queryClient.invalidateQueries(["comments", listingId]);
      queryClient.invalidateQueries(["replies", comment.id]);
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
      isAnonymous,
      guestName: isAnonymous ? guestName : undefined,
      guestPhone: isAnonymous ? guestPhone : undefined,
    });
  };

  const handleLoadMoreReplies = async () => {
    try {
      const nextPage = repliesPage + 1;
      const result = await fetchMoreReplies(comment.id, nextPage);

      if (result.replies && result.replies.length > 0) {
        setAllReplies([...allReplies, ...result.replies]);
        setRepliesPage(nextPage);
        toast.success(`Loaded ${result.replies.length} more replies`);
      } else {
        toast.info("No more replies to load");
      }
    } catch (error) {
      toast.error("Failed to load more replies");
    }
  };

  const canReply = depth < 10;
  const hasReplies = allReplies.length > 0;
  const remainingReplies = comment.replies_count - allReplies.length;

  return (
    <div className={`${depth > 0 ? "ml-6 border-l border-white/10 pl-4" : ""}`}>
      {/* Comment content */}
      <div className="bg-[#0a0a0a] rounded-xl border border-white/10 p-4 mb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-white">
              {comment.author_name}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
            {depth > 0 && (
              <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                Level {depth}
              </span>
            )}
          </div>
          {comment.is_anonymous && (
            <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              Anonymous
            </span>
          )}
        </div>

        <p className="text-gray-300 text-sm mb-2">{comment.content}</p>

        <div className="flex items-center gap-3">
          {canReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-blue-400 hover:text-blue-300 transition"
            >
              {showReplyForm ? "Cancel" : "Reply"}
            </button>
          )}
          {comment.replies_count > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-gray-400 hover:text-gray-300 transition"
            >
              {showReplies ? "Hide" : "Show"} replies ({comment.replies_count})
            </button>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && canReply && (
        <form onSubmit={handleReplySubmit} className="mb-3 ml-4 space-y-2">
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

          {/* Anonymous options */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-white/20 bg-black text-blue-500 focus:ring-blue-500"
              />
              Comment as Guest
            </label>
            {isAnonymous && (
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="input text-sm py-1 w-32"
                />
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="input text-sm py-1 w-32"
                />
              </div>
            )}
          </div>
        </form>
      )}

      {/* Child Replies - RECURSIVE */}
      {showReplies && hasReplies && (
        <div className="space-y-2">
          {allReplies.map((reply) => (
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
      {showReplies && remainingReplies > 0 && (
        <button
          onClick={handleLoadMoreReplies}
          className="text-xs text-blue-400 hover:text-blue-300 transition ml-6 mt-1"
          disabled={repliesPage >= Math.ceil(comment.replies_count / 10)}
        >
          Load more replies ({remainingReplies} remaining)
        </button>
      )}
    </div>
  );
}
