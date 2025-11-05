import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import  jwtDecode  from 'jwt-decode';
import { useAuth } from '../hooks/useAuth'; // 1. Import the hook

// ... other imports for Shadcn UI ...
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

const Login = () => {
    const auth = useAuth(); // Get the auth context
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // On component load, check if the user is already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.role === 'teacher' || decoded.role === 'admin') {
                    navigate('/teacher-dashboard', { replace: true });
                } else {
                    navigate('/student-dashboard', { replace: true });
                }
            } catch (error) {
                console.error("Invalid token found in storage:", error);
                localStorage.removeItem('token');
            }
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await api.post('api/auth/login', formData);
            
            // Call the login function from your auth context to update the global state
            auth.login(res.data.token);

            // Decode the new token to decide where to navigate
            const decoded = jwtDecode(res.data.token);
            
            // --- THIS IS THE FIX ---
            // Check if the role is EITHER 'teacher' OR 'admin'.
            if (decoded.role === 'teacher') {
                navigate('/teacher-dashboard', { replace: true });
            } 
            if (decoded.role === 'admin') {
                navigate('/admin-dashboard', { replace: true });
            }
            else {
                // Only 'student' will fall into this block now.
                navigate('/student-dashboard', { replace: true });
            }
        } catch (err) {
            console.error(err);
            setError('Login failed. Please check your email and password.');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <div className="relative w-full min-h-screen flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/college-bg.jpg')" }}
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <Card className="relative z-10 w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome Back</CardTitle>
                    <CardDescription>
                        Sign in to continue to your dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Login Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </div>
                    </form>
                    
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <p>Please contact your Admin</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;