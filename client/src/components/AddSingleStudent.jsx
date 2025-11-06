// src/components/AddSingleStudent.js

import React, { useState } from 'react';
import api from '../utils/api'; // Make sure you have the configured Axios instance

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://attendance-deployment.onrender.com';

const AddSingleStudent = ({ classId, onStudentAdded }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        rollNo: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { name, email, rollNo } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

 // In src/components/AddSingleStudent.js

const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!name || !email || !rollNo) {
        setError('All fields are required.');
        setIsLoading(false);
        return;
    }

    try {
        // --- THE FINAL FIX ---
        // This URL now perfectly matches the new backend route structure
        const response = await api.post(`/api/students/add/${classId}`, { name, email, rollNo });

        setSuccess(`Student "${response.data.student.name}" was added successfully!`);
        setFormData({ name: '', email: '', rollNo: '' });

        if (onStudentAdded) {
            onStudentAdded();
        }

    } catch (err) {
        let errorMessage = 'An unexpected error occurred. Please try again.';
        if (err.response) {
            errorMessage = err.response.data.msg || `Server error: ${err.response.status}.`;
        } else if (err.request) {
            errorMessage = 'Cannot connect to the server. Please check your network.';
        }
        setError(errorMessage);
    } finally {
        setIsLoading(false);
        setTimeout(() => setSuccess(''), 5000);
    }
};

    return (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Add a Single Student</h3>
            <form onSubmit={handleSubmit}>
                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
                {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{success}</div>}

                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={name}
                        onChange={onChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Jane Doe"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={onChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., jane.doe@example.com"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="rollNo" className="block text-sm font-medium text-gray-700">Roll Number</label>
                    <input
                        type="text"
                        id="rollNo"
                        name="rollNo"
                        value={rollNo}
                        onChange={onChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., S101"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                >
                    {isLoading ? 'Adding...' : 'Add Student'}
                </button>
            </form>
        </div>
    );
};

export default AddSingleStudent;