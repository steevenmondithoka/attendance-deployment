import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import jwtDecode from 'jwt-decode'; // CORRECTED IMPORT

const ProtectedRoute = ({ children, role }) => {
    const token = localStorage.getItem('token');
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    try {
        const decoded = jwtDecode(token);
        if (role && decoded.role !== role) {
            // Redirect if role does not match
            const redirectPath = decoded.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard';
            return <Navigate to={redirectPath} replace />;
        }
        return children;
    } catch (error) {
        // Handle invalid token
        localStorage.removeItem('token');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
};

export default ProtectedRoute;