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
    // Mark messages as read
    setTimeout(() => {
      refetchConversations();
    }, 500);
  };

  const getOtherUser = (listing) => {
    // For simplicity, we show the listing author
    return listing.author?.name || "Unknown";
  };

  if (conversations.length === 0 && !conversationsData?.total) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-500 mb-4">You don't have any messages yet</p>
          <Link to="/" className="btn-primary">
            Browse Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex h-[600px]">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.listing_id}
                onClick={() => selectConversation(conv.listing_id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition ${
                  selectedListingId === conv.listing_id ? "bg-primary-50" : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm">
                      {conv.listing_title}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.last_message?.sender_name}:{" "}
                      {conv.last_message?.content}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(conv.last_message?.created_at).toLocaleString()}
                </p>
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="w-2/3 flex flex-col">
            {selectedListingId ? (
              <>
                {/* Conversation Header */}
                <div className="border-b border-gray-200 px-4 py-3">
                  <h3 className="font-semibold">
                    {conversationData?.listing?.title || "Conversation"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {conversationData?.listing?.author?.name
                      ? `Listing by ${conversationData.listing.author.name}`
                      : ""}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-8">
                      No messages yet. Start the conversation!
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender.id === parseInt(localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).id : "0") ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            msg.sender.id ===
                            parseInt(
                              localStorage.getItem("user")
                                ? JSON.parse(localStorage.getItem("user")).id
                                : "0",
                            )
                              ? "bg-primary-500 text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-gray-200 p-4 flex gap-2"
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
