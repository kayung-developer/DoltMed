import React from 'react';
import { Link } from 'react-router-dom';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import { UserIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

const RegisterSelection = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <AnimatedWrapper className="sm:mx-auto sm:w-full sm:max-w-2xl">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        Join DortMed
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Choose your account type to get started on your personalized healthcare journey.
                    </p>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Patient Registration Card */}
                    <Link to="/register/patient" className="group block p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-dortmed-100 dark:bg-dortmed-900 mx-auto">
                            <UserIcon className="h-8 w-8 text-dortmed-600 dark:text-dortmed-400"/>
                        </div>
                        <h3 className="mt-6 text-xl font-bold text-center text-gray-900 dark:text-white">I am a Patient</h3>
                        <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
                            Create an account to manage your health records, book appointments, and receive personalized care.
                        </p>
                        <div className="mt-6 text-center font-semibold text-dortmed-600 group-hover:underline">
                            Create Patient Account &rarr;
                        </div>
                    </Link>

                    {/* Physician Registration Card */}
                    <Link to="/register/physician" className="group block p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 mx-auto">
                            <BriefcaseIcon className="h-8 w-8 text-blue-600 dark:text-blue-400"/>
                        </div>
                        <h3 className="mt-6 text-xl font-bold text-center text-gray-900 dark:text-white">I am a Physician</h3>
                        <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
                            Join our network of elite medical professionals to offer care, manage your practice, and utilize AI tools.
                        </p>
                         <div className="mt-6 text-center font-semibold text-blue-600 group-hover:underline">
                            Apply to Join &rarr;
                        </div>
                    </Link>
                </div>
                 <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        Already have an account? <Link to="/login" className="font-medium text-dortmed-600 hover:underline">Log In</Link>
                    </p>
                </div>
            </AnimatedWrapper>
        </div>
    );
};

export default RegisterSelection;