import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Button from '../../components/common/Button';
import { LightBulbIcon, ChartBarIcon, CalendarDaysIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

const benefits = [
    {
        icon: CalendarDaysIcon,
        title: 'Flexible Scheduling',
        description: 'Set your own hours and manage your calendar with our intuitive tools. Achieve the work-life balance you deserve.'
    },
    {
        icon: LightBulbIcon,
        title: 'AI-Powered Assistance',
        description: 'Enhance your diagnostic process with our AI decision support tools, check for drug interactions, and access patient risk profiles.'
    },
    {
        icon: ChartBarIcon,
        title: 'Streamlined Practice Management',
        description: 'Reduce administrative overhead with integrated clinical notes, e-prescribing, and secure patient messaging all in one place.'
    },
    {
        icon: ChatBubbleLeftRightIcon,
        title: 'Expand Your Reach',
        description: 'Connect with patients from around the globe, breaking down geographical barriers to provide expert care.'
    }
];

const PhysicianResourcesPage = () => {
    return (
        <AnimatedWrapper>
            {/* Hero Section */}
            <div className="bg-gray-50 dark:bg-gray-800 py-24">
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
                        Empowering the Future of Medicine. Together.
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                        Join DortMed's elite network of healthcare professionals and redefine how you deliver care. We provide the tools, you provide the expertise.
                    </p>
                    <div className="mt-8">
                        <Link to="/register/physician">
                            <Button className="px-8 py-3 text-lg">Apply to Join Today</Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div className="py-20 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">The DortMed Advantage for Physicians</h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
                        {benefits.map(benefit => (
                            <div key={benefit.title}>
                                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-dortmed-600 text-white">
                                    <benefit.icon className="h-6 w-6" />
                                </div>
                                <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">{benefit.title}</h3>
                                <p className="mt-2 text-base text-gray-600 dark:text-gray-400">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Onboarding Process Section */}
            <div className="py-20 bg-gray-50 dark:bg-gray-800">
                <div className="container mx-auto px-6 max-w-4xl text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">A Simple and Secure Onboarding Process</h2>
                    <div className="mt-12 space-y-8">
                        <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow">
                            <h3 className="text-xl font-semibold">1. Submit Your Application</h3>
                            <p>Complete our streamlined registration form with your professional credentials.</p>
                        </div>
                         <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow">
                            <h3 className="text-xl font-semibold">2. Credential Verification</h3>
                            <p>Our team securely verifies your medical license and board certifications with the relevant authorities.</p>
                        </div>
                         <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow">
                            <h3 className="text-xl font-semibold">3. Platform Onboarding & Setup</h3>
                            <p>Receive your welcome kit, set up your profile and calendar, and get acquainted with our powerful tools.</p>
                        </div>
                    </div>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default PhysicianResourcesPage;