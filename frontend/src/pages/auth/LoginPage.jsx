import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});

const LoginPage = () => {
    const { t } = useTranslation();
    const { loginWithFirebaseAndVerify, loading, isAuthenticated, user } = useAuth(); // We'll need a new function in AuthContext
    const navigate = useNavigate();
    const location = useLocation();

    // State to manage which form to show: 'credentials' or 'tfa'
    const [formStep, setFormStep] = useState('credentials');

    // State to hold OTP value
    const [otp, setOtp] = useState("");

    const { register, handleSubmit, formState: { errors }, getValues } = useForm({
        resolver: yupResolver(schema)
    });

    // Step 1: Handle email and password submission
    const onCredentialsSubmit = async (data) => {
        try {
            // This new function will handle both Firebase login and the subsequent backend check
            await loginWithFirebaseAndVerify(data.email, data.password);
            // If this succeeds without throwing, 2FA was not required, and onAuthStateChanged will handle redirection.
        } catch (error) {
            // Check for the specific 2FA error from our backend
            if (error.response?.data?.detail === "2FA_REQUIRED") {
                // The user's password was correct. Move to the next step.
                setFormStep('tfa');
            }
            // Other errors (e.g., wrong password) are handled by toasts in AuthContext
        }
    };

    // Step 2: Handle OTP submission
    const onTfaSubmit = async (e) => {
        e.preventDefault();
        const credentials = getValues(); // Get email/password from the first form
        try {
            // Call the same function again, but this time provide the OTP
            await loginWithFirebaseAndVerify(credentials.email, credentials.password, otp);
            // Success! onAuthStateChanged will now handle redirection.
        } catch (error) {
            // Error toast (e.g., "Invalid 2FA code") will be shown from AuthContext
            console.error("2FA Login failed:", error);
        }
    };

    // Effect to redirect the user once our backend profile is successfully loaded
    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'patient') navigate('/patient');
            else if (user.role === 'physician') navigate('/physician');
            else if (user.role === 'superuser') navigate('/admin');
            else navigate('/welcome');
        }
    }, [isAuthenticated, user, navigate]);


    // --- Conditional Rendering Logic ---

    if (formStep === 'tfa') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <AnimatedWrapper className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="text-center">
                        <ShieldCheckIcon className="mx-auto h-12 w-auto text-dortmed-600" />
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                            Two-Factor Authentication
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                            Enter the 6-digit code from your authenticator app to continue.
                        </p>
                    </div>

                    <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <form className="space-y-6" onSubmit={onTfaSubmit}>
                            <Input
                                label="Authentication Code"
                                name="otp"
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                maxLength="6"
                                autoComplete="one-time-code"
                            />
                            <div>
                                <Button type="submit" isLoading={loading} className="w-full">
                                    Verify & Sign In
                                </Button>
                            </div>
                             <div className="text-center">
                                <button type="button" onClick={() => setFormStep('credentials')} className="text-sm font-medium text-dortmed-600 hover:underline">
                                    Back to login
                                </button>
                            </div>
                        </form>
                    </div>
                </AnimatedWrapper>
            </div>
        );
    }

    // Default form: 'credentials'
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <AnimatedWrapper className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    {t('login.title')}
                </h2>
                {location.state?.message && <p className="mt-2 text-center text-sm text-green-600">{location.state.message}</p>}
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    {t('login.or')} {' '}
                    <Link to="/register" className="font-medium text-dortmed-600 hover:text-dortmed-500">
                        {t('login.create_account')}
                    </Link>
                </p>

                <div className="mt-8 bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit(onCredentialsSubmit)}>
                        <Input label={t('form.email')} name="email" type="email" autoComplete="email" error={errors.email} {...register('email')} />
                        <Input label={t('form.password')} name="password" type="password" autoComplete="current-password" error={errors.password} {...register('password')} />
                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <Link to="/forgot-password" className="font-medium text-dortmed-600 hover:text-dortmed-500">
                                    {t('login.forgot_password')}
                                </Link>
                            </div>
                        </div>
                        <div>
                            <Button type="submit" isLoading={loading} className="w-full">
                                {t('login.submit')}
                            </Button>
                        </div>
                    </form>
                </div>
            </AnimatedWrapper>
        </div>
    );
};

export default LoginPage;