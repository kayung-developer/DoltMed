import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/api';
import toast from 'react-hot-toast';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Button from '../../components/common/Button';
import { ShieldCheckIcon, EyeIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Modal for Reviewing a Physician Application
const VerificationModal = ({ physician, isOpen, onClose, onActionSuccess }) => {
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAction = async (isVerified) => {
        setIsSubmitting(true);
        try {
            await adminService.verifyPhysician(physician.physician_profile.id, {
                is_verified: isVerified,
                verification_notes: notes,
            });
            toast.success(`Physician application has been ${isVerified ? 'approved' : 'rejected'}.`);
            onActionSuccess(); // Triggers a re-fetch of the pending list
            onClose();
        } catch (error) {
            toast.error("An error occurred while processing the application.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !physician) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Review Physician Application</h2>

                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <span className="font-semibold">Name:</span>
                        <span>{physician.physician_profile.first_name} {physician.physician_profile.last_name}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <span className="font-semibold">Email:</span>
                        <span>{physician.email}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <span className="font-semibold">Specialty:</span>
                        <span>{physician.physician_profile.specialty}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <span className="font-semibold">Medical License No:</span>
                        <span className="font-mono">{physician.physician_profile.medical_license_number}</span>
                    </div>
                     <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <span className="font-semibold">Board Certifications:</span>
                        <p className="mt-1">{physician.physician_profile.board_certifications || 'Not provided'}</p>
                    </div>
                    {/* In a real system, a link to uploaded credential documents would go here */}
                    {/* <Button variant="ghost">View Verification Documents</Button> */}

                    <div className="pt-4">
                        <label htmlFor="notes" className="block font-semibold">Verification Notes (Optional for rejection)</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="3"
                            className="w-full input-base mt-1"
                            placeholder="e.g., License number could not be verified with the state board."
                        ></textarea>
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-8">
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button variant="danger" isLoading={isSubmitting} onClick={() => handleAction(false)}>
                        <XCircleIcon className="w-5 h-5 mr-2" /> Reject
                    </Button>
                    <Button isLoading={isSubmitting} onClick={() => handleAction(true)}>
                        <CheckCircleIcon className="w-5 h-5 mr-2" /> Approve
                    </Button>
                </div>
            </div>
        </div>
    );
};

// Main Component
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
            <VerificationModal
                isOpen={!!selectedPhysician}
                physician={selectedPhysician}
                onClose={() => setSelectedPhysician(null)}
                onActionSuccess={fetchPendingPhysicians}
            />
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Physician Verification Queue</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Review and approve or reject new physician registrations to maintain platform integrity.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
                     <div className="p-4">
                        {loading ? (
                            <p className="text-center py-8 text-gray-500">Loading applications...</p>
                        ) : pending.length > 0 ? (
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                {pending.map(p => (
                                    <li key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <div className="flex items-center space-x-4 min-w-0">
                                            <DocumentTextIcon className="w-10 h-10 text-dortmed-500 flex-shrink-0"/>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-gray-900 dark:text-white truncate">{p.physician_profile.first_name} {p.physician_profile.last_name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{p.physician_profile.specialty} - {p.email}</p>
                                            </div>
                                        </div>
                                        <Button onClick={() => setSelectedPhysician(p)} variant="secondary" className="ml-4 flex-shrink-0">
                                            <EyeIcon className="w-5 h-5 mr-2"/>Review
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-12">
                                <ShieldCheckIcon className="w-16 h-16 mx-auto text-green-500"/>
                                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">All Clear!</h3>
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">There are no pending physician applications to review.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default PhysicianVerification;