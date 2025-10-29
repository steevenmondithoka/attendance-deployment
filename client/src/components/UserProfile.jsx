// src/components/UserProfile.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LayoutGrid, LogOut } from "lucide-react";

export const UserProfile = ({ user, handleLogout }) => {
    const navigate = useNavigate();

    const getInitials = (name = '') => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {/* This is the visible part on the navbar */}
                <Button variant="ghost" className="relative h-10 px-2 space-x-2">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                    </Avatar>
                    {/* --- THIS IS THE KEY CHANGE --- */}
                    {/* Display name and email, hidden on small screens */}
                    <div className="hidden sm:flex sm:flex-col sm:items-start">
                        <span className="text-sm font-medium leading-none">{user?.name}</span>
                        <span className="text-xs leading-none text-muted-foreground">{user?.email}</span>
                    </div>
                </Button>
            </DropdownMenuTrigger>
            {/* This is the content that appears when you click */}
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};