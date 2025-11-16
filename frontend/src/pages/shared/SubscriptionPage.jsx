import React, { useState, useEffect } from 'react';
import { paymentService } from '../../services/api'; // Assume this is added to api.js
import toast from 'react-hot-toast';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import { useAuth } from '../../context/AuthContext';
import { CheckIcon } from '@heroicons/react/24/solid';
import Button from '../../components/common/Button';

const PlanCard = ({ plan, onSubscribe, isSubscribing, currentPlan }) => {
    const isCurrent = plan.plan_id === currentPlan;
    return (
        <div className={`border rounded-lg p-8 flex flex-col ${isCurrent ? 'border-dortmed-500 ring-2 ring-dortmed-500' : 'border-gray-300 dark:border-gray-700'}`}>
            {isCurrent && <div className="text-center font-bold text-dortmed-500 mb-2">Current Plan</div>}
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center">{plan.name}</h3>
            <div className="mt-4 text-center">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">${(plan.price_monthly / 10000).toFixed(2)}</span>
                <span className="text-base font-medium text-gray-500 dark:text-gray-400">/mo</span>
            </div>
            <ul className="mt-8 space-y-4 flex-grow">
                {plan.features.map(feature => (
                    <li key={feature} className="flex items-start">
                        <CheckIcon className="flex-shrink-0 w-6 h-6 text-green-500" />
                        <span className="ml-3 text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                ))}
            </ul>
            <div className="mt-8">
                <Button
                    onClick={() => onSubscribe(plan.plan_id)}
                    isLoading={isSubscribing}
                    disabled={isCurrent}
                    className="w-full">
                    {isCurrent ? 'Active Plan' : 'Choose Plan'}
                </Button>
            </div>
        </div>
    );
};

const SubscriptionPage = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchPlans = async () => {
            setLoading(true);
            try {
                // This service needs to be created in api.js
                const response = await paymentService.getPlans();
                setPlans(response.data);
            } catch (error) {
                toast.error("Could not load subscription plans.");
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleSubscribe = async (planId) => {
        setIsSubscribing(true);
        try {
            // This service needs to be created in api.js
            const response = await paymentService.initializePaystackPayment({ plan: planId, interval: 'monthly' });
            // Redirect user to Paystack's checkout page
            window.location.href = response.data.authorization_url;
        } catch (error) {
            toast.error(error.response?.data?.detail || "Could not start payment process.");
            setIsSubscribing(false);
        }
    };

    if (loading) return <p>Loading plans...</p>;

    return (
        <AnimatedWrapper>
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Our Pricing Plans</h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                    Choose the plan that's right for you and unlock advanced healthcare features.
                </p>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {plans.map(plan => (
                    <PlanCard
                        key={plan.plan_id}
                        plan={plan}
                        onSubscribe={handleSubscribe}
                        isSubscribing={isSubscribing}
                        currentPlan={user?.subscription?.plan}
                    />
                ))}
            </div>
        </AnimatedWrapper>
    );
};

export default SubscriptionPage;