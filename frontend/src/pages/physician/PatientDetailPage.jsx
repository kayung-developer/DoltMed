import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { physicianService } from '../../services/api';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import { useForm } from 'react-hook-form';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const EPrescriptionForm = ({ patientId, onPrescriptionSuccess }) => {
    const { register, handleSubmit, reset } = useForm();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await physicianService.createPrescription({ ...data, patient_id: patientId });
            toast.success("E-Prescription created and added to patient records.");
            reset();
            onPrescriptionSuccess();
        } catch (error) {
            toast.error("Failed to create prescription.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-dortmed-50 dark:bg-gray-700/50 p-6 rounded-lg mt-8">
            <h3 className="text-xl font-semibold mb-4">Create New E-Prescription</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Medication" {...register('medication', { required: true })} />
                <Input label="Dosage (e.g., 10mg)" {...register('dosage', { required: true })} />
                <Input label="Frequency (e.g., Once daily)" {...register('frequency', { required: true })} />
                <Input label="Duration (e.g., 30 days)" {...register('duration', { required: true })} />
                <div className="md:col-span-2">
                    <Input label="Additional Notes" {...register('notes')} />
                </div>
                <div className="md:col-span-2">
                    <Button type="submit" isLoading={isLoading}>Generate & Save Prescription</Button>
                </div>
            </form>
        </div>
    );
};

const PatientDetailPage = () => {
    const { patientId } = useParams();
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPatientData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await physicianService.getPatientFullProfile(patientId);
            setPatient(response.data);
        } catch (error) {
            toast.error("Could not fetch patient details.");
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchPatientData();
    }, [fetchPatientData]);

    if (loading) return <p>Loading patient profile...</p>;
    if (!patient) return <p>Patient not found.</p>;

    return (
        <AnimatedWrapper>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{patient.first_name} {patient.last_name}</h1>
            <p className="text-gray-500">{patient.email}</p>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: History and Documents */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Medical History */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold">Medical History</h2>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><strong>Allergies:</strong> {patient.allergies || 'N/A'}</li>
                            {/* ... Render other history fields ... */}
                        </ul>
                    </div>
                    {/* Documents */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold">Uploaded Documents</h2>
                        <ul className="mt-4 divide-y divide-gray-200 dark:divide-gray-700">
                             {patient.documents.map(doc => (
                                 <li key={doc.id} className="py-3 flex items-center justify-between">
                                    <span>{doc.file_name} ({doc.document_type})</span>
                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-2 text-dortmed-600 hover:bg-gray-100 rounded-full">
                                        <ArrowDownTrayIcon className="w-5 h-5"/>
                                    </a>
                                 </li>
                             ))}
                        </ul>
                    </div>
                </div>
                {/* Right Column: E-Prescription */}
                <div className="lg:col-span-1">
                     <EPrescriptionForm patientId={patient.id} onPrescriptionSuccess={fetchPatientData} />
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default PatientDetailPage;