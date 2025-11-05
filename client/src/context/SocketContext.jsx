import React, { createContext, useContext, useMemo } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  // ✅ Use import.meta.env for Vite environment variables
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // ✅ Initialize socket safely with useMemo
  const socket = useMemo(() => {
    if (BACKEND_URL) {
      console.log("Connecting to:", BACKEND_URL);
      return io(BACKEND_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'], // fallback for reliability
      });
    } 
    console.error("VITE_BACKEND_URL is NOT set! Socket connection aborted.");
    return null;
  }, [BACKEND_URL]);

  // ✅ Optional debug listener
  if (socket) {
    socket.on("connect_error", (err) => {
      console.error(`Socket Connection Error: ${err.message}`);
    });
  }

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
