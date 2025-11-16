import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

const PaymentStatusPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { refreshUser } = useAuth();
    const status = searchParams.get('trxref') ? 'success' : 'cancelled';

    useEffect(() => {
        if (status === 'success') {
            toast.success("Payment successful! Your account is being updated.");
            // Refresh user data to get new subscription status
            refreshUser();
            // Redirect to dashboard after a delay
            setTimeout(() => navigate('/patient'), 3000); // Navigate to the correct dashboard
        } else {
            toast.error("Payment was cancelled or failed.");
            setTimeout(() => navigate('/subscriptions'), 3000);
        }
    }, [status, refreshUser, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                {status === 'success' ? (
                    <>
                        <CheckCircleIcon className="w-16 h-16 text-success mx-auto" />
                        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Payment Verification</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Your payment was successful. We are updating your subscription. You will be redirected shortly.
                        </p>
                    </>
                ) : (
                    <>
                        <XCircleIcon className="w-16 h-16 text-danger mx-auto" />
                        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Payment Cancelled</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                           Your payment was not completed. You will be redirected to the subscription page.
                        </p>
                    </>
                )}
                 <div className="mt-6 w-32 mx-auto h-1 bg-dortmed-200 rounded-full overflow-hidden">
                    <div className="animate-progress w-full h-full bg-dortmed-500 origin-left-right"></div>
                </div>
            </div>
        </div>
    );
};

export default PaymentStatusPage;