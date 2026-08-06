// src/hooks/useRealTimeConversation.js
import { useEffect, useState, useCallback } from "react";
import useSocket from "./useSocket";

export const useRealTimeConversation = (conversationId, userId, userName) => {
  const { emit, on, off } = useSocket(userId);
  const [messages, setMessages] = useState([]);
  const [activeParticipants, setActiveParticipants] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = new Map();

  useEffect(() => {
    if (!conversationId || !userId) return;

    // Join conversation room
    emit("join_conversation", {
      conversation_id: conversationId,
      user_id: userId,
    });

    // Listen for new messages
    const handleMessageReceived = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleUserJoined = (data) => {
      setActiveParticipants(data.active_participants || []);
    };

    const handleUserTyping = (data) => {
      if (data.is_typing) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.user_id]: data.sender_name,
        }));

        // Clear existing timeout
        if (typingTimeoutRef.has(data.user_id)) {
          clearTimeout(typingTimeoutRef.get(data.user_id));
        }

        // Set timeout to remove typing indicator
        const timeout = setTimeout(() => {
          setTypingUsers((prev) => {
            const updated = { ...prev };
            delete updated[data.user_id];
            return updated;
          });
          typingTimeoutRef.delete(data.user_id);
        }, 3000);

        typingTimeoutRef.set(data.user_id, timeout);
      } else {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[data.user_id];
          return updated;
        });
        if (typingTimeoutRef.has(data.user_id)) {
          clearTimeout(typingTimeoutRef.get(data.user_id));
          typingTimeoutRef.delete(data.user_id);
        }
      }
    };

    on("message_received", handleMessageReceived);
    on("user_joined_conversation", handleUserJoined);
    on("user_typing", handleUserTyping);

    return () => {
      off("message_received", handleMessageReceived);
      off("user_joined_conversation", handleUserJoined);
      off("user_typing", handleUserTyping);

      // Cleanup typing timeouts
      typingTimeoutRef.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutRef.clear();
    };
  }, [conversationId, userId, emit, on, off]);

  const sendMessage = useCallback(
    (content, messageType = "text") => {
      emit("new_message", {
        conversation_id: conversationId,
        user_id: userId,
        sender_name: userName,
        content,
        message_type: messageType,
        message_id: `msg_${Date.now()}_${Math.random()}`,
      });
    },
    [conversationId, userId, userName, emit],
  );

  const setTyping = useCallback(
    (isTyping = true) => {
      emit("typing", {
        conversation_id: conversationId,
        user_id: userId,
        sender_name: userName,
        is_typing: isTyping,
      });
    },
    [conversationId, userId, userName, emit],
  );

  const leaveConversation = useCallback(() => {
    emit("leave_conversation", {
      conversation_id: conversationId,
      user_id: userId,
    });
  }, [conversationId, userId, emit]);

  return {
    messages,
    activeParticipants,
    typingUsers: Object.values(typingUsers),
    sendMessage,
    setTyping,
    leaveConversation,
  };
};

export default useRealTimeConversation;
