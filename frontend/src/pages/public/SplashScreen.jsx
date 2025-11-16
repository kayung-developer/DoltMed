import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const SplashScreen = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                if (isAuthenticated) {
                    // Navigate to role-specific dashboard
                    if (user.role === 'patient') navigate('/patient');
                    else if (user.role === 'physician') navigate('/physician');
                    else if (user.role === 'superuser') navigate('/admin');
                    else navigate('/welcome'); // Fallback
                } else {
                    navigate('/welcome');
                }
            }, 2000); // 2-second splash screen
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, user, loading, navigate]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-dortmed-50 dark:bg-gray-900">
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex items-center space-x-4"
            >
                <img src="/logo192.png" alt="DortMed Logo" className="w-16 h-auto" />
                <h1 className="text-5xl font-bold text-dortmed-700 dark:text-dortmed-300">DoltMed</h1>
            </motion.div>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: "10rem" }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className="h-1 bg-dortmed-500 rounded-full mt-6"
            />
        </div>
    );
};

export default SplashScreen;