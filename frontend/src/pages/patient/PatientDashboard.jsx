import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import WelcomeTour from '../../components/patient/WelcomeTour';
import { BellIcon, CalendarIcon, HeartIcon } from '@heroicons/react/24/solid';
import { patientService } from '../../services/api';
import toast from 'react-hot-toast';

const PatientDashboard = () => {
    const { user } = useAuth();
    const [showTour, setShowTour] = useState(user?.patient_profile?.has_completed_tour === false);
    const [summary, setSummary] = useState({ upcoming_appointments: [], ai_alerts: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            try {
                const response = await patientService.getDashboardSummary();
                setSummary(response.data);
            } catch (error) {
                toast.error("Could not load dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    const patientName = user?.patient_profile?.first_name || user?.email;

    return (
        <AnimatedWrapper>
            <WelcomeTour isOpen={showTour} onComplete={() => setShowTour(false)} />
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome, {patientName}!</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Here is your personalized health command center.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content: AI Alerts and other widgets */}
                    <div className="lg:col-span-2 space-y-8">
                         <div>
                           <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><BellIcon className="w-6 h-6 text-dortmed-500"/> AI-Powered Alerts</h3>
                           <div className="space-y-4">
                               {loading ? <p>Loading alerts...</p> : summary.ai_alerts.length > 0 ? (
                                   summary.ai_alerts.map(alert => (
                                       <Link to={alert.link} key={alert.id} className="block">
                                           <div className={`p-4 rounded-lg flex items-start gap-3 hover:shadow-lg transition-shadow ${alert.type === 'warning' ? 'bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500' : 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500'}`}>
                                               <HeartIcon className="w-5 h-5 mt-1 text-red-500 flex-shrink-0"/>
                                               <p className="text-sm text-gray-800 dark:text-gray-200">{alert.text}</p>
                                           </div>
                                       </Link>
                                   ))
                               ) : <p className="text-sm text-gray-500">No critical alerts at this time. All systems normal.</p>}
                           </div>
                        </div>
                        {/* Data Visualization can be added here once we have real data to plot */ }
                    </div>

                    {/* Side Column: Appointments */}
                    <div className="lg:col-span-1">
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><CalendarIcon className="w-6 h-6 text-dortmed-500"/> Upcoming Appointments</h3>
                             <div className="space-y-4">
                                {loading ? <p>Loading...</p> : summary.upcoming_appointments.length > 0 ? (
                                    summary.upcoming_appointments.map(appt => (
                                        <div key={appt.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">Dr. {appt.physician.first_name} {appt.physician.last_name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(appt.appointment_time).toLocaleString()}</p>
                                            <Link to={`/consultation/${appt.id}`} className="text-sm font-semibold text-dortmed-600 mt-2 inline-block">Join Call</Link>
                                        </div>
                                    ))
                                ) : <p className="text-sm text-gray-500">No upcoming appointments.</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AnimatedWrapper>
    );
};
export default PatientDashboard;