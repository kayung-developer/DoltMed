import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../common/Button';

const Hero = () => {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-28 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="container mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight tracking-tighter">
                        Revolutionizing Healthcare,
                        <br />
                        <span className="text-dortmed-600">Personalized for You.</span>
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                        Experience the future of medical care with DortMed. Connect with elite physicians, manage your health with AI-powered insights, and access a global network of trusted hospitals.
                    </p>
                    <div className="mt-10 flex justify-center gap-4 flex-wrap">
                        <Link to="/register"><Button className="px-8 py-3 text-lg">Sign Up as a Patient</Button></Link>
                        <Link to="/register/physician"><Button variant="secondary" className="px-8 py-3 text-lg">Join as a Physician</Button></Link>
                    </div>
                </motion.div>
            </div>
            {/* Optional: Add background decorative elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-dortmed-100 dark:bg-dortmed-900/30 rounded-full opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100 dark:bg-blue-900/30 rounded-full opacity-30 translate-x-1/2 translate-y-1/2"></div>
        </section>
    );
};

export default Hero;