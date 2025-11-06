import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import BulkAddStudents from '../components/BulkAddStudents';
import AddSingleStudent from '../components/AddSingleStudent';

// --- Shadcn UI & Icon Imports (Added AlertDialogCancel) ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MoreHorizontal, Check, X, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';


// --- Helper object for consistent status styling ---
const statusConfig = {
    Present: { variant: 'success', icon: <Check className="h-3.5 w-3.5" /> },
    Absent: { variant: 'destructive', icon: <X className="h-3.5 w-3.5" /> },
    Late: { variant: 'secondary', icon: <Clock className="h-3.5 w-3.5" /> },
};


const ClassDetails = () => {
    const { id } = useParams();
    const [classDetails, setClassDetails] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- State for the entire submission flow ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false); // For the confirmation dialog
    const [isResultOpen, setIsResultOpen] = useState(false);    // For the success/error result dialog
    const [resultContent, setResultContent] = useState({ type: 'success', title: '', message: '' });

    const todayForApi = new Date().toISOString().split('T')[0];
    const todayForDisplay = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const [date] = useState(todayForApi);

    // ... All fetch logic remains the same ...
    const fetchClassDetails = useCallback(async () => { /* ... no changes ... */ setLoading(true); try { const res = await api.get(`/api/class/${id}`); setClassDetails(res.data); } catch (err) { console.error("Failed to fetch class details:", err); setClassDetails(null); } finally { setLoading(false); } }, [id]);
    useEffect(() => { fetchClassDetails(); }, [id]);
    const fetchAttendance = useCallback(async () => { if (!classDetails) return; try { const res = await api.get(`/api/attendance/class/${id}?date=${date}`); const attendanceWithAllStudents = classDetails.students.map(student => { const record = res.data?.records.find(r => r.studentId._id === student._id); return { studentId: student._id, name: student.user.name, rollNo: student.rollNo, status: record ? record.status : 'Absent', }; }); setAttendance(attendanceWithAllStudents); } catch (err) { setAttendance(classDetails.students.map(student => ({ studentId: student._id, name: student.user.name, rollNo: student.rollNo, status: 'Absent', }))); } }, [id, classDetails, date]);
    useEffect(() => { if (classDetails) { fetchAttendance(); } }, [classDetails, fetchAttendance]);
    const handleStatusChange = (studentIdToUpdate, newStatus) => { const updatedAttendance = attendance.map(studentAttendance => { if (studentAttendance.studentId === studentIdToUpdate) { return { ...studentAttendance, status: newStatus }; } return studentAttendance; }); setAttendance(updatedAttendance); };

    // --- NEW: This function now contains the API call logic ---
    const submitAttendance = async () => {
        setIsConfirmOpen(false); // Close the confirmation dialog
        setIsSubmitting(true);   // Set loading state
        
        try {
            const records = attendance.map(({ studentId, status }) => ({ studentId, status }));
            await api.post('/api/attendance/mark', { classId: id, date, records });
            
            setResultContent({ type: 'success', title: 'Success!', message: 'Attendance has been saved successfully.' });
            fetchAttendance();

        } catch (err) {
            console.error(err);
            setResultContent({ type: 'error', title: 'Submission Failed', message: 'Could not save attendance. Please try again.' });
            
        } finally {
            setIsSubmitting(false); // Reset loading state
            setIsResultOpen(true);    // Show the success/error result dialog
        }
    };

    if (loading) { return <div className="flex justify-center items-center h-64">Loading class details...</div>; }
    if (!classDetails) { return ( <div className="container max-w-lg mx-auto mt-10"> <Alert variant="destructive"> <AlertCircle className="h-4 w-4" /> <AlertTitle>Could Not Load Class Details</AlertTitle> <AlertDescription> There was an error fetching the data, or the class does not exist. </AlertDescription> <Button asChild variant="link" className="mt-4 p-0 h-auto"> <Link to="/teacher-dashboard">Back to Dashboard</Link> </Button> </Alert> </div> ); }

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">{classDetails.name}</h1>
                <p className="text-xl text-muted-foreground">{classDetails.subject}</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mark Attendance</CardTitle>
                            <CardDescription>
                                Marking attendance for: <span className="font-semibold text-primary">{todayForDisplay}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {attendance.length > 0 ? (
                                <div className="border rounded-md">
                                    <Table>
                                        <TableHeader><TableRow><TableHead>Roll No.</TableHead><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                        <TableBody>
                                            {attendance.map(att => (
                                                <TableRow key={att.studentId}>
                                                    <TableCell className="font-medium">{att.rollNo}</TableCell>
                                                    <TableCell>{att.name}</TableCell>
                                                    <TableCell><Badge variant={statusConfig[att.status]?.variant || 'default'} className="gap-1.5 pl-2">{statusConfig[att.status]?.icon}{att.status}</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuRadioGroup value={att.status} onValueChange={(newStatus) => handleStatusChange(att.studentId, newStatus)}><DropdownMenuRadioItem value="Present">Present</DropdownMenuRadioItem><DropdownMenuRadioItem value="Absent">Absent</DropdownMenuRadioItem><DropdownMenuRadioItem value="Late">Late</DropdownMenuRadioItem></DropdownMenuRadioGroup></DropdownMenuContent></DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-4">No students in this class.</p>
                            )}
                            {/* --- UPDATED: This button now opens the confirmation dialog --- */}
                            <Button 
                                onClick={() => setIsConfirmOpen(true)}
                                className="mt-6 w-full" 
                                disabled={attendance.length === 0 || isSubmitting}
                            >
                                {isSubmitting ? 'Saving...' : 'Save Attendance'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="space-y-6">
                    <Card><CardHeader><CardTitle>Enrolled Students</CardTitle><CardDescription>Total: {classDetails.students?.length || 0}</CardDescription></CardHeader><CardContent>{classDetails.students && classDetails.students.length > 0 ? (<ul className="divide-y max-h-60 overflow-y-auto pr-2">{classDetails.students.map(student => (<li key={student._id} className="flex justify-between items-center py-2.5"><span className="font-medium text-sm">{student.user.name}</span><span className="text-muted-foreground text-sm">{student.rollNo}</span></li>))}</ul>) : (<p className="text-center text-muted-foreground py-2 text-sm">No students have been added.</p>)}</CardContent></Card>
                    <AddSingleStudent classId={id} onStudentAdded={fetchClassDetails} />
                    <BulkAddStudents classId={id} onUploadComplete={fetchClassDetails} />
                </div>
            </div>

            {/* --- NEW: Confirmation Dialog --- */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will save the current attendance records for all students. You can still modify them later by selecting this date again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={submitAttendance}>
                            Confirm & Save
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* --- Result Dialog (Success/Error) --- */}
            <AlertDialog open={isResultOpen} onOpenChange={setIsResultOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-4">
                            {resultContent.type === 'success' ? (
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10"><CheckCircle2 className="h-6 w-6 text-green-600" /></div>
                            ) : (
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><AlertCircle className="h-6 w-6 text-red-600" /></div>
                            )}
                            <div className="flex-grow">
                                <AlertDialogTitle>{resultContent.title}</AlertDialogTitle>
                                <AlertDialogDescription>{resultContent.message}</AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setIsResultOpen(false)}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ClassDetails;