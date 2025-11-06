import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import jwtDecode from 'jwt-decode';
import _ from 'lodash';
import ChangePasswordForm from '../components/ChangePasswordForm';

// --- Charting & Shadcn Imports ---
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Clock, Percent, User, XCircle } from 'lucide-react';

const StudentDashboard = () => {
    // --- State Management ---
    const [allAttendance, setAllAttendance] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [userDetails, setUserDetails] = useState({ name: '', email: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    // --- Data Fetching ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { throw new Error("Authentication token not found."); }
                const decoded = jwtDecode(token);
                setUserDetails({ name: decoded.name, email: decoded.email });
                const res = await api.get(`/api/attendance/student/${decoded.id}`);
                setAllAttendance(res.data);
                const uniqueSubjects = [...new Set(res.data.map(item => item.classId?.subject).filter(Boolean))];
                setSubjects(uniqueSubjects);
            } catch (err) {
                console.error("Error fetching student data:", err);
                setError("Failed to load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- Overall Summary for Top Cards ---
    const overallSummary = useMemo(() => {
        let present = 0, absent = 0, late = 0;
        allAttendance.forEach(record => {
            const status = record.records[0]?.status;
            if (status === 'Present') present++;
            else if (status === 'Absent') absent++;
            else if (status === 'Late') late++;
        });
        const total = allAttendance.length;
        const percentage = total > 0 ? (((present + late) / total) * 100).toFixed(1) : 0;
        return { present, absent, late, percentage };
    }, [allAttendance]);

    // --- Dynamic Data Processing for Charts ---
    const processedData = useMemo(() => {
        const processSubjectData = (attendanceRecords) => {
            let present = 0, absent = 0, late = 0;
            attendanceRecords.forEach(record => {
                const status = record.records[0]?.status;
                if (status === 'Present') present++; else if (status === 'Absent') absent++; else if (status === 'Late') late++;
            });
            const pieData = [
                { name: 'Present', value: present, fill: '#22c55e' },
                { name: 'Absent', value: absent, fill: '#ef4444' },
                { name: 'Late', value: late, fill: '#f59e0b' },
            ].filter(item => item.value > 0);
            const monthlyData = {};
            attendanceRecords.forEach(record => {
                const month = new Date(record.date).toLocaleString('default', { month: 'short' });
                if (!monthlyData[month]) { monthlyData[month] = { month, Present: 0, Absent: 0, Late: 0 }; }
                const status = record.records[0]?.status;
                if (monthlyData[month][status] !== undefined) { monthlyData[month][status]++; }
            });
            return { pieData, barData: Object.values(monthlyData) };
        };

        if (selectedSubject === 'all') {
            const validRecords = allAttendance.filter(record => record.classId && record.classId.subject);
            const groupedBySubject = _.groupBy(validRecords, record => record.classId.subject);
            return Object.keys(groupedBySubject).map(subject => ({
                subjectName: subject,
                ...processSubjectData(groupedBySubject[subject])
            }));
        } else {
            const filteredAttendance = allAttendance.filter(record => record.classId?.subject === selectedSubject);
            return [{
                subjectName: selectedSubject,
                ...processSubjectData(filteredAttendance)
            }];
        }
    }, [allAttendance, selectedSubject]);

    if (loading) { return <div className="text-center mt-20">Loading Dashboard...</div>; }
    if (error) { return (<div className="container max-w-lg mx-auto mt-10"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div>); }

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
                    <p className="text-muted-foreground">An overview of your attendance records.</p>
                </div>
                <Card className="p-3 w-full sm:w-auto shrink-0"><div className="flex items-center space-x-3"><User className="h-5 w-5 text-muted-foreground" /><div><p className="font-semibold text-sm">{userDetails.name}</p><p className="text-xs text-muted-foreground">{userDetails.email}</p></div></div></Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Present</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{overallSummary.present}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Absent</CardTitle><XCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{overallSummary.absent}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Late</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{overallSummary.late}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Overall %</CardTitle><Percent className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{overallSummary.percentage}%</div></CardContent></Card>
            </div>

            <Card>
                <CardHeader><CardTitle className="text-lg">Filter by Subject</CardTitle><CardDescription>Select a subject to view its specific charts and history.</CardDescription></CardHeader>
                <CardContent>
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger className="w-full md:w-[280px]"><SelectValue placeholder="Select a subject" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Subjects</SelectItem>
                            {subjects.map(subject => (<SelectItem key={subject} value={subject}>{subject}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <div className="space-y-8">
                {processedData.map((data) => (
                    <div key={data.subjectName} className="space-y-6 border-t pt-8">
                        <h2 className="text-2xl font-bold tracking-tight text-center md:text-left">{data.subjectName}</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                            <Card className="lg:col-span-2"><CardHeader><CardTitle>Attendance Breakdown</CardTitle></CardHeader><CardContent className="pl-2"><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={data.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{data.pieData.map((entry, idx) => (<Cell key={`cell-${idx}`} fill={entry.fill} />))}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></CardContent></Card>
                            <Card className="lg:col-span-3"><CardHeader><CardTitle>Monthly Summary</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={data.barData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Present" stackId="a" fill="#22c55e" /><Bar dataKey="Absent" stackId="a" fill="#ef4444" /><Bar dataKey="Late" stackId="a" fill="#f59e0b" /></BarChart></ResponsiveContainer></CardContent></Card>
                        </div>
                    </div>
                ))}
            </div>

            <Card>
                <CardHeader><CardTitle>Attendance History</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Class Name</TableHead><TableHead>Subject</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {allAttendance.length > 0 ? allAttendance.map(record => (
                                <TableRow key={record._id}>
                                    <TableCell className="font-medium">{new Date(record.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{record.classId?.name || 'N/A'}</TableCell>
                                    <TableCell>{record.classId?.subject || 'N/A'}</TableCell>
                                    <TableCell className="text-right"><Badge variant={record.records[0]?.status === 'Present' ? 'success' : record.records[0]?.status === 'Absent' ? 'destructive' : 'secondary'}>{record.records[0]?.status || 'N/A'}</Badge></TableCell>
                                </TableRow>
                            )) : (<TableRow><TableCell colSpan={4} className="h-24 text-center">No attendance records found.</TableCell></TableRow>)}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>{showPasswordForm ? (<ChangePasswordForm onCancel={() => setShowPasswordForm(false)} />) : (<><CardHeader><CardTitle>Account Settings</CardTitle></CardHeader><CardContent><Button onClick={() => setShowPasswordForm(true)} className="w-50">Change My Password</Button></CardContent></>)}</Card>
        </div>
    );
};

export default StudentDashboard;