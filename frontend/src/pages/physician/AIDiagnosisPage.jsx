import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { aiService } from '../../services/api';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Button from '../../components/common/Button';
import { LightBulbIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const schema = yup.object().shape({
  symptoms: yup.string().required('Symptoms are required to make a suggestion.').min(20, 'Please provide more detailed symptoms.'),
  medical_history: yup.string(),
});

const SuggestionCard = ({ suggestion }) => {
    const confidenceColor = suggestion.confidence_score > 0.85
        ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
        : suggestion.confidence_score > 0.7
        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
        : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-dortmed-500">
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{suggestion.condition}</h3>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${confidenceColor}`}>
                    {(suggestion.confidence_score * 100).toFixed(1)}% Confidence
                </span>
            </div>
            <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
                <p className="font-semibold">Explanation:</p>
                <p>{suggestion.explanation}</p>
                <p className="font-semibold mt-4">Recommended Actions:</p>
                <ul className="list-disc pl-5">
                    {suggestion.recommended_actions.map(action => <li key={action}>{action}</li>)}
                </ul>
            </div>
        </div>
    );
};

const AIDiagnosisPage = () => {
    const { t } = useTranslation();
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        setSuggestions([]);
        try {
            const response = await aiService.getDiagnosisSuggestion(data);
            if(response.data && response.data.length > 0) {
                 setSuggestions(response.data);
                 toast.success("AI suggestions generated successfully.");
            } else {
                 toast('No specific suggestions could be generated from the provided data.', { icon: 'ℹ️' });
            }
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to get AI suggestions.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatedWrapper>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <LightBulbIcon className="w-12 h-12 text-dortmed-500 mx-auto"/>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">AI Diagnosis Support</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Enter patient information to receive AI-powered diagnostic suggestions.
                    </p>
                </div>

                {/* Disclaimer */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-400 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-amber-700 dark:text-amber-200">
                                This is a clinical decision support tool and not a substitute for professional medical judgment. All suggestions must be verified by a qualified physician.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Input Form */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                     <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label htmlFor="symptoms" className="block text-lg font-semibold text-gray-700 dark:text-gray-300">Patient Symptoms</label>
                            <p className="text-sm text-gray-500 mb-2">Describe the patient's primary complaints in detail. Include onset, duration, and character of symptoms.</p>
                            <textarea
                                id="symptoms"
                                rows="6"
                                className={`input-base ${errors.symptoms ? 'border-danger' : ''}`}
                                {...register('symptoms')}
                                placeholder="e.g., Patient reports a persistent dry cough for the last 5 days, accompanied by a fever of 38.5°C and shortness of breath upon mild exertion..."
                            />
                            {errors.symptoms && <p className="text-danger text-sm mt-1">{errors.symptoms.message}</p>}
                        </div>
                        <div>
                           <label htmlFor="medical_history" className="block text-lg font-semibold text-gray-700 dark:text-gray-300">Relevant Medical History & Context</label>
                           <p className="text-sm text-gray-500 mb-2">Include past diagnoses, chronic conditions, current medications, or relevant lifestyle factors.</p>
                            <textarea
                                id="medical_history"
                                rows="4"
                                className="input-base"
                                {...register('medical_history')}
                                placeholder="e.g., History of asthma, non-smoker, currently taking Ventolin as needed. No recent travel."
                            />
                        </div>
                        <div>
                             <Button type="submit" isLoading={isLoading} className="w-full text-lg py-3">
                                Generate Suggestions
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Results Section */}
                {suggestions.length > 0 && (
                     <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Diagnostic Suggestions</h2>
                        {suggestions.map((s, index) => <SuggestionCard key={index} suggestion={s} />)}
                    </div>
                )}
            </div>
        </AnimatedWrapper>
    );
};

export default AIDiagnosisPage;