import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ClassDetails from './pages/ClassDetails';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css'
import { AuthProvider } from './hooks/useAuth'; // The import path should have no extension
import AdminDashboard from './components/AdminDashboard';
import Home from './pages/Home';

function App() {
    return (
        // --- FIX: Wrap your entire application with AuthProvider ---
        <AuthProvider>
            <div className="bg-background min-h-screen">
                <Navbar />
                <main className="container mx-auto p-4">

                    
                    <Routes>
                     <Route path="/" element={<Home />} /> 
                        <Route path="/login" element={<Login />} />
                       

                        <Route
                            path="/teacher-dashboard"
                            element={
                                <ProtectedRoute role="teacher">
                                    <TeacherDashboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/admin-dashboard"
                            element={
                                <ProtectedRoute role="admin">
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/class/:id"
                            element={
                                <ProtectedRoute role="teacher">
                                    <ClassDetails />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/student-dashboard"
                            element={
                                <ProtectedRoute role="student">
                                    <StudentDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/" element={<Navigate to="/login" />} />
                    </Routes>
                </main>
            </div>
        </AuthProvider>
    );
}

export default App;