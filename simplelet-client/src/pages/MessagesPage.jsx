// src/pages/MessagesPage.jsx
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../services/api";

const fetchConversations = async () => {
  const { data } = await API.get("/messages/conversations");
  return data;
};

const fetchConversation = async (listingId) => {
  const { data } = await API.get(`/messages/listing/${listingId}`);
  return data;
};

const sendMessage = async ({ listingId, content }) => {
  const { data } = await API.post(`/messages/listing/${listingId}`, {
    content,
  });
  return data;
};

export default function MessagesPage() {
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [messageContent, setMessageContent] = useState("");
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  // Fetch conversations
  const { data: conversationsData, refetch: refetchConversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  });

  // Fetch selected conversation
  const { data: conversationData, refetch: refetchConversation } = useQuery({
    queryKey: ["conversation", selectedListingId],
    queryFn: () => fetchConversation(selectedListingId),
    enabled: !!selectedListingId,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      setMessageContent("");
      refetchConversation();
      refetchConversations();
      queryClient.invalidateQueries(["unreadCount"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to send message");
    },
  });

  // Update conversations when data loads
  useEffect(() => {
    if (conversationsData) {
      setConversations(conversationsData.conversations || []);
    }
  }, [conversationsData]);

  // Update messages when data loads
  useEffect(() => {
    if (conversationData) {
      setMessages(conversationData.messages || []);
    }
  }, [conversationData]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageContent.trim()) {
      toast.error("Please enter a message");
      return;
    }
    if (!selectedListingId) {
      toast.error("No conversation selected");
      return;
    }
    sendMutation.mutate({
      listingId: selectedListingId,
      content: messageContent,
    });
  };

  const selectConversation = (listingId) => {
    setSelectedListingId(listingId);
    setTimeout(() => {
      refetchConversations();
    }, 500);
  };

  if (conversations.length === 0 && !conversationsData?.total) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 heading-gradient">
          Messages
        </h1>
        <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-8 text-center shadow-xl">
          <svg
            className="w-16 h-16 text-gray-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-gray-400 mb-4">You don't have any messages yet</p>
          <Link to="/" className="btn-primary">
            Browse Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6 heading-gradient">
        Messages
      </h1>

      <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row h-[600px]">
          {/* Conversations List */}
          <div className="w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-white/10 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.listing_id}
                onClick={() => selectConversation(conv.listing_id)}
                className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition ${
                  selectedListingId === conv.listing_id
                    ? "bg-blue-500/10 border-blue-500/30"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-white truncate">
                      {conv.listing_title}
                    </h4>
                    <p className="text-xs text-gray-400 truncate">
                      {conv.last_message?.sender_name}:{" "}
                      {conv.last_message?.content}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="ml-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-2 py-1 rounded-full flex-shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(conv.last_message?.created_at).toLocaleString()}
                </p>
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="w-full sm:w-2/3 flex flex-col">
            {selectedListingId ? (
              <>
                {/* Conversation Header */}
                <div className="border-b border-white/10 px-4 py-3 flex-shrink-0">
                  <h3 className="font-semibold text-white truncate">
                    {conversationData?.listing?.title || "Conversation"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {conversationData?.listing?.author?.name
                      ? `Listing by ${conversationData.listing.author.name}`
                      : ""}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">
                      No messages yet. Start the conversation!
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isOwnMessage = msg.sender.id === currentUser?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-4 py-2 ${
                              isOwnMessage
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                : "bg-white/10 text-gray-200 border border-white/5"
                            }`}
                          >
                            <p className="text-sm break-words">{msg.content}</p>
                            <p
                              className={`text-[10px] mt-1 ${
                                isOwnMessage ? "text-blue-200" : "text-gray-400"
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-white/10 p-4 flex gap-2 flex-shrink-0"
                >
                  <input
                    type="text"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 input"
                    disabled={sendMutation.isPending}
                  />
                  <button
                    type="submit"
                    disabled={sendMutation.isPending || !messageContent.trim()}
                    className="btn-primary"
                  >
                    {sendMutation.isPending ? "..." : "Send"}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
