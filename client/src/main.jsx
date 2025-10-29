import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { ThemeProvider } from './components/ThemeProvider';
import { SocketProvider } from './context/SocketContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <SocketProvider>
     <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App />
      </ThemeProvider>
     </SocketProvider>
    </BrowserRouter>
  </React.StrictMode>
);