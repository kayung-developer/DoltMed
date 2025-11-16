import React from 'react';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Button from '../../components/common/Button';
import { BriefcaseIcon, LightBulbIcon, HeartIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

// This data would be fetched from a backend CMS or a job board API in a real system.
const openPositions = [
    { id: 1, title: 'Senior Backend Engineer (Python/FastAPI)', location: 'Remote (Global)', department: 'Engineering' },
    { id: 2, title: 'Lead Frontend Engineer (React)', location: 'Remote (Global)', department: 'Engineering' },
    { id: 3, title: 'Machine Learning Scientist (NLP/Healthcare)', location: 'New York, USA', department: 'AI & Research' },
    { id: 4, title: 'UX/UI Product Designer', location: 'London, UK', department: 'Design' },
    { id: 5, title: 'Board-Certified Cardiologist (Telemedicine)', location: 'Remote (USA)', department: 'Clinical' },
];

const companyValues = [
    { icon: HeartIcon, name: 'Patient-First Mission', description: 'Our primary focus is always on improving patient outcomes and experiences.' },
    { icon: LightBulbIcon, name: 'Innovate Relentlessly', description: 'We challenge the status quo and leverage technology to solve complex healthcare problems.' },
    { icon: BriefcaseIcon, name: 'Act with Integrity', description: 'We uphold the highest standards of security, privacy, and ethical conduct.' },
];

const CareersPage = () => {
    return (
        <AnimatedWrapper>
            {/* Hero Section */}
            <div className="bg-dortmed-700 text-white py-24">
                <div className="container mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold">Join Our Mission</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-dortmed-200">
                        Help us build the future of healthcare. We're looking for passionate, innovative, and driven individuals to join our global team.
                    </p>
                </div>
            </div>

            {/* Company Values Section */}
            <div className="py-20 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">Why Work at DortMed?</h2>
                    <div className="mt-12 grid md:grid-cols-3 gap-8">
                        {companyValues.map(value => (
                            <div key={value.name} className="text-center">
                                <value.icon className="w-12 h-12 mx-auto text-dortmed-500"/>
                                <h3 className="mt-4 text-xl font-semibold">{value.name}</h3>
                                <p className="mt-2 text-gray-600 dark:text-gray-400">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Open Positions Section */}
            <div className="py-20 bg-gray-50 dark:bg-gray-800">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white">Open Positions</h2>
                    <div className="mt-12 max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {openPositions.map(pos => (
                                <li key={pos.id}>
                                    <a href="#" className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-lg font-semibold text-dortmed-600 dark:text-dortmed-400">{pos.title}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    {pos.department} &middot; {pos.location}
                                                </p>
                                            </div>
                                            <ArrowRightIcon className="w-5 h-5 text-gray-400"/>
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default CareersPage;