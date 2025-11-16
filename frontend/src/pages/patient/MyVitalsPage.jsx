import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { patientService } from '../../services/api';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const MyVitalsPage = () => {
    const { register, handleSubmit, reset } = useForm();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await patientService.recordVital({
                vital_type: data.vital_type,
                value: parseFloat(data.value)
            });
            toast.success("Vital sign recorded successfully!");
            reset();
        } catch (error) {
            toast.error("Failed to record vital sign.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatedWrapper>
            <h1 className="text-3xl font-bold">Record a New Vital Sign</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manually enter your health measurements to track your progress over time.
            </p>
            <div className="mt-8 max-w-lg bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium">Vital Type</label>
                        <select {...register('vital_type')} className="input-base mt-1">
                            <option value="systolic_bp">Systolic Blood Pressure (mmHg)</option>
                            <option value="diastolic_bp">Diastolic Blood Pressure (mmHg)</option>
                            <option value="blood_glucose">Blood Glucose (mg/dL)</option>
                            <option value="weight">Weight (kg)</option>
                            <option value="heart_rate">Heart Rate (bpm)</option>
                        </select>
                    </div>
                    <Input
                        label="Value"
                        type="number"
                        step="0.1"
                        {...register('value', { required: true })}
                    />
                    <Button type="submit" isLoading={isLoading} className="w-full">Save Measurement</Button>
                </form>
            </div>
        </AnimatedWrapper>
    );
};

export default MyVitalsPage;