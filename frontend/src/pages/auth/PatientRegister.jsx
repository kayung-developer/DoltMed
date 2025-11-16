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
    password: yup.string().min(8, 'Password must be at least 8 characters').matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/,
        'Password must contain an uppercase letter, a lowercase letter, a number, and a special character.'
    ).required('Password is required'),
    confirmPassword: yup.string().oneOf([yup.ref('password'), null], 'Passwords must match'),
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    dateOfBirth: yup.date().required('Date of birth is required').max(new Date(), "Date of birth cannot be in the future"),
});

const PatientRegister = () => {
    const { registerAndSetupProfile, loading } = useAuth(); // Use the new function
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data) => {
        const userData = { email: data.email, password: data.password };
        const profileData = {
            first_name: data.firstName,
            last_name: data.lastName,
            date_of_birth: data.dateOfBirth,
        };

        try {
            // Call the new, consolidated registration function
            await registerAndSetupProfile('patient', profileData, userData);
            // On success, guide the user to check their email instead of logging in
            navigate('/login', { state: { message: "Registration successful! Please verify your email before logging in." } });
        } catch (error) {
            // Errors are handled by toast in AuthContext
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <AnimatedWrapper className="sm:mx-auto sm:w-full sm:max-w-lg">
                <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">Create Patient Account</h2>
                <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input label="First Name" name="firstName" {...register('firstName')} error={errors.firstName}/>
                            <Input label="Last Name" name="lastName" {...register('lastName')} error={errors.lastName}/>
                        </div>
                        <Input label="Date of Birth" name="dateOfBirth" type="date" {...register('dateOfBirth')} error={errors.dateOfBirth}/>
                        <hr className="dark:border-gray-600"/>
                        <Input label="Email Address" name="email" type="email" {...register('email')} error={errors.email}/>
                        <Input label="Password" name="password" type="password" {...register('password')} error={errors.password}/>
                        <Input label="Confirm Password" name="confirmPassword" type="password" {...register('confirmPassword')} error={errors.confirmPassword}/>
                        <div>
                            <Button type="submit" isLoading={loading} className="w-full">Create Account</Button>
                        </div>
                    </form>
                </div>
            </AnimatedWrapper>
        </div>
    );
};

export default PatientRegister;