import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { settingsService } from '../../services/api';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ShieldCheckIcon, KeyIcon } from '@heroicons/react/24/outline';

// Password Change Component
const passwordSchema = yup.object().shape({
    current_password: yup.string().required("Current password is required"),
    new_password: yup.string().min(8).required("New password is required"),
    confirm_new_password: yup.string().oneOf([yup.ref('new_password'), null], 'Passwords must match'),
});

const ChangePassword = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm({ resolver: yupResolver(passwordSchema) });
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await settingsService.changePassword({
                current_password: data.current_password,
                new_password: data.new_password,
            });
            toast.success("Password changed successfully!");
            reset();
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to change password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
            <Input label="Current Password" name="current_password" type="password" {...register('current_password')} error={errors.current_password}/>
            <Input label="New Password" name="new_password" type="password" {...register('new_password')} error={errors.new_password}/>
            <Input label="Confirm New Password" name="confirm_new_password" type="password" {...register('confirm_new_password')} error={errors.confirm_new_password}/>
            <Button type="submit" isLoading={isLoading}>Update Password</Button>
        </form>
    );
};

// Two-Factor Authentication Component
const TwoFactorAuth = () => {
    const { user, refreshUser } = useAuth();
    const [setupInfo, setSetupInfo] = useState(null);
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSetup = async () => {
        setIsLoading(true);
        try {
            const response = await settingsService.setup2FA();
            setSetupInfo(response.data);
        } catch (error) {
            toast.error("Could not start 2FA setup.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnable = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await settingsService.enable2FA({ otp });
            toast.success("2FA enabled successfully!");
            await refreshUser();
            setSetupInfo(null);
            setOtp("");
        } catch (error) {
            toast.error(error.response?.data?.detail || "Failed to enable 2FA.");
            setSetupInfo(null); // Reset on failure
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisable = async () => {
        // For security, prompt for password before disabling
        const password = prompt("Please enter your password to disable 2FA.");
        if(password) {
            setIsLoading(true);
            try {
                await settingsService.disable2FA({ password });
                toast.success("2FA has been disabled.");
                await refreshUser();
            } catch (error) {
                toast.error(error.response?.data?.detail || "Failed to disable 2FA.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    if (user?.is_tfa_enabled) {
        return (
            <div>
                <div className="flex items-center space-x-2">
                     <ShieldCheckIcon className="w-6 h-6 text-success" />
                     <p className="font-semibold text-gray-800 dark:text-gray-200">Two-Factor Authentication is Active</p>
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Your account is secured with an authenticator app.</p>
                <Button variant="danger" className="mt-4" onClick={handleDisable} isLoading={isLoading}>Disable 2FA</Button>
            </div>
        );
    }

    if (setupInfo) {
         return (
             <div className="max-w-md space-y-4">
                 <h3 className="text-lg font-semibold">Step 1: Scan QR Code</h3>
                 <p>Scan the image below with your authenticator app (e.g., Google Authenticator, Authy).</p>
                 <img src={setupInfo.qr_code} alt="2FA QR Code" className="border-4 border-white rounded-lg"/>
                 <p>If you cannot scan the code, manually enter this secret:</p>
                 <code className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md font-mono">{setupInfo.secret}</code>
                 <form onSubmit={handleEnable} className="space-y-4 pt-4">
                      <h3 className="text-lg font-semibold">Step 2: Verify OTP</h3>
                      <Input label="Enter the 6-digit code from your app" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" />
                      <Button type="submit" isLoading={isLoading}>Enable 2FA</Button>
                 </form>
             </div>
         )
    }

    return (
        <div>
            <p className="text-gray-600 dark:text-gray-400">Add an extra layer of security to your account.</p>
            <Button onClick={handleSetup} isLoading={isLoading} className="mt-4">Setup 2FA</Button>
        </div>
    );
};


const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('password');

    const renderContent = () => {
        switch(activeTab) {
            case 'password': return <ChangePassword />;
            case '2fa': return <TwoFactorAuth />;
            default: return null;
        }
    };

    return (
        <AnimatedWrapper>
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
                <div className="mt-8 border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => setActiveTab('password')} className={`tab-button ${activeTab === 'password' ? 'tab-active' : ''}`}>
                            <KeyIcon className="w-5 h-5 mr-2" /> Password
                        </button>
                        <button onClick={() => setActiveTab('2fa')} className={`tab-button ${activeTab === '2fa' ? 'tab-active' : ''}`}>
                            <ShieldCheckIcon className="w-5 h-5 mr-2" /> Two-Factor Auth
                        </button>
                    </nav>
                </div>
                <div className="mt-8">
                    {renderContent()}
                </div>
            </div>
        </AnimatedWrapper>
    );
};
export default SettingsPage;