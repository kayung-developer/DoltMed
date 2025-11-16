import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { physicianService } from '../../services/api';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import { UserCircleIcon } from '@heroicons/react/24/solid';

const PatientListItem = ({ patient }) => (
    <Link to={`/physician/patients/${patient.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 p-4 rounded-md transition-colors">
        <div className="flex items-center space-x-4">
            <UserCircleIcon className="h-10 w-10 text-gray-400" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dortmed-600 dark:text-dortmed-400 truncate">
                    {patient.first_name} {patient.last_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {patient.email}
                </p>
            </div>
        </div>
    </Link>
);

const MyPatientsPage = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPatients = async () => {
            setLoading(true);
            try {
                const response = await physicianService.getMyPatients();
                setPatients(response.data);
            } catch (error) {
                toast.error("Could not fetch patient list.");
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    return (
        <AnimatedWrapper>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Patients</h1>
            <div className="mt-8 bg-white dark:bg-gray-800 shadow-md rounded-lg">
                <div className="p-4">
                    {loading ? (
                        <p className="text-center py-4 text-gray-500">Loading patients...</p>
                    ) : patients.length > 0 ? (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {patients.map(p => <li key={p.id}><PatientListItem patient={p} /></li>)}
                        </ul>
                    ) : (
                        <p className="text-center py-8 text-gray-500">You do not have any patients yet. Complete an appointment to add a patient.</p>
                    )}
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default MyPatientsPage;