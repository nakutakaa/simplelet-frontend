// src/hooks/useSocket.js
import { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_SERVER_URL = API_URL ? API_URL.replace(/\/api\/?$/, "") : undefined;

export const useSocket = (userId) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    socketRef.current = io(SOCKET_SERVER_URL, {
      path: "/socket.io",
      query: { userId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      setIsConnected(true);
      console.log("✅ Connected to WebSocket server");
    });

    socketRef.current.on("connect_error", (error) => {
      setIsConnected(false);
      console.error("❌ WebSocket connection error:", error);
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
      console.log("❌ Disconnected from WebSocket server");
    });

    socketRef.current.on("reconnect", () => {
      setIsConnected(true);
      console.log("🔄 WebSocket reconnected");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        setIsConnected(false);
      }
    };
  }, [userId]);

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);
    }
  }, []);

  const off = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.off(event, handler);
    }
  }, []);

  return {
    socket: socketRef.current,
    emit,
    on,
    off,
    isConnected,
  };
};

export default useSocket;
