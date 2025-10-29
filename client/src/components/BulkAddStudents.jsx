import React, { useState } from 'react';
import api from 'https://attendance-deployment.onrender.com/api'; // Assuming 'api' is an Axios instance configured with a base URL

const BulkAddStudents = ({ classId, onUploadComplete }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    const handleFileChange = (e) => {
        // Reset previous results when a new file is selected
        setUploadResult(null);
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file first.');
            return;
        }

        setIsUploading(true);
        setUploadResult(null);

        // FormData is used to construct a set of key/value pairs representing form fields and their values,
        // which can then be sent using an HTTP request. It's ideal for sending files.
        const formData = new FormData();
        // The key 'studentsFile' must match what the server-side middleware (e.g., Multer) expects.
        // The backend code uses `req.file`, implying a single file upload middleware is in place.
        formData.append('file', file); // Assuming the backend Multer is configured for the field name 'file'

        try {
            // CORRECTED: The API endpoint is updated from `/student/` (singular) to `/students/` (plural)
            // to match the route definition in the Express controller.
            const res = await api.post(`/students/bulk-register/${classId}`, formData, {
                headers: {
                    // This header is crucial for file uploads with FormData.
                    // Axios typically sets it automatically when you pass a FormData object.
                    'Content-Type': 'multipart/form-data',
                },
            });

            // The backend provides a detailed response object which we store in state.
            setUploadResult(res.data);

            // The parent component can be notified to refresh its data if the upload was successful
            // and no individual rows failed.
            if (res.data.success && res.data.errors.length === 0) {
                if (onUploadComplete) {
                    onUploadComplete();
                }
            }

        } catch (err) {
            // This block handles network errors or HTTP error statuses (like 4xx, 5xx).
            console.error("Upload Error Response:", err.response);

            // The backend controller provides structured error messages for validation failures (e.g., 400, 403, 404).
            // We format a user-friendly message from the server's response, or show a generic one.
            const errorMsg = err.response?.data?.msg || err.response?.data?.error || 'An unexpected error occurred during upload.';
            setUploadResult({
                success: false,
                msg: errorMsg,
                // The backend may also provide a list of specific errors, which we can display.
                errors: err.response?.data?.errors || []
            });
        } finally {
            // Ensure the loading state is turned off regardless of success or failure.
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Bulk Add Students via CSV</h3>

            <p className="text-sm text-gray-600 mb-2">
                Upload a CSV file with columns in this exact order: <strong>name, email, rollNo</strong>
            </p>

            {/* A link to a template CSV ensures users follow the correct format. */}
            <a href="/students_template.csv" download className="text-sm text-blue-600 hover:underline font-medium mb-4 block">
                Download CSV Template
            </a>

            <div className="flex items-center space-x-4">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <button
                    onClick={handleUpload}
                    disabled={isUploading || !file}
                    className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isUploading ? 'Uploading...' : 'Upload'}
                </button>
            </div>

            {/* Display detailed upload results to the user */}
            {uploadResult && (
                <div className="mt-4 p-4 rounded-md bg-gray-50 border border-gray-200">
                    {/* The main summary message from the backend */}
                    <p className={`font-semibold ${uploadResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {uploadResult.msg || uploadResult.summary}
                    </p>

                    {/* If the backend returns a list of row-specific errors, display them clearly */}
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <div className="mt-2">
                            <h4 className="font-bold text-gray-700">Import Errors:</h4>
                            <ul className="list-disc list-inside text-sm text-red-600 mt-1 space-y-1">
                                {uploadResult.errors.map((err, index) => (
                                    <li key={index}>
                                        <span className="font-semibold">{err.email || `Row ${err.row}` || 'Invalid Row'}:</span> {err.reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BulkAddStudents;