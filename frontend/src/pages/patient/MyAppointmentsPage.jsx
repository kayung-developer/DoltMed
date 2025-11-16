import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { appointmentService } from '../../services/api';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import RescheduleModal from '../../components/appointments/RescheduleModal';
import { CalendarIcon, ClockIcon, PencilIcon, XCircleIcon } from '@heroicons/react/24/solid';

const AppointmentCard = ({ appointment, onReschedule, onCancel }) => {
    const isUpcoming = new Date(appointment.appointment_time) > new Date();
    const isCancelled = appointment.status === 'cancelled';

    const statusStyles = {
        scheduled: "bg-blue-100 text-blue-800",
        rescheduled: "bg-yellow-100 text-yellow-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
    };

    return (
        <div className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md ${isCancelled ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">Dr. {appointment.physician.first_name} {appointment.physician.last_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{appointment.physician.specialty}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[appointment.status]}`}>
                    {appointment.status}
                </span>
            </div>
            <div className="mt-4 flex items-center text-gray-700 dark:text-gray-300">
                 <CalendarIcon className="w-5 h-5 mr-2" /> {new Date(appointment.appointment_time).toLocaleDateString()}
                 <ClockIcon className="w-5 h-5 mr-2 ml-4" /> {new Date(appointment.appointment_time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </div>
            {isUpcoming && !isCancelled && (
                 <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={() => onCancel(appointment.id)} className="flex items-center text-sm text-red-600 hover:text-red-800">
                        <XCircleIcon className="w-5 h-5 mr-1"/> Cancel
                    </button>
                    <button onClick={() => onReschedule(appointment)} className="flex items-center text-sm text-dortmed-600 hover:text-dortmed-800">
                        <PencilIcon className="w-5 h-5 mr-1"/> Reschedule
                    </button>
                </div>
            )}
        </div>
    );
};

const MyAppointmentsPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            // This service method needs to be created
            const response = await appointmentService.getUserAppointments();
            setAppointments(response.data);
        } catch (error) {
            toast.error("Could not fetch appointments.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleCancel = async (appointmentId) => {
        if (window.confirm("Are you sure you want to cancel this appointment?")) {
            try {
                await appointmentService.cancel(appointmentId);
                toast.success("Appointment cancelled.");
                fetchAppointments(); // Refresh the list
            } catch (error) {
                toast.error("Failed to cancel appointment.");
            }
        }
    };

    return (
        <AnimatedWrapper>
            <RescheduleModal
                isOpen={!!selectedAppointment}
                appointment={selectedAppointment}
                onClose={() => setSelectedAppointment(null)}
                onRescheduleSuccess={fetchAppointments}
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Appointments</h1>
            <div className="mt-8 space-y-6">
                {loading ? <p>Loading...</p> : appointments.length > 0 ? (
                    appointments.map(appt => (
                        <AppointmentCard
                            key={appt.id}
                            appointment={appt}
                            onReschedule={setSelectedAppointment}
                            onCancel={handleCancel}
                        />
                    ))
                ) : <p>You have no appointments scheduled.</p>}
            </div>
        </AnimatedWrapper>
    );
};

export default MyAppointmentsPage;