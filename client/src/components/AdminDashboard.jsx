import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaUsers, FaChalkboardTeacher, FaUserGraduate, FaSchool } from 'react-icons/fa';
import CreateTeacherForm from './CreateTeacherForm';

// Establish a connection to the Socket.IO server
const socket = io('http://localhost:5000');

// --- Reusable Stat Card Component (No change) ---
const StatCard = ({ Icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`bg-gray-100 p-4 rounded-full`}>
            <Icon className={`h-7 w-7 ${color}`} />
        </div>
    </div>
);

// --- Main Dashboard Component ---
const AdminDashboard = () => {
    // ... (rest of state definitions)
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTeachers: 0,
        totalStudents: 0,
        totalClasses: 0,
    });
    const [activity, setActivity] = useState([]);
    const [isConnected, setIsConnected] = useState(socket.connected);

    useEffect(() => {
        const handleConnect = () => {
            setIsConnected(true);
            console.log('Connected to WebSocket server!');
            
            // *** 1. Request Initial Data Immediately After Connecting ***
            // The server should be set up to respond to this event by sending the full current data.
            socket.emit('fetch_initial_data'); 
        };

        const handleDisconnect = () => {
            setIsConnected(false);
            console.log('Disconnected from WebSocket server.');
        };

        const handleDashboardUpdate = (data) => {
            console.log('Received dashboard_update:', data);
            
            // This event is used for both initial load and subsequent updates
            setStats(data.stats);

            // Add new activity only if it's an update event (i.e., data.latestActivity exists)
            // For initial load, you might get a list of recent activities, adjust logic as needed
            if (data.latestActivity) {
                setActivity(prevActivity => [data.latestActivity, ...prevActivity].slice(0, 5));
            } else if (data.recentActivity) { 
                 // If the server sends an array for initial load
                setActivity(data.recentActivity);
            }
        };

        // --- Socket Connection Events ---
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        
        // --- Listen for our custom event from the server ---
        socket.on('dashboard_update', handleDashboardUpdate);

        // *** 2. Check Connection and Request Initial Data if already connected ***
        if (socket.connected) {
            handleConnect(); 
        }

        // --- Clean up the event listeners on component unmount ---
        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('dashboard_update', handleDashboardUpdate);
        };
    }, []); // Empty dependency array ensures this runs only once on mount

    // ... (rest of the component)
    const chartData = [
        // ... (data remains the same)
        { name: 'Teachers', count: stats.totalTeachers },
        { name: 'Students', count: stats.totalStudents },
        { name: 'Classes', count: stats.totalClasses },
    ];

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* ... (rest of the return content) */}
             <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                
                {/* --- Dashboard Header with Real-time Status Indicator --- */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Management Dashboard</h1>
                        <p className="text-gray-600 mt-1">Live overview of system activity.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium text-gray-600">{isConnected ? 'Real-time Connection Active' : 'Disconnected'}</span>
                    </div>
                </div>

                {/* --- Stats Cards --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard Icon={FaUsers} title="Total Users" value={stats.totalUsers} color="text-blue-500" />
                    <StatCard Icon={FaChalkboardTeacher} title="Total Teachers" value={stats.totalTeachers} color="text-green-500" />
                    <StatCard Icon={FaUserGraduate} title="Total Students" value={stats.totalStudents} color="text-indigo-500" />
                    <StatCard Icon={FaSchool} title="Active Classes" value={stats.totalClasses} color="text-purple-500" />
                </div>

                {/* --- Main Content Grid --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* --- Center Column: Chart --- */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">User Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* --- Right Column: Real-time Activity Feed --- */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md border border-gray-100">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Live Activity</h3>
                        <ul className="space-y-4">
                            {activity.length > 0 ? activity.map((act, index) => (
                                <li key={index} className="flex items-center space-x-3 animate-fade-in-down">
                                    <div className="flex-shrink-0 h-3 w-3 bg-blue-500 rounded-full"></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{act.action}</p>
                                        <p className="text-xs text-gray-500">{act.user} at {act.time}</p>
                                    </div>
                                </li>
                            )) : (
                                <p className="text-sm text-gray-500">Waiting for system events...</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
            <div className='w-full'>
                <CreateTeacherForm/>
            </div>
        </div>
    );
};

export default AdminDashboard;