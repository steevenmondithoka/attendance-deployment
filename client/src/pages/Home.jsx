import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import jwtDecode from 'jwt-decode';

// Shadcn UI Imports
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, Clock, Shield, ArrowRight } from "lucide-react";

// --- Theme Alignment Classes (Using standard Shadcn/Tailwind names) ---
// Using 'background' which is typically white/light gray
const PRIMARY_COLOR_BG = 'bg-background'; 
// Using 'destructive' which is often red in Shadcn templates
const ACCENT_CLASS = 'text-destructive'; 

const Home = () => {
    const { isAuthenticated, token } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated && token) {
            try {
                const decoded = jwtDecode(token);
                let path = '';
                if (decoded.role === 'teacher') {
                    path = '/teacher-dashboard';
                } else if (decoded.role === 'admin') {
                    path = '/admin-dashboard';
                } else {
                    path = '/student-dashboard';
                }
                navigate(path, { replace: true });
            } catch (error) {
                console.error("Invalid token on Home page:", error);
                setIsLoading(false); 
            }
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated, token, navigate]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="mr-2 h-10 w-10 animate-spin text-destructive" />
                <span className="text-xl text-foreground">Loading system integrity check...</span>
            </div>
        );
    }

    // --- Feature Grid Item (REINTRODUCED, but commented out as it's not used in the return block) ---
    /*
    const FeatureGridItem = ({ icon: Icon, title, description }) => (
        <div className="p-6 bg-card border border-border rounded-xl transition-all duration-300 hover:border-destructive hover:shadow-lg">
            <div className="mb-4">
                <Icon className={`w-8 h-8 ${ACCENT_CLASS}`} />
            </div>
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-muted-foreground">{description}</p>
        </div>
    );
    */

    return (
        // Use standard background class
        <div className={`min-h-screen ${PRIMARY_COLOR_BG} font-sans`}>
            
            {/* 1. Navigation Bar (Placeholder, assuming it's above Home in App.jsx) */}
            
            
            {/* 2. Hero Section - Reverting to original layout and using theme classes */}
            <header className="pt-24 pb-20 bg-muted/50"> {/* Subtle contrast with muted/50 */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    
                    {/* Top Tagline */}
                    <p className="text-lg font-semibold text-destructive uppercase tracking-widest mb-4">
                        RGUKT Ongole Presents
                    </p>
                    
                    {/* Headline - WITH INLINE LOGO */}
                    <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-foreground mx-auto max-w-5xl">
                        
                        <div className="flex justify-center items-center">
                            {/* LOGO - Original sizing/positioning restored */}
                            <img 
                                src="https://rgukt.in/assets/media/logos/rgukt.png" 
                                alt="Attendance System Logo"
                                className="h-24 w-auto inline-block align-middle mr-4 ml-8" 
                            />
                            
                            {/* The rest of the title text */}
                            <span className="inline-block text-foreground">
                                Attendance System <span className={ACCENT_CLASS}>for Academic Excellence</span>
                            </span>
                        </div>
                    </h1>
                    
                    {/* Sub-headline */}
                    <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto">
                        Our system provides the tools necessary to maintain the highest standards of academic record-keeping.
                    </p>
                    
                    {/* Call to Action Button - Using Shadcn's primary button style which maps to your theme's accent */}
                    <Button 
                        onClick={() => navigate('/login')}
                        // Applying custom sizing and shadow via Tailwind for the Hero button look
                        className="mt-10 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-lg py-7 px-10 rounded-lg shadow-2xl transition-transform transform hover:scale-[1.03]"
                    >
                        Log In to Your Portal
                        <ArrowRight className="ml-3 h-5 w-5" />
                    </Button>
                    <p className="mt-3 text-sm text-muted-foreground">
                        Access for students, faculty, and administration.
                    </p>
                </div>
            </header>

            {/* 4. Footer - Using theme-compatible classes */}
            <footer className="bg-card py-6 text-center text-muted-foreground text-sm border-t border-border">
                <p>
                    &copy; {new Date().getFullYear()} RGUKT Ongole Attendance Management System. All Rights Reserved.
                </p>
            </footer>
        </div>
    );
};

export default Home;