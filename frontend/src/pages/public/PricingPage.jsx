import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Button from '../../components/common/Button';
import { paymentService } from '../../services/api';
import toast from 'react-hot-toast';

// Define the static feature set for each plan. This is UI-level configuration.
const planFeatureDisplay = {
    freemium: {
        name: 'Freemium',
        features: {
            "Secure Record Storage": true,
            "Basic Health Tips": true,
            "Appointment Booking": true,
            "Telemedicine Consultations": "1/month",
            "AI Diagnosis Support": false,
            "Personalized Wellness Plans": false,
            "Priority Support": false
        }
    },
    basic: {
        name: 'Basic',
        features: {
            "Secure Record Storage": true,
            "Basic Health Tips": true,
            "Appointment Booking": true,
            "Telemedicine Consultations": "5/month",
            "AI Diagnosis Support": "Basic",
            "Personalized Wellness Plans": false,
            "Priority Support": false
        }
    },
    premium: {
        name: 'Premium',
        features: {
            "Secure Record Storage": true,
            "Basic Health Tips": true,
            "Appointment Booking": true,
            "Telemedicine Consultations": "Unlimited",
            "AI Diagnosis Support": "Advanced",
            "Personalized Wellness Plans": true,
            "Priority Support": true
        }
    },
    ultimate: {
        name: 'Ultimate',
        features: {
            "Secure Record Storage": true,
            "Basic Health Tips": true,
            "Appointment Booking": true,
            "Telemedicine Consultations": "Unlimited",
            "AI Diagnosis Support": "Advanced",
            "Personalized Wellness Plans": true,
            "Priority Support": "Dedicated Manager"
        }
    }
};

// A Skeleton component for loading state
const PlanSkeleton = () => (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
        <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mx-auto mt-4"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full mt-6"></div>
        <div className="mt-8 space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
    </div>
);

const PricingPage = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            setLoading(true);
            try {
                // Fetch the dynamic data (prices, plan_id) from the backend
                const response = await paymentService.getPlans();
                const apiPlans = response.data;

                // Create a map of the API plans for easy lookup
                const apiPlansMap = new Map(apiPlans.map(p => [p.plan_id, p]));

                // Combine the static feature data with the dynamic price data
                const combinedPlans = Object.entries(planFeatureDisplay).map(([key, staticPlanData]) => {
                    const apiPlanData = apiPlansMap.get(key);
                    return {
                        id: key,
                        name: staticPlanData.name,
                        // Use API price if available, otherwise default to 0 for Freemium
                        price: apiPlanData ? apiPlanData.price_monthly : 0,
                        features: staticPlanData.features,
                    };
                });

                setPlans(combinedPlans);
            } catch (error) {
                console.error("Error fetching pricing plans:", error);
                toast.error("Could not load pricing plans. Please try again later.");
                // In case of an error, we can still show the plans with default prices
                const errorStatePlans = Object.entries(planFeatureDisplay).map(([key, staticPlanData]) => ({
                     id: key, ...staticPlanData, price: 0
                }));
                setPlans(errorStatePlans);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    return (
        <AnimatedWrapper>
            <div className="py-20 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-6">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Transparent and Flexible Pricing</h1>
                        <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                            Choose the perfect plan to begin your journey to better, more intelligent healthcare.
                        </p>
                    </div>

                    <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {loading ? (
                            <>
                                <PlanSkeleton />
                                <PlanSkeleton />
                                <PlanSkeleton />
                                <PlanSkeleton />
                            </>
                        ) : (
                            plans.map(plan => (
                                <div key={plan.id} className={`border rounded-lg p-8 flex flex-col ${plan.name === 'Premium' ? 'border-dortmed-500 ring-2 ring-dortmed-500' : 'border-gray-200 dark:border-gray-700'}`}>
                                    <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white">{plan.name}</h3>
                                    <div className="mt-4 text-center">
                                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                                            ${plan.price === 0 ? '0' : (plan.price / 100).toFixed(2)}
                                        </span>
                                        <span className="text-base font-medium text-gray-500 dark:text-gray-400">/mo</span>
                                    </div>
                                    <Link to="/register" className="w-full mt-6">
                                        <Button className="w-full">{plan.name === 'Freemium' ? 'Get Started' : 'Choose Plan'}</Button>
                                    </Link>
                                    <ul className="mt-8 space-y-4 text-sm text-gray-600 dark:text-gray-300">
                                        {Object.entries(plan.features).map(([feature, value]) => (
                                            <li key={feature} className="flex items-start">
                                                {value === true ? <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                : value === false ? <XMarkIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                                : <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />}
                                                <span className="ml-3">
                                                    {feature}{typeof value !== 'boolean' && `: `}
                                                    {typeof value !== 'boolean' && <strong className="text-gray-800 dark:text-gray-100">{value}</strong>}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default PricingPage;