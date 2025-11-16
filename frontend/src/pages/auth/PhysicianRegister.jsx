import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';

const schema = yup.object().shape({
    email: yup.string().email('Invalid email format').required('Email is required'),
    password: yup.string().min(8).required('Password is required'),
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    specialty: yup.string().required('Specialty is required'),
    medicalLicenseNumber: yup.string().required('Medical license number is required'),
});

const PhysicianRegister = () => {
    const { register: authRegister, loading } = useAuth();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data) => {
        const registrationData = {
            user: {
                email: data.email,
                password: data.password,
                role: 'physician',
            },
            profile: {
                first_name: data.firstName,
                last_name: data.lastName,
                specialty: data.specialty,
                medical_license_number: data.medicalLicenseNumber,
            }
        };
        try {
            await authRegister('physician', registrationData);
            navigate('/login');
        } catch (error) {
            // Error is handled by toast
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <AnimatedWrapper className="sm:mx-auto sm:w-full sm:max-w-lg">
                <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">Apply to Join as a Physician</h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Your application will be reviewed by our team. You will be notified upon approval.
                </p>
                <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="First Name" name="firstName" {...register('firstName')} error={errors.firstName}/>
                            <Input label="Last Name" name="lastName" {...register('lastName')} error={errors.lastName}/>
                        </div>
                        <Input label="Specialty (e.g., Cardiology)" name="specialty" {...register('specialty')} error={errors.specialty}/>
                        <Input label="Medical License Number" name="medicalLicenseNumber" {...register('medicalLicenseNumber')} error={errors.medicalLicenseNumber}/>
                        <hr className="dark:border-gray-600"/>
                        <Input label="Email Address" name="email" type="email" {...register('email')} error={errors.email}/>
                        <Input label="Password" name="password" type="password" {...register('password')} error={errors.password}/>
                        <div>
                            <Button type="submit" isLoading={loading} className="w-full">Submit Application</Button>
                        </div>
                    </form>
                </div>
            </AnimatedWrapper>
        </div>
    );
};

export default PhysicianRegister;