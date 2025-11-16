import React, { useState } from 'react'; // Corrected Import
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { aiService } from '../../services/api';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { PlusIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

const InteractionResultCard = ({ result }) => {
    const severityColors = { 'Severe': 'border-red-500 bg-red-50 dark:bg-red-900/30', 'Moderate': 'border-amber-500 bg-amber-50 dark:bg-amber-900/30', 'Mild': 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' };
    return (
        <div className={`p-4 rounded-lg border-l-4 ${severityColors[result.severity]}`}>
            <h3 className="font-bold">{result.pair.join(' + ')}</h3>
            <p className="font-semibold text-sm">{result.severity} Interaction</p>
            <p className="mt-2 text-sm">{result.description}</p>
        </div>
    );
};

const DrugInteractionPage = () => {
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { control, register, handleSubmit } = useForm({ defaultValues: { medications: [{ name: "" }, { name: "" }] } });
    const { fields, append, remove } = useFieldArray({ control, name: "medications" });

    const onSubmit = async (data) => {
        setIsLoading(true);
        setResults([]);
        const medNames = data.medications.map(m => m.name).filter(Boolean);
        if (medNames.length < 2) { toast.error("Please enter at least two medications to check."); setIsLoading(false); return; }
        try {
            const response = await aiService.checkDrugInteractions({ medications: medNames });
            setResults(response.data);
            if(response.data.length === 0) { toast.success("No significant interactions found."); }
        } catch (error) { toast.error("Failed to check for interactions."); } finally { setIsLoading(false); }
    };

    return (
        <AnimatedWrapper>
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-center">Drug Interaction Checker</h1>
                <div className="p-4 mt-4 bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-400 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0"><ExclamationTriangleIcon className="h-5 w-5 text-amber-400" /></div>
                        <div className="ml-3"><p className="text-sm text-amber-700 dark:text-amber-200">This tool is for informational purposes only. Consult a qualified healthcare professional before making any medical decisions.</p></div>
                    </div>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center space-x-2">
                            <Input placeholder={`Medication ${index + 1}`} {...register(`medications.${index}.name`)} className="flex-grow"/>
                            {fields.length > 2 && <button type="button" onClick={() => remove(index)}><TrashIcon className="w-5 h-5 text-danger"/></button>}
                        </div>
                    ))}
                    <Button type="button" variant="ghost" onClick={() => append({ name: "" })}><PlusIcon className="w-4 h-4 mr-2"/> Add another medication</Button>
                    <Button type="submit" isLoading={isLoading} className="w-full">Check Interactions</Button>
                </form>
                {results.length > 0 && (
                    <div className="mt-8 space-y-4">
                        <h2 className="text-2xl font-bold">Interaction Results</h2>
                        {results.map((res, i) => <InteractionResultCard key={i} result={res}/>)}
                    </div>
                )}
            </div>
        </AnimatedWrapper>
    );
};
export default DrugInteractionPage;