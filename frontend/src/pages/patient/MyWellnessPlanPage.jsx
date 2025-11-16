import React, { useState, useEffect } from 'react';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import { BeakerIcon, HeartIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { aiService } from '../../services/api';
import toast from 'react-hot-toast';

// Reusable component for a loading skeleton
const SkeletonLoader = ({ className }) => (
    <div className={`space-y-4 animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
        </div>
    </div>
);


const MyWellnessPlanPage = () => {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlan = async () => {
            setLoading(true);
            try {
                // This single API call fetches the entire personalized wellness plan
                const response = await aiService.getWellnessPlan();
                setPlan(response.data);
            } catch (error) {
                console.error("Error fetching wellness plan:", error);
                toast.error("Could not load your personalized wellness plan at this time.");
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, []);

    return (
        <AnimatedWrapper>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Wellness Plan</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Your AI-powered path to better health, personalized for you based on your profile.</p>

            {loading ? (
                // Display skeleton loaders while fetching data
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"><SkeletonLoader /></div>
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"><SkeletonLoader /></div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"><SkeletonLoader /></div>
                    </div>
                </div>
            ) : !plan ? (
                // Display an error/empty state if the plan couldn't be generated
                <div className="mt-8 text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold">Could not generate a wellness plan.</h2>
                    <p className="mt-2 text-gray-500">This can happen if your medical profile is not complete or if there is no specific plan available for your condition. Please ensure your medical history is up to date.</p>
                </div>
            ) : (
                // Display the fully-loaded wellness plan
                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Meal Plan Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold flex items-center gap-3">
                            <SparklesIcon className="w-6 h-6 text-dortmed-500"/> Personalized Meal Plan
                        </h2>
                        {plan.meal_plan ? (
                            <>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Recommended for: <strong>{plan.meal_plan.condition}</strong> | Target: <strong>{plan.meal_plan.daily_calorie_target} kcal/day</strong>
                                </p>
                                <div className="mt-4 space-y-4">
                                    {Object.entries(plan.meal_plan.meals).map(([meal, items]) => (
                                        <div key={meal}>
                                            <h4 className="font-bold capitalize text-gray-800 dark:text-gray-200">{meal.replace('_', ' ')}</h4>
                                            <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300">
                                                {items.map(item => <li key={item}>{item}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="mt-4 text-gray-500">No specific meal plan was generated based on your current profile.</p>
                        )}
                    </div>

                    {/* Exercise & Supplements Section */}
                    <div className="space-y-8">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-semibold flex items-center gap-3">
                                <HeartIcon className="w-6 h-6 text-dortmed-500"/> Customized Exercise Regimen
                            </h2>
                            <ul className="mt-4 divide-y dark:divide-gray-700">
                                {plan.exercise_plan.length > 0 ? plan.exercise_plan.map(ex => (
                                    <li key={ex.name} className="py-3">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{ex.name}</p>
                                            <span className="text-sm font-mono p-1 bg-gray-100 dark:bg-gray-700 rounded">
                                                {ex.recommended_sets} of {ex.recommended_reps}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{ex.description}</p>
                                        {ex.video_url && <a href={ex.video_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-dortmed-600 hover:underline">Watch Demo &rarr;</a>}
                                    </li>
                                )) : <p className="mt-4 text-gray-500">No specific exercises are recommended at this time.</p>}
                            </ul>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <h2 className="text-2xl font-semibold flex items-center gap-3">
                                <BeakerIcon className="w-6 h-6 text-dortmed-500"/> Supplement Recommendations
                            </h2>
                            <ul className="mt-4 divide-y dark:divide-gray-700">
                                {plan.supplement_recommendations.length > 0 ? plan.supplement_recommendations.map(sup => (
                                    <li key={sup.name} className="py-3">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{sup.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1"><strong>Reason:</strong> {sup.reasoning}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sup.description}</p>
                                    </li>
                                )) : <p className="mt-4 text-gray-500">No specific supplements are recommended based on your current profile.</p>}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </AnimatedWrapper>
    );
};

export default MyWellnessPlanPage;