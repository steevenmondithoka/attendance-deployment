import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import jwtDecode from 'jwt-decode';
import { useAuth } from '../hooks/useAuth';

// Shadcn UI Imports
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox"; // Optional: If you want "Remember Me"

// Icons
import { AlertCircle, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

const Login = () => {
    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // 1. Check for existing token on load
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            validateAndRedirect(token);
        }
    }, [navigate]);

    // 2. Check for success messages passed via React Router (e.g., from ResetPassword page)
    useEffect(() => {
        if (location.state?.successMessage) {
            setSuccess(location.state.successMessage);
            // Clear state so message doesn't persist on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // Helper to handle redirection based on role
    const validateAndRedirect = (token) => {
        try {
            const decoded = jwtDecode(token);
            // Optional: Check if token is expired here before redirecting
            if (decoded.exp * 1000 < Date.now()) {
                throw new Error("Token expired");
            }

            if (decoded.role === 'teacher') {
                navigate('/teacher-dashboard', { replace: true });
            } else if (decoded.role === 'admin') {
                navigate('/admin-dashboard', { replace: true });
            } else if (decoded.role === 'student'){
                navigate('/student-dashboard', { replace: true });
            }else{
                navigate('/home',{replace:true});
                }
        } catch (error) {
            console.error("Invalid or expired token:", error);
            localStorage.removeItem('token');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear errors when user starts typing again
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await api.post('/auth/login', formData);
            
            if (res.data?.token) {
                auth.login(res.data.token);
                validateAndRedirect(res.data.token);
            } else {
                throw new Error("No token received");
            }
        } catch (err) {
            console.error(err);
            // More specific error handling if your API provides it
            const errorMessage = err.response?.data?.message || 'Login failed. Please check your email and password.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative w-full min-h-screen flex items-center justify-center p-4 overflow-hidden">
            {/* Background with Overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center scale-105"
                style={{ 
                    backgroundImage: "url('https://rguktong.ac.in/svgs/carosel/ssn.png')",
                    filter: 'blur(0.5px)' // Optional: slight blur to focus on the form
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/50" />

            <Card className="relative z-10 w-full max-w-md shadow-2xl border-muted/20">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Welcome back
                    </CardTitle>
                    <CardDescription>
                        Sign in to access your dashboard
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Error Alert */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Success Alert (e.g. after password reset) */}
                        {success && (
                            <Alert className="border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/10">
                                <CheckCircle className="h-4 w-4" />
                                <AlertTitle>Success</AlertTitle>
                                <AlertDescription>{success}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
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
                                className="bg-background/50"
                                autoComplete="email"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                                    tabIndex={isLoading ? -1 : 0}
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            
                            {/* Password Input with Visibility Toggle */}
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={isLoading}
                                    className="bg-background/50 pr-10" // Add padding-right so text doesn't hit the icon
                                    autoComplete="current-password"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    disabled={isLoading}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Optional: Remember Me Checkbox */}
                        {/* 
                        <div className="flex items-center space-x-2">
                             <Checkbox id="remember" />
                             <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Remember me for 30 days</Label>
                        </div> 
                        */}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</>
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4 text-center text-sm text-muted-foreground">
                    <p>
                        Don't have an account?{' '}
                        <span className="text-foreground font-medium">
                            Please contact your administrator.
                        </span>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;