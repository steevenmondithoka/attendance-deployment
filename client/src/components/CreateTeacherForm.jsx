// src/components/CreateTeacherForm.jsx
import React, { useState } from 'react';
import api from '../utils/api';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const CreateTeacherForm = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
            await api.post('/auth/create-teacher', formData);
            setSuccess(`Teacher account for ${formData.name} created successfully!`);
            setFormData({ name: '', email: '', password: '' }); // Clear the form
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to create teacher account.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Admin: Create Teacher</CardTitle>
                <CardDescription>Create a new teacher account. They will be able to log in with these credentials.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                    {success && <Alert variant="success"><CheckCircle2 className="h-4 w-4" /><AlertTitle>Success</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}

                    <div className="grid gap-2"><Label htmlFor="name">Full Name</Label><Input id="name" name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} /></div>
                    <div className="grid gap-2"><Label htmlFor="email">Email Address</Label><Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required disabled={isLoading} /></div>
                    <div className="grid gap-2"><Label htmlFor="password">Temporary Password</Label><Input id="password" type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" disabled={isLoading} /></div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Teacher Account'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default CreateTeacherForm;