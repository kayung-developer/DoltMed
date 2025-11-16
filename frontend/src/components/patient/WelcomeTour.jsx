import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import Button from '../common/Button';
import { patientService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const tourSteps = [
    { title: "Welcome to Your Dashboard!", content: "This is your personalized health command center. Let's take a quick look around." },
    { title: "Health Snapshot", content: "Here, you'll find key metrics and charts showing your health trends over time." },
    { title: "Upcoming Appointments", content: "Manage your upcoming consultations and access telemedicine sessions directly from here." },
    { title: "AI-Powered Alerts", content: "Our system will provide personalized alerts and reminders to help you stay on track with your health goals." },
];

const WelcomeTour = ({ isOpen, onComplete }) => {
    const [step, setStep] = useState(0);
    const { refreshUser } = useAuth();

    const handleNext = () => {
        if (step < tourSteps.length - 1) {
            setStep(step + 1);
        } else {
            // End of tour
            patientService.completeTour().then(() => {
                refreshUser(); // Update user context to reflect tour completion
                onComplete();
            });
        }
    };

    return (
        <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-sm rounded-lg bg-white dark:bg-gray-800 p-6">
                    <Dialog.Title className="text-xl font-bold">{tourSteps[step].title}</Dialog.Title>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{tourSteps[step].content}</p>
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleNext}>
                            {step < tourSteps.length - 1 ? 'Next' : 'Finish'}
                        </Button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default WelcomeTour;