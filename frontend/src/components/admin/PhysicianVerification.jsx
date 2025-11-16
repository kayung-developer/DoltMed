import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/api';
import toast from 'react-hot-toast';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Button from '../../components/common/Button';
import { CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/solid';

const VerificationModal = ({ physician, onClose, onActionSuccess }) => {
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAction = async (isVerified) => {
        setIsSubmitting(true);
        try {
            await adminService.verifyPhysician(physician.physician_profile.id, {
                is_verified: isVerified,
                verification_notes: notes,
            });
            toast.success(`Physician has been ${isVerified ? 'approved' : 'rejected'}.`);
            onActionSuccess();
            onClose();
        } catch (error) {
            toast.error("An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!physician) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Review Physician Application</h2>
                <div className="space-y-4 text-sm">
                    <p><span className="font-semibold">Name:</span> {physician.physician_profile.first_name} {physician.physician_profile.last_name}</p>
                    <p><span className="font-semibold">Email:</span> {physician.email}</p>
                    <p><span className="font-semibold">Specialty:</span> {physician.physician_profile.specialty}</p>
                    <p><span className="font-semibold">License No:</span> {physician.physician_profile.medical_license_number}</p>
                    <p className="font-semibold mt-4">Verification Notes (Optional):</p>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows="3" className="w-full input-base"></textarea>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="danger" isLoading={isSubmitting} onClick={() => handleAction(false)}>Reject</Button>
                    <Button isLoading={isSubmitting} onClick={() => handleAction(true)}>Approve</Button>
                </div>
            </div>
        </div>
    );
};

const PhysicianVerification = () => {
    const [pending, setPending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhysician, setSelectedPhysician] = useState(null);

    const fetchPendingPhysicians = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminService.getPendingPhysicians();
            setPending(response.data);
        } catch (error) {
            toast.error("Failed to load pending verifications.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingPhysicians();
    }, [fetchPendingPhysicians]);

    return (
        <AnimatedWrapper>
            {selectedPhysician && <VerificationModal physician={selectedPhysician} onClose={() => setSelectedPhysician(null)} onActionSuccess={fetchPendingPhysicians} />}
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Physician Verification</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Review and approve or reject new physician registrations.</p>
                </div>
                {loading ? <p>Loading...</p> : (
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {pending.length > 0 ? pending.map(p => (
                                <li key={p.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{p.physician_profile.first_name} {p.physician_profile.last_name}</p>
                                        <p className="text-sm text-gray-500">{p.physician_profile.specialty} - {p.email}</p>
                                    </div>
                                    <Button onClick={() => setSelectedPhysician(p)}><EyeIcon className="w-5 h-5 mr-2"/>Review</Button>
                                </li>
                            )) : <p className="text-center py-8 text-gray-500">No pending verifications.</p>}
                        </ul>
                    </div>
                )}
            </div>
        </AnimatedWrapper>
    );
};
export default PhysicianVerification;