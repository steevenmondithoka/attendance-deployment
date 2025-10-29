import React, { useState } from 'react';
import api from '../utils/api';

// --- Shadcn UI & Icon Imports ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const CreateClassForm = ({ onClassCreated }) => {
    // --- State Management (with added loading and feedback states) ---
    const [formData, setFormData] = useState({ name: '', subject: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/class', formData);
            
            // --- Set success message and reset the form ---
            setSuccess('Class created successfully!');
            setFormData({ name: '', subject: '' });
            
            // Call the parent component's callback to refresh the class list
            if (onClassCreated) {
                onClassCreated();
            }

            // Hide the success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);

        } catch (err) {
            const errorMessage = err.response?.data?.msg || 'Failed to create class due to a server error.';
            console.error(err.response);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create a New Class</CardTitle>
                <CardDescription>
                    Fill in the details below to set up a new class for attendance tracking.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6">
                        {/* --- Success & Error Alerts --- */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {success && (
                            <Alert variant="success">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertTitle>Success</AlertTitle>
                                <AlertDescription>{success}</AlertDescription>
                            </Alert>
                        )}

                        {/* --- Form Fields --- */}
                        <div className="grid gap-2">
                            <Label htmlFor="name">Class Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g., Computer Science - Section A"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                name="subject"
                                placeholder="e.g., Advanced Web Development"
                                value={formData.subject}
                                onChange={handleChange}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        {/* --- Submit Button with Loading State --- */}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Class'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default CreateClassForm;