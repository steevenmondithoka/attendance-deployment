import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import  jwtDecode  from 'jwt-decode';

const GuestRoute = () => {
    const token = localStorage.getItem('token');
    let isAuthenticated = false;
    let userRole = null;

    if (token) {
        try {
            const decoded = jwtDecode(token);
            isAuthenticated = true; // Or check for expiry: decoded.exp * 1000 > Date.now();
            userRole = decoded.role;
        } catch (error) {
            isAuthenticated = false;
        }
    }

    if (isAuthenticated) {
        // If the user is authenticated, redirect them away from guest pages
        const redirectPath = userRole === 'teacher' ? '/teacher-dashboard' : '/student-dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    // If not authenticated, render the child route (Login, Register, etc.)
    return <Outlet />;
};

export default GuestRoute;