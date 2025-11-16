import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

const testimonialsData = [
    {
        quote: "DortMed's AI diagnosis tool helped me identify a potential issue early on. My physician was able to confirm it and start treatment immediately. It's truly life-changing.",
        name: "Sarah L.",
        location: "New York, USA",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
        quote: "As a physician, the platform has streamlined my entire workflow. I can manage patients more effectively and spend more quality time on consultations. The AI assistance is a remarkable bonus.",
        name: "Dr. James Chen",
        location: "London, UK",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    // Add more testimonials
];

const Testimonials = () => {
    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
            <div className="container mx-auto px-6">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Trusted by Patients and Doctors Worldwide</h2>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Our commitment to excellence is reflected in the experiences of our users.</p>
                </div>
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonialsData.map((testimonial, index) => (
                        <div key={index} className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-5 h-5" />)}
                            </div>
                            <p className="mt-4 text-gray-600 dark:text-gray-300">"{testimonial.quote}"</p>
                            <div className="mt-6 flex items-center">
                                <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                                <div className="ml-4">
                                    <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">{testimonial.location}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;