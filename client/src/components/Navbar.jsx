import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// --- Component Imports ---
import { UserProfile } from './UserProfile';
import { DarkModeToggle } from './DarkModeToggle';

// --- Shadcn UI & Icon Imports ---
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const dashboardPath = isAuthenticated
        ? (user?.role === 'teacher' ? "/teacher-dashboard" : "/")
        : "/login";

    // Added labels for the navigation links
    const navLinks = [
        { href: dashboardPath, label: "" },
        // Add more links here (e.g., { href: "/courses", label: "Courses" })
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Added justify-between to push left and right sections to the edges */}
            <div className="container flex h-16 items-center justify-between">

                {/* --- PART 1: LEFT - Logo (External Link for all views) --- */}
                <div className="flex items-center">
                    {/* Changed Link to an <a> tag for external navigation to www.rgukt.in */}
                    <a
                        href="https://www.rgukt.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2"
                    >
                        <img src="https://rguktong.ac.in/img/rguktlogo.png" alt="Logo" className="h-8 w-8" />
                        <span className="font-bold">RGUKT ONGOLE</span>
                    </a>
                </div>

                {/* --- PART 2: CENTER - Main Navigation (Desktop only) --- */}
                <nav className="hidden md:flex items-center gap-6 text-sm mx-auto">
                    {isAuthenticated && navLinks.map(link => (
                        <NavLink
                            key={link.href}
                            to={link.href}
                            className={({ isActive }) =>
                                `transition-colors hover:text-foreground/80 ${isActive ? "text-primary font-semibold" : "text-foreground/60"}`
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                {/* --- PART 3: RIGHT - User Actions & Mobile Menu (Hamburger on Right) --- */}
                <div className="flex items-center space-x-2">
                    <DarkModeToggle />

                    {/* --- Desktop UserProfile / Login (Hidden on Mobile) --- */}
                    {isAuthenticated ? (
                        <div className="hidden md:block">
                            <UserProfile user={user} handleLogout={handleLogout} />
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center space-x-2">
                            <Button asChild><Link to="/login">Login</Link></Button>
                        </div>
                    )}

                    {/* --- Mobile Menu (Hamburger) --- */}
                    <Sheet>
                        <SheetTrigger asChild>
                            {/* The trigger button is now on the right */}
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>

                        {/* Content opens from the RIGHT, includes user details */}
                        <SheetContent side="right" className="w-[300px] flex flex-col">
                            
                            {/* --- User Details/Login in Mobile Menu --- */}
                            <div className="mb-6 pb-4 border-b">
                                {isAuthenticated ? (
                                    <>
                                        {/* Simple display of user info */}
                                        <div className='flex items-center space-x-3 mb-4'>
                                            <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold'>
                                                {user?.firstName?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{user?.name || 'User'} {user?.lastName}</p>
                                                <p className="text-sm text-muted-foreground">{user?.email}</p>
                                            </div>
                                        </div>
                                        <SheetClose asChild className='w-full'>
                                            <Button variant="outline" onClick={handleLogout} className='w-full'>
                                                Logout
                                            </Button>
                                        </SheetClose>
                                    </>
                                ) : (
                                    <SheetClose asChild>
                                        <Button asChild className='w-full'>
                                            <Link to="/login">Login</Link>
                                        </Button>
                                    </SheetClose>
                                )}
                            </div>

                            {/* --- Navigation Links for Mobile Menu --- */}
                            <nav className="flex flex-col gap-4">
                                {isAuthenticated && navLinks.map(link => (
                                    <SheetClose asChild key={link.href}>
                                        <NavLink
                                            to={link.href}
                                            className="text-lg font-medium text-muted-foreground hover:text-foreground"
                                        >
                                            {link.label}
                                        </NavLink>
                                    </SheetClose>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
};

export default Navbar;