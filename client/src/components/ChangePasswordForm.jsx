import React, { useState } from 'react';
import api from '../utils/api';

const ChangePasswordForm = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { currentPassword, newPassword, confirmPassword } = formData;

    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }

        try {
            const res = await api.put('/auth/update-password', { currentPassword, newPassword });
            setMessage(res.data.msg);
            // Clear form on success
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Change Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600">Current Password</label>
                    <input
                        type="password"
                        name="currentPassword"
                        value={currentPassword}
                        onChange={handleChange}
                        required
                        className="mt-1 w-full p-2 border rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600">New Password</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={newPassword}
                        onChange={handleChange}
                        required
                        className="mt-1 w-full p-2 border rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600">Confirm New Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={handleChange}
                        required
                        className="mt-1 w-full p-2 border rounded-md"
                    />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {message && <p className="text-sm text-green-600">{message}</p>}
                <button
                    type="submit"
                    className="w-80 bg-blue-500 text-white font-semibold py-2 rounded-md hover:bg-blue-600"
                >
                    Update Password
                </button>
            </form>
        </div>
    );
};

export default ChangePasswordForm;