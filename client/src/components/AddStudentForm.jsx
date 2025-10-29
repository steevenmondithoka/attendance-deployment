import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const AddStudentForm = ({ classId, onStudentAdded }) => {
    const [formData, setFormData] = useState({ userId: '', rollNo: '' });
    // This state would ideally be used to populate a dropdown of students not yet in a class.
    // For simplicity, we'll use a text input for the user ID as per the initial design.
    const [availableStudents, setAvailableStudents] = useState([]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.userId || !formData.rollNo) {
            alert('Please fill out all fields.');
            return;
        }
        try {
            await api.post('/student', { ...formData, classId });
            alert('Student added successfully!');
            setFormData({ userId: '', rollNo: '' }); // Reset form
            onStudentAdded(); // Callback to refresh the parent component's data
        } catch (err) {
            console.error(err);
            alert(`Failed to add student: ${err.response?.data?.msg || 'Server error'}`);
        }
    };

    return (
        <div className="bg-white p-6 rounded shadow-md mt-8">
            <h3 className="text-xl font-semibold mb-4">Add New Student</h3>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="userId" className="block text-gray-700">Student User ID</label>
                    <input
                        type="text"
                        name="userId"
                        id="userId"
                        placeholder="Enter the student's User ID"
                        value={formData.userId}
                        onChange={handleChange}
                        className="w-full p-2 mt-1 border rounded"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Note: This is the MongoDB `_id` of a user with the 'student' role. You can get this after a student registers.
                    </p>
                </div>
                <div className="mb-4">
                    <label htmlFor="rollNo" className="block text-gray-700">Roll Number</label>
                    <input
                        type="text"
                        name="rollNo"
                        id="rollNo"
                        placeholder="e.g., CS101-01"
                        value={formData.rollNo}
                        onChange={handleChange}
                        className="w-full p-2 mt-1 border rounded"
                        required
                    />
                </div>
                <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
                    Add Student
                </button>
            </form>
        </div>
    );
};

export default AddStudentForm;