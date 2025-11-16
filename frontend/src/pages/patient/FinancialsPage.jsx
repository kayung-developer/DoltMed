import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/api';
import toast from 'react-hot-toast';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Button from '../../components/common/Button';
import { ArrowDownTrayIcon, CreditCardIcon, CogIcon } from '@heroicons/react/24/solid';
const FinancialsPage = () => {
const { user } = useAuth();
const [invoices, setInvoices] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
    const fetchInvoices = async () => {
        setLoading(true);
        try {
            // We reuse the getDocuments endpoint and filter for invoices
            const response = await patientService.getDocuments();
            const invoiceDocs = response.data.filter(doc => doc.description.toLowerCase().includes('invoice'));
            setInvoices(invoiceDocs);
        } catch (error) {
            toast.error("Could not load financial history.");
        } finally {
            setLoading(false);
        }
    };
    fetchInvoices();
}, []);

return (
    <AnimatedWrapper>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financials</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your subscription, payment methods, and view billing history.</p>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side: Subscription & Payment Methods */}
            <div className="lg:col-span-1 space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold flex items-center gap-2"><CogIcon className="w-6 h-6"/> Current Subscription</h2>
                    <div className="mt-4">
                        <p className="text-3xl font-bold capitalize">{user?.subscription_plan || 'Freemium'}</p>
                        <p className="text-sm text-gray-500">Your plan renews on Nov 27, 2025.</p>
                        <Button variant="secondary" className="mt-4 w-full">Manage Subscription</Button>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                     <h2 className="text-xl font-semibold flex items-center gap-2"><CreditCardIcon className="w-6 h-6"/> Payment Methods</h2>
                     <div className="mt-4 space-y-3">
                        <div className="p-3 border dark:border-gray-700 rounded-md">
                            <p className="font-semibold">Visa ending in 4242</p>
                            <p className="text-xs text-gray-500">Expires 12/28</p>
                        </div>
                     </div>
                     <Button variant="ghost" className="mt-4 w-full">Add New Payment Method</Button>
                </div>
            </div>

            {/* Right Side: Billing History */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold">Billing History</h2>
                <ul className="mt-4 divide-y dark:divide-gray-700">
                    {loading ? <p>Loading history...</p> : invoices.map(invoice => (
                         <li key={invoice.id} className="py-4 flex items-center justify-between">
                            <div>
                                <p className="font-semibold">{invoice.description}</p>
                                <p className="text-sm text-gray-500">Paid on {new Date(invoice.upload_date).toLocaleDateString()}</p>
                            </div>
                            <a href={invoice.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-semibold text-dortmed-600">
                                <ArrowDownTrayIcon className="w-5 h-5 mr-1"/> Download Invoice
                            </a>
                         </li>
                    ))}
                </ul>
            </div>
        </div>
    </AnimatedWrapper>
);
};
export default FinancialsPage;