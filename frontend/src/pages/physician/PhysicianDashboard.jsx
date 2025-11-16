import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import { physicianService } from '../../services/api';
import toast from 'react-hot-toast';
import { Bar } from 'react-chartjs-2';
import { CalendarDaysIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/50`}>
            {React.createElement(icon, { className: `h-7 w-7 text-${color}-600 dark:text-${color}-400` })}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const AppointmentListItem = ({ appointment }) => (
    <li className="py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md transition-colors duration-200">
        <div className="flex items-center space-x-4">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dortmed-600 dark:text-dortmed-400 truncate">
                    {appointment.patient.first_name} {appointment.patient.last_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {appointment.patient.email}
                </p>
            </div>
            <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                {new Date(appointment.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <Link to={`/physician/patients/${appointment.patient.id}`} className="text-sm font-medium text-dortmed-600 hover:underline">
                View Profile
            </Link>
        </div>
    </li>
);

const PhysicianDashboard = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [todayAppointments, setTodayAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const apptResponse = await physicianService.getAppointments();
                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

                const todays = apptResponse.data.filter(appt => {
                    const apptTime = new Date(appt.appointment_time);
                    return apptTime >= startOfDay && apptTime < endOfDay;
                }).sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time));

                setTodayAppointments(todays);

                const analyticsResponse = await physicianService.getPracticeAnalytics();
                setAnalytics(analyticsResponse.data);

            } catch (error) {
                toast.error("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const physicianName = user?.physician_profile?.first_name || user?.email;

    return (
        <AnimatedWrapper>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.welcome')}, Dr. {physicianName}!</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{t('dashboard.physician_subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard title="Appointments Today" value={todayAppointments.length} icon={CalendarDaysIcon} color="dortmed" />
                    <StatCard title="Total Consultations" value={analytics?.total_consultations || '--'} icon={UserGroupIcon} color="blue" />
                    <StatCard title="Next Appointment" value={todayAppointments.length > 0 ? new Date(todayAppointments[0].appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'} icon={ClockIcon} color="green" />
                </div>

                 {analytics && (
                    <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold">AI-Driven Practice Insights</h2>
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Consultation Volume (Last 6 Months)</h3>
                                <Bar data={{
                                    labels: Object.keys(analytics.monthly_consultations),
                                    datasets: [{ label: '# of Consultations', data: Object.values(analytics.monthly_consultations), backgroundColor: 'rgba(2, 132, 199, 0.6)' }]
                                }} />
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                                    <p className="text-sm font-medium text-gray-500">Avg. Patient Satisfaction</p>
                                    <p className="text-2xl font-bold">{analytics.patient_satisfaction_score} / 5</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                                    <p className="text-sm font-medium text-gray-500">Avg. Consultation Duration</p>
                                    <p className="text-2xl font-bold">{analytics.average_consultation_duration} min</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Today's Schedule</h2>
                        <Link to="/physician/schedule" className="text-sm font-medium text-dortmed-600 hover:underline">Manage Availability</Link>
                    </div>
                    <div className="p-4">
                        {loading ? (
                            <p className="text-center py-4 text-gray-500">Loading schedule...</p>
                        ) : todayAppointments.length > 0 ? (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {todayAppointments.map(appt => <AppointmentListItem key={appt.id} appointment={appt} />)}
                            </ul>
                        ) : (
                            <p className="text-center py-8 text-gray-500 dark:text-gray-400">No appointments scheduled for today.</p>
                        )}
                    </div>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default PhysicianDashboard;