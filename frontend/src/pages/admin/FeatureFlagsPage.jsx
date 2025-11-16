import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/api';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';

const FeatureFlagRow = ({ flag, onUpdate }) => {
    const plans = ['freemium', 'basic', 'premium', 'ultimate'];
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <td className="table-cell font-semibold font-mono">{flag.name}</td>
            {plans.map(plan => (
                <td key={plan} className="table-cell text-center">
                    <input
                        type="checkbox"
                        className="h-5 w-5 rounded text-dortmed-600 focus:ring-dortmed-500"
                        checked={flag[`is_enabled_for_${plan}`]}
                        onChange={(e) => onUpdate(flag.name, { [`is_enabled_for_${plan}`]: e.target.checked })}
                    />
                </td>
            ))}
        </tr>
    );
};


const FeatureFlagsPage = () => {
    const [flags, setFlags] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFlags = async () => {
            setLoading(true);
            try {
                const response = await adminService.getFeatureFlags();
                setFlags(response.data);
            } catch (error) {
                toast.error("Could not load feature flags.");
            } finally {
                setLoading(false);
            }
        };
        fetchFlags();
    }, []);

    const handleUpdate = async (flagName, updateData) => {
        try {
            setFlags(prevFlags => prevFlags.map(f => f.name === flagName ? { ...f, ...updateData } : f));
            await adminService.updateFeatureFlag(flagName, updateData);
            toast.success(`${flagName} updated successfully.`);
        } catch (error) {
            toast.error(`Failed to update ${flagName}.`);
        }
    };

    return (
        <AnimatedWrapper>
            <h1 className="text-3xl font-bold">Feature Flag Management</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
                Enable or disable features for different subscription plans in real-time.
            </p>
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                 <table className="min-w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="table-header">Feature</th>
                            <th className="table-header">Freemium</th>
                            <th className="table-header">Basic</th>
                            <th className="table-header">Premium</th>
                            <th className="table-header">Ultimate</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? <tr><td colSpan="5" className="text-center p-4">Loading...</td></tr> :
                        flags.map(flag => <FeatureFlagRow key={flag.id} flag={flag} onUpdate={handleUpdate} />)}
                    </tbody>
                 </table>
            </div>
        </AnimatedWrapper>
    );
};

export default FeatureFlagsPage;