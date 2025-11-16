import React, { useState, useEffect } from 'react';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import { adminService } from '../../services/api';
import toast from 'react-hot-toast';

const SubscriptionManagementPage = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            setLoading(true);
            try {
                const response = await adminService.getRecentPayments();
                setPayments(response.data);
            } catch (error) {
                toast.error("Could not fetch recent transactions.");
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, []);

    return (
        <AnimatedWrapper>
            <h1 className="text-3xl font-bold">Subscription & Payment Oversight</h1>
            <div className="mt-8 bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <div className="p-4"><h2 className="text-xl font-semibold">Recent Transactions</h2></div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="table-header">Transaction ID</th>
                                <th className="table-header">User Email</th>
                                <th className="table-header">Amount</th>
                                <th className="table-header">Plan</th>
                                <th className="table-header">Date</th>
                                <th className="table-header">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                            {loading ? <tr><td colSpan="6" className="text-center p-4">Loading...</td></tr> :
                            payments.map(p => (
                                <tr key={p.id}>
                                    <td className="table-cell font-mono text-xs">{p.id}</td>
                                    <td className="table-cell">{p.user_email}</td>
                                    <td className="table-cell font-semibold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency }).format(p.amount)}</td>
                                    <td className="table-cell capitalize">{p.subscription_plan || 'N/A'}</td>
                                    <td className="table-cell">{new Date(p.payment_date).toLocaleString()}</td>
                                    <td className="table-cell"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default SubscriptionManagementPage;