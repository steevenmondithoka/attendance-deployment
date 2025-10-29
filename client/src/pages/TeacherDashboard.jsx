import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // Import the auth hook to check user role
import api from 'https://attendance-deployment.onrender.com/api';
import CreateClassForm from '../components/CreateClassForm';
import CreateTeacherForm from '../components/CreateTeacherForm'; // The form for admins

// --- Shadcn UI & Icon Imports ---
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AlertCircle, ArrowRight, Trash2, Users } from "lucide-react";
import AdminDashboard from '@/components/AdminDashboard';

const TeacherDashboard = () => {
    // --- State Management ---
    const { user } = useAuth(); // Get the current logged-in user to check their role
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching ---
    const fetchClasses = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/class');
            setClasses(res.data);
        } catch (err) {
            console.error("Failed to fetch classes:", err);
            setError("Could not load your classes. Please try refreshing the page.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    // --- Delete Handler ---
    const handleDeleteClass = async (classId) => {
        try {
            await api.delete(`/class/${classId}`);
            // After successful deletion, refresh the class list to update the UI
            fetchClasses();
        } catch (err) {
            console.error("Failed to delete class:", err);
            setError("Failed to delete the class. Please try again.");
        }
    };

    return (
        <div className="container mx-auto p-4 space-y-8">
            {/* --- Dashboard Header --- */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
                    <p className="text-muted-foreground">Manage your classes and administrative tasks.</p>
                </div>
            </div>

            {/* --- Main Content Grid --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* --- Left Column: Forms --- */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Form for creating a new class (visible to all teachers) */}
                    <CreateClassForm onClassCreated={fetchClasses} />

                    {/* Admin-Only Section: Form for creating a new teacher */}
                    {user?.role === 'admin' && (
                       <AdminDashboard/>
                    )}
                </div>
                
                {/* --- Right Column: List of Classes --- */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Classes</CardTitle>
                            <CardDescription>Select a class to manage its students and attendance.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading && <p className="text-muted-foreground text-center py-8">Loading classes...</p>}
                            
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            
                            {!loading && !error && classes.length === 0 && (
                                <div className="text-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
                                    <h3 className="text-lg font-semibold">No classes found</h3>
                                    <p className="mt-1 text-sm">Get started by creating your first class using the form.</p>
                                </div>
                            )}

                            {!loading && !error && classes.length > 0 && (
                                <div className="space-y-4">
                                    {classes.map((classItem) => (
                                        <div key={classItem._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{classItem.name}</span>
                                                <span className="text-sm text-muted-foreground">{classItem.subject}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 sm:space-x-4">
                                                <div className="hidden sm:flex items-center text-sm text-muted-foreground">
                                                    <Users className="mr-2 h-4 w-4" />
                                                    <span>{classItem.students.length} Student{classItem.students.length !== 1 && 's'}</span>
                                                </div>
                                                <Button asChild variant="outline" size="sm">
                                                    <Link to={`/class/${classItem._id}`}>
                                                        Manage <ArrowRight className="ml-2 h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon" className="h-9 w-9 shrink-0">
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Delete Class</span>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete the <span className="font-semibold">{classItem.name}</span> class and all its attendance records. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteClass(classItem._id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Yes, Delete Class
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;