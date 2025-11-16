import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { physicianService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Button from '../../components/common/Button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):(00|15|30|45)$/;

const DayScheduleEditor = ({ day, control, register, errors }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `schedule.${day}`
    });
    const { t } = useTranslation();

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white capitalize">{t(`schedule.days.${day}`)}</h3>
            <div className="mt-4 space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2">
                        <input
                            type="time"
                            step="900" // 15 minutes
                            className="input-base"
                            {...register(`schedule.${day}.${index}.start`, {
                                required: 'Start time is required',
                                pattern: { value: timeRegex, message: 'Use HH:MM format (15 min intervals)' }
                            })}
                        />
                        <span className="text-gray-500">-</span>
                        <input
                            type="time"
                            step="900" // 15 minutes
                            className="input-base"
                            {...register(`schedule.${day}.${index}.end`, {
                                required: 'End time is required',
                                pattern: { value: timeRegex, message: 'Use HH:MM format (15 min intervals)' }
                            })}
                        />
                        <button type="button" onClick={() => remove(index)}>
                            <TrashIcon className="w-5 h-5 text-danger hover:text-red-700" />
                        </button>
                    </div>
                ))}
                <Button type="button" variant="ghost" onClick={() => append({ start: '09:00', end: '17:00' })}>
                    <PlusIcon className="w-4 h-4 mr-2" /> {t('schedule.add_slot')}
                </Button>
                 {errors?.schedule?.[day] && <p className="text-danger text-sm mt-2">Please correct time errors for this day.</p>}
            </div>
        </div>
    );
};

const ScheduleManagement = () => {
    const { user, refreshUser } = useAuth();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { control, register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { schedule: {} }
    });

    useEffect(() => {
        setLoading(true);
        try {
            const scheduleStr = user.physician_profile?.availability_schedule;
            const schedule = scheduleStr ? JSON.parse(scheduleStr) : {};

            // Transform '09:00-17:00' into {start: '09:00', end: '17:00'} for the form
            const formReadySchedule = {};
            daysOfWeek.forEach(day => {
                formReadySchedule[day] = schedule[day]
                    ? schedule[day].map(slot => ({ start: slot.split('-')[0], end: slot.split('-')[1] }))
                    : [];
            });

            reset({ schedule: formReadySchedule });
        } catch (e) {
            console.error("Failed to parse schedule", e);
            toast.error("Could not load your current schedule.");
        } finally {
            setLoading(false);
        }
    }, [user, reset]);

    const onSubmit = async (data) => {
        setSaving(true);
        // Transform form data back into 'HH:MM-HH:MM' string format
        const apiReadySchedule = {};
        for (const day in data.schedule) {
            apiReadySchedule[day] = data.schedule[day]
                .filter(slot => slot.start && slot.end && slot.start < slot.end)
                .map(slot => `${slot.start}-${slot.end}`);
        }

        try {
            await physicianService.updateProfile({ availability_schedule: apiReadySchedule });
            await refreshUser(); // Fetch fresh user data to update context
            toast.success("Availability updated successfully!");
        } catch (error) {
            toast.error("Failed to save schedule.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p>Loading your schedule...</p>;

    return (
        <AnimatedWrapper>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('schedule.title')}</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('schedule.subtitle')}</p>
                    </div>
                    <Button type="submit" isLoading={saving}>{t('schedule.save_changes')}</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {daysOfWeek.map(day => (
                        <DayScheduleEditor key={day} day={day} control={control} register={register} errors={errors} />
                    ))}
                </div>
            </form>
        </AnimatedWrapper>
    );
};

export default ScheduleManagement;