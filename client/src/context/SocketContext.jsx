import React, { createContext, useContext, useMemo } from 'react'; // ADD useMemo
import { io } from 'socket.io-client';

const SocketContext = createContext(null); // Set default to null

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  // 1. Get the URL from the environment
  const BACKEND_URL = process.env.VITE_BACKEND_URL;
  
  // 2. Safely initialize the socket instance using useMemo
  // This prevents re-creation and ensures it only runs once and safely.
  const socket = useMemo(() => {
    if (BACKEND_URL) {
      console.log("Connecting to:", BACKEND_URL);
      return io(BACKEND_URL);
    } 
    // If the URL is missing, return a dummy object or null, 
    // preventing the app from crashing.
    console.error("REACT_APP_BACKEND_URL is NOT set! Socket connection aborted.");
    return null; 
  }, [BACKEND_URL]); // Dependency array runs this once or when the URL changes (should be once)

  // 3. Optional: Add connection/error handlers here for debugging
  if (socket) {
    socket.on("connect_error", (err) => {
      console.error(`Socket Connection Error: ${err.message}`); 
    });
  }

  // Pass the socket instance down
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};