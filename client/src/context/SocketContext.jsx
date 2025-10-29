import React, { createContext, useContext } from 'react';
import { io } from 'socket.io-client';

// 1. Create the single, persistent socket instance
// Make sure this URL points to your backend server.
// const socket = io('http://localhost:5000');
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'TEMP_BACKEND_URL_PLACEHOLDER'; 
const socket = io(BACKEND_URL);

// 2. Create the React Context
const SocketContext = createContext();

// 3. Create a custom hook for easy access from any component
export const useSocket = () => {
  return useContext(SocketContext);
};

// 4. Create the Provider component that will wrap our app
export const SocketProvider = ({ children }) => {
  // The 'value' prop makes the 'socket' instance available to all
  // descendants of this provider.
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};