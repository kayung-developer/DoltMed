import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon, VideoCameraIcon, LightBulbIcon, GlobeEuropeAfricaIcon } from '@heroicons/react/24/outline';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Hero from '../../components/public/Hero';
import Testimonials from '../../components/public/Testimonials';
import Button from '../../components/common/Button';

const servicePillars = [
    { name: 'Telemedicine', description: 'Connect with world-class specialists from anywhere, anytime.', icon: VideoCameraIcon },
    { name: 'AI-Powered Diagnostics', description: 'Leverage cutting-edge AI for early risk detection and diagnostic support.', icon: LightBulbIcon },
    { name: 'Personalized Wellness', description: 'Receive custom meal plans, exercise regimens, and health tips.', icon: ShieldCheckIcon },
    { name: 'Global Hospital Network', description: 'Access our curated network of internationally accredited hospitals.', icon: GlobeEuropeAfricaIcon },
];

const Homepage = () => {
    return (
        <AnimatedWrapper>
            <Hero />

            {/* Core Service Pillars Section */}
            <section className="py-20 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {servicePillars.map((pillar) => (
                            <div key={pillar.name} className="text-center p-6">
                                <pillar.icon className="w-12 h-12 mx-auto text-dortmed-500" />
                                <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">{pillar.name}</h3>
                                <p className="mt-2 text-gray-600 dark:text-gray-400">{pillar.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* "How It Works" Section */}
            <section className="py-20 bg-dortmed-50 dark:bg-gray-800">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Your Journey to Better Health in 3 Simple Steps</h2>
                    <div className="mt-12 grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting lines */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-dortmed-300 transform -translate-y-1/2"></div>

                        <div className="relative z-10 p-6">
                            <div className="flex items-center justify-center w-20 h-20 mx-auto bg-white dark:bg-gray-700 rounded-full shadow-lg border-4 border-dortmed-500 text-dortmed-500 font-bold text-2xl">1</div>
                            <h3 className="mt-6 text-xl font-semibold">Register & Build Profile</h3>
                            <p className="mt-2">Create your secure account and add your medical history in minutes.</p>
                        </div>
                        <div className="relative z-10 p-6">
                            <div className="flex items-center justify-center w-20 h-20 mx-auto bg-white dark:bg-gray-700 rounded-full shadow-lg border-4 border-dortmed-500 text-dortmed-500 font-bold text-2xl">2</div>
                            <h3 className="mt-6 text-xl font-semibold">Consult a Specialist</h3>
                            <p className="mt-2">Find the right doctor and book a secure telemedicine consultation.</p>
                        </div>
                        <div className="relative z-10 p-6">
                             <div className="flex items-center justify-center w-20 h-20 mx-auto bg-white dark:bg-gray-700 rounded-full shadow-lg border-4 border-dortmed-500 text-dortmed-500 font-bold text-2xl">3</div>
                            <h3 className="mt-6 text-xl font-semibold">Receive Your Plan</h3>
                            <p className="mt-2">Get AI-powered insights, prescriptions, and a personalized wellness plan.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Testimonials />

            {/* Trust Signals Section */}
             <section className="py-16 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-6">
                    <h3 className="text-center text-gray-500 dark:text-gray-400 font-semibold uppercase">Trusted by leading healthcare organizations</h3>
                    <div className="flex flex-wrap justify-center items-center mt-8 gap-x-12 gap-y-6">
                        {/* Replace with real partner logos */}
                        <p className="text-gray-400 font-semibold">Partner A</p>
                        <p className="text-gray-400 font-semibold">Global Health Inc.</p>
                        <p className="text-gray-400 font-semibold">MediTech Alliance</p>
                        <p className="text-gray-400 font-semibold">InnovateCare</p>
                    </div>
                </div>
            </section>

        </AnimatedWrapper>
    );
};

export default Homepage;