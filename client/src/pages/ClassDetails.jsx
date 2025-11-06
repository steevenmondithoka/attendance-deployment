import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { format } from "date-fns";

// --- Component Imports ---
import BulkAddStudents from '../components/BulkAddStudents';
import AddSingleStudent from '../components/AddSingleStudent';

// --- Shadcn UI & Icon Imports ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MoreHorizontal, Check, X, Clock, AlertCircle, CheckCircle2, Calendar as CalendarIcon, UserPlus, Upload, Users, Trash2, ChevronsUpDown, UserX, FileText, Loader2 } from 'lucide-react';

// --- Helper object for consistent status styling ---
const statusConfig = {
    Present: { variant: 'success', icon: <Check className="h-3.5 w-3.5" /> },
    Absent: { variant: 'destructive', icon: <X className="h-3.5 w-3.5" /> },
    Late: { variant: 'secondary', icon: <Clock className="h-3.5 w-3.5" /> },
};

// --- New Loader Component ---
const Spinner = ({ text = "Loading data..." }) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-md">{text}</p>
    </div>
);
// ----------------------------

// --- A New Component for Individual Student Reports ---
const StudentReportDialog = ({ student, classId }) => {
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchReport = async () => {
            if (!student || !classId) return;
            setIsLoading(true);
            try {
                // NOTE: Requires backend endpoint: GET /api/attendance/report/class/:classId/student/:studentId
                const res = await api.get(`/api/attendance/report/class/${classId}/student/${student.studentId}`);
                setReport(res.data);
            } catch (err) { console.error("Failed to fetch student report:", err); setReport(null); } 
            finally { setIsLoading(false); }
        };
        fetchReport();
    }, [student, classId]);
    const isDetained = report && report.percentage < 75;
    return (
        <DialogContent>
            <DialogHeader><DialogTitle>Report for {student.name}</DialogTitle><DialogDescription>Roll No: {student.rollNo}</DialogDescription></DialogHeader>
            {isLoading ? <div className="text-center py-8">Loading report...</div> :
             !report ? <div className="text-center py-8 text-destructive">Could not load report.</div> :
            (
                <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-center bg-muted p-4 rounded-lg"><span className="font-bold text-lg">Overall Percentage</span><span className={`font-bold text-2xl ${isDetained ? 'text-destructive' : 'text-green-600'}`}>{report.percentage}%</span></div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div><p className="font-bold text-lg text-green-600">{report.present}</p><p className="text-sm text-muted-foreground">Present</p></div>
                        <div><p className="font-bold text-lg text-destructive">{report.absent}</p><p className="text-sm text-muted-foreground">Absent</p></div>
                        <div><p className="font-bold text-lg text-amber-600">{report.late}</p><p className="text-sm text-muted-foreground">Late</p></div>
                    </div>
                    <div className="flex justify-center pt-4">{isDetained ? <Badge variant="destructive" className="text-base p-2 px-4">Detained for Exams</Badge> : <Badge variant="success" className="text-base p-2 px-4">Allowed for Exams</Badge>}</div>
                </div>
            )}
        </DialogContent>
    );
};


const ClassDetails = () => {
    const { id: classId } = useParams();
    const [classDetails, setClassDetails] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDetainedOnly, setShowDetainedOnly] = useState(false);
    const [studentReports, setStudentReports] = useState({});
    const [date, setDate] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isResultOpen, setIsResultOpen] = useState(false);
    const [resultContent, setResultContent] = useState({});
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
    const [isRosterOpen, setIsRosterOpen] = useState(false);

    // --- Data Fetching Function ---
    const fetchData = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        setError(null);
        try {
            const dateForApi = format(date, "yyyy-MM-dd");
            
            // 1. Fetch base class details first.
            const classRes = await api.get(`/api/class/${classId}`);
            const fetchedClass = classRes.data;
            setClassDetails(fetchedClass);

            // 2. Once we have the class, fetch attendance for the date and all student reports in parallel.
            if (fetchedClass) {
                const [attendanceRes, reportsRes] = await Promise.all([
                    api.get(`/api/attendance/class/${classId}?date=${dateForApi}`),
                    api.get(`/api/attendance/report/class/${classId}`) // NOTE: Requires backend endpoint
                ]);
                
                // Process attendance
                const attendanceWithAllStudents = fetchedClass.students.map(student => {
                    const record = attendanceRes.data?.records.find(r => r.studentId._id === student._id);
                    return { studentId: student._id, name: student.user.name, rollNo: student.rollNo, status: record ? record.status : 'Absent' };
                });
                setAttendance(attendanceWithAllStudents);
                
                // Process student reports
                const reportsMap = reportsRes.data.reduce((acc, report) => {
                    acc[report.studentId] = report;
                    return acc;
                }, {});
                setStudentReports(reportsMap);
            }
        } catch (err) {
            console.error("Failed to fetch class data:", err);
            setError("Could not load class data. Please try again.");
            setClassDetails(null);
        } finally {
            if (!isRefresh) setLoading(false);
        }
    }, [classId, date]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // All other logic remains the same...
    const filteredAttendance = useMemo(() => {
        return attendance
            .map(att => ({ ...att, percentage: studentReports[att.studentId]?.percentage }))
            .filter(att => {
                const searchMatch = att.name.toLowerCase().includes(searchTerm.toLowerCase()) || att.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
                const detainedMatch = !showDetainedOnly || (att.percentage !== undefined && att.percentage < 75);
                return searchMatch && detainedMatch;
            });
    }, [attendance, searchTerm, showDetainedOnly, studentReports]);

    const dailySummary = useMemo(() => ({
        present: attendance.filter(a => a.status === 'Present').length,
        absent: attendance.filter(a => a.status === 'Absent').length,
        late: attendance.filter(a => a.status === 'Late').length,
    }), [attendance]);

    const handleStatusChange = (studentId, newStatus) => {
        setAttendance(prev => prev.map(att => att.studentId === studentId ? { ...att, status: newStatus } : att));
    };
    
    const markAllPresent = () => {
        setAttendance(prev => prev.map(att => ({ ...att, status: 'Present' })));
    };

    const markAllAbsent = () => {
        setAttendance(prev => prev.map(att => ({ ...att, status: 'Absent' })));
    };


    const submitAttendance = async () => {
        setIsConfirmOpen(false);
        setIsSubmitting(true);
        try {
            const records = attendance.map(({ studentId, status }) => ({ studentId, status }));
            await api.post('/api/attendance/mark', { classId, date: format(date, "yyyy-MM-dd"), records });
            setResultContent({ type: 'success', title: 'Success!', message: 'Attendance has been saved successfully.' });
            fetchData(true); // Re-fetch data after submission without a full loading screen
        } catch (err) {
            console.error(err);
            setResultContent({ type: 'error', title: 'Submission Failed', message: 'Could not save attendance.' });
        } finally {
            setIsSubmitting(false);
            setIsResultOpen(true);
        }
    };

    const handleRemoveStudent = async (studentId) => {
        try {
            await api.delete(`/api/class/${classId}/student/${studentId}`);
            fetchData(true); // Refresh data
        } catch (err) {
            console.error("Failed to remove student:", err);
            alert("Failed to remove student.");
        }
    };

    // --- RENDER LOADER OR ERROR FIRST ---
    if (loading) { return <div className="container mx-auto p-4 md:p-6 lg:p-8"><Spinner text="Loading class details and attendance..." /></div>; }
    if (error) { return ( <div className="container max-w-lg mx-auto mt-10"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div> ); }

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">{classDetails?.name}</h1>
                <p className="text-xl text-muted-foreground">{classDetails?.subject}</p>
            </div>
            
            <Card className="mb-6">
                <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div><CardTitle>Management Panel</CardTitle><CardDescription>Select a date and manage students.</CardDescription></div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Popover><PopoverTrigger asChild><Button variant={"outline"} className="w-full sm:w-[240px] justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(date, "PPP")}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus /></PopoverContent></Popover>
                        <Dialog open={isRosterOpen} onOpenChange={setIsRosterOpen}><DialogTrigger asChild><Button variant="outline"><Users className="mr-2 h-4 w-4" />Roster ({classDetails?.students?.length || 0})</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Enrolled Students</DialogTitle><DialogDescription>A list of all students in this class.</DialogDescription></DialogHeader><div className="max-h-[60vh] overflow-y-auto pr-2">{classDetails?.students?.length > 0 ? <ul className="space-y-2">{classDetails.students.map(student => (<li key={student._id} className="flex justify-between items-center p-2 rounded-md hover:bg-accent"><div><p className="font-medium text-sm">{student.user.name}</p><p className="text-xs text-muted-foreground">{student.rollNo}</p></div><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRemoveStudent(student._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></li>))}</ul> : <p className="text-center text-muted-foreground py-4">No students enrolled.</p>}</div></DialogContent></Dialog>
                        <Dialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen}><DialogTrigger asChild><Button><UserPlus className="mr-2 h-4 w-4" />Add Student</Button></DialogTrigger><DialogContent><AddSingleStudent classId={classId} onStudentAdded={() => { fetchData(true); setIsAddStudentOpen(false); }} /></DialogContent></Dialog>
                        <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}><DialogTrigger asChild><Button variant="secondary"><Upload className="mr-2 h-4 w-4" />Bulk Upload</Button></DialogTrigger><DialogContent><BulkAddStudents classId={classId} onUploadComplete={() => { fetchData(true); setIsBulkUploadOpen(false); }} /></DialogContent></Dialog>
                    </div>
                </CardHeader>
            </Card>

            <Collapsible className="mb-6">
                <CollapsibleTrigger asChild><Button variant="outline" className="w-full justify-between"><span>View Daily Analytics for {format(date, "PPP")}</span><ChevronsUpDown className="h-4 w-4" /></Button></CollapsibleTrigger>
                <CollapsibleContent className="p-4 mt-2 border rounded-lg">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <Card><CardHeader><CardTitle className="text-green-600">{dailySummary.present}</CardTitle><CardDescription>Present</CardDescription></CardHeader></Card>
                        <Card><CardHeader><CardTitle className="text-destructive">{dailySummary.absent}</CardTitle><CardDescription>Absent</CardDescription></CardHeader></Card>
                        <Card><CardHeader><CardTitle className="text-amber-600">{dailySummary.late}</CardTitle><CardDescription>Late</CardDescription></CardHeader></Card>
                    </div>
                </CollapsibleContent>
            </Collapsible>

            <Card>
                <CardHeader>
                    <CardTitle>Mark Attendance</CardTitle>
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <Input placeholder="Search by name or roll no..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full sm:w-64" />
                        <Button variant={showDetainedOnly ? "destructive" : "outline"} onClick={() => setShowDetainedOnly(!showDetainedOnly)}><UserX className="mr-2 h-4 w-4" />{showDetainedOnly ? 'Show All' : 'Filter Below 75%'}</Button>
                        
                        {/* --- Buttons for Marking All --- */}
                        <Button variant="outline" onClick={markAllPresent} disabled={attendance.length === 0}><Check className="mr-2 h-4 w-4" />All Present</Button>
                        <Button variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20" onClick={markAllAbsent} disabled={attendance.length === 0}><X className="mr-2 h-4 w-4" />All Absent</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">S. No.</TableHead> 
                                    <TableHead>Roll No.</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Overall %</TableHead>
                                    <TableHead>Status (Today)</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAttendance.length > 0 ? filteredAttendance.map((att, index) => (
                                    <TableRow key={att.studentId}>
                                        <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                        <TableCell className="font-medium">{att.rollNo}</TableCell>
                                        <TableCell>{att.name}</TableCell>
                                        <TableCell>{att.percentage !== undefined ? <Badge variant={att.percentage < 75 ? 'destructive' : 'outline'}>{att.percentage}%</Badge> : <span className="text-xs text-muted-foreground">...</span>}</TableCell>
                                        <TableCell><Badge variant={statusConfig[att.status]?.variant || 'default'} className="gap-1.5 pl-2">{statusConfig[att.status]?.icon}{att.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Dialog onOpenChange={(open) => !open && setSelectedStudent(null)}><DialogTrigger asChild><Button variant="ghost" size="sm" onClick={() => setSelectedStudent(att)}><FileText className="h-4 w-4" /></Button></DialogTrigger>{selectedStudent?.studentId === att.studentId && <StudentReportDialog student={selectedStudent} classId={classId} />}</Dialog>
                                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuRadioGroup value={att.status} onValueChange={(newStatus) => handleStatusChange(att.studentId, newStatus)}><DropdownMenuRadioItem value="Present">Present</DropdownMenuRadioItem><DropdownMenuRadioItem value="Absent">Absent</DropdownMenuRadioItem><DropdownMenuRadioItem value="Late">Late</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )) : ( 
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">No students match your criteria.</TableCell>
                                    </TableRow> 
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <Button onClick={() => setIsConfirmOpen(true)} className="mt-6 w-full" disabled={attendance.length === 0 || isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Attendance'}</Button>
                </CardContent>
            </Card>
            
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Submission</AlertDialogTitle><AlertDialogDescription>This will save the records for {format(date, "PPP")}.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={submitAttendance}>Confirm & Save</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            <AlertDialog open={isResultOpen} onOpenChange={setIsResultOpen}><AlertDialogContent><AlertDialogHeader><div className="flex items-center gap-4">{resultContent.type === 'success' ? <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100"><CheckCircle2 className="h-6 w-6 text-green-600" /></div> : <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100"><AlertCircle className="h-6 w-6 text-red-600" /></div>}<div className="flex-grow"><AlertDialogTitle>{resultContent.title}</AlertDialogTitle><AlertDialogDescription>{resultContent.message}</AlertDialogDescription></div></div></AlertDialogHeader><AlertDialogFooter><AlertDialogAction onClick={() => setIsResultOpen(false)}>OK</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
        </div>
    );
};

export default ClassDetails;