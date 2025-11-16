import React from 'react';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import { BeakerIcon, HeartIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';

const teamMembers = [
    { name: 'Dr. Peter Dolton', role: 'CEO', bio: 'With over 5 years in clinical practice and health-tech, Dr. Peter leads our mission.', avatar: 'dolton.jpg' },
    { name: 'Dr. Ben Carter', role: 'Chief Medical Officer', bio: 'A leading cardiologist and AI research pioneer, Dr. Carter ensures clinical excellence.', avatar: 'https://randomuser.me/api/portraits/men/66.jpg' },
    { name: 'Pascal Aondover', role: 'Software Engineer', bio: 'Pascal architected our secure, scalable platform, bringing a decade of intelligent systems.', avatar: 'developer.jpeg' }
];

const AboutUsPage = () => {
    return (
        <AnimatedWrapper>
            <div className="py-20 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-6">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Our Vision for a Healthier World</h1>
                        <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                            We believe that everyone, everywhere deserves access to intelligent, compassionate, and personalized healthcare. DortMed was founded to make this vision a reality.
                        </p>
                    </div>

                    <div className="mt-16 grid md:grid-cols-3 gap-8">
                        <div className="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <HeartIcon className="w-12 h-12 mx-auto text-dortmed-500" />
                            <h3 className="mt-4 text-xl font-semibold">Patient-Centric Approach</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Every feature is designed with you, the patient, at the center of our universe.</p>
                        </div>
                         <div className="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <BeakerIcon className="w-12 h-12 mx-auto text-dortmed-500" />
                            <h3 className="mt-4 text-xl font-semibold">Innovation in AI</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">We are relentless in our pursuit of AI-driven solutions that lead to better health outcomes.</p>
                        </div>
                         <div className="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <ShieldCheckIcon className="w-12 h-12 mx-auto text-dortmed-500" />
                            <h3 className="mt-4 text-xl font-semibold">Uncompromising Security</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Your health data is your most valuable asset. We protect it with enterprise-grade security.</p>
                        </div>
                    </div>

                    <div className="mt-20 text-center">
                         <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Meet Our Leadership</h2>
                         <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                             {teamMembers.map(member => (
                                 <div key={member.name} className="flex flex-col items-center">
                                     <img src={member.avatar} alt={member.name} className="w-32 h-32 rounded-full object-cover shadow-lg" />
                                     <h4 className="mt-4 font-bold text-lg">{member.name}</h4>
                                     <p className="text-dortmed-500 font-semibold">{member.role}</p>
                                     <p className="mt-2 text-center text-gray-600 dark:text-gray-400 text-sm">{member.bio}</p>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default AboutUsPage;