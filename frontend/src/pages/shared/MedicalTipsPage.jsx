import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { aiService } from '../../services/api';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';

const TipCard = ({ tip }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-dortmed-700 dark:text-dortmed-300">{tip.title}</h2>
        <p className="mt-4 text-gray-600 dark:text-gray-400">{tip.content}</p>
    </div>
);

const MedicalTipsPage = () => {
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTips = async () => {
            setLoading(true);
            try {
                const response = await aiService.getMedicalTips();
                setTips(response.data);
            } catch (error) {
                toast.error("Could not load medical tips.");
            } finally {
                setLoading(false);
            }
        };
        fetchTips();
    }, []);

    return (
        <AnimatedWrapper>
            <h1 className="text-3xl font-bold text-center">Daily Health & Wellness Tips</h1>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? <p>Loading tips...</p> : tips.map(tip => <TipCard key={tip.id} tip={tip} />)}
            </div>
        </AnimatedWrapper>
    );
};
export default MedicalTipsPage;