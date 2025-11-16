import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { appointmentService } from '../../services/api';
import Button from '../common/Button';
import Input from '../common/Input';

const RescheduleModal = ({ appointment, isOpen, onClose, onRescheduleSuccess }) => {
    const { register, handleSubmit } = useForm();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await appointmentService.reschedule(appointment.id, data.new_time);
            toast.success("Appointment rescheduled successfully!");
            onRescheduleSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Could not reschedule appointment.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md m-4">
                <h2 className="text-2xl font-bold mb-4">Reschedule Appointment</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Current time: {new Date(appointment.appointment_time).toLocaleString()}
                </p>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                     <Input
                        label="Select New Date and Time"
                        type="datetime-local"
                        name="new_time"
                        {...register('new_time', { required: true })}
                     />
                    <div className="flex justify-end space-x-4 mt-6">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" isLoading={isLoading}>Confirm New Time</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default RescheduleModal;