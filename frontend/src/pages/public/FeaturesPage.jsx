import React from 'react';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import {
    UserIcon, BriefcaseIcon, CpuChipIcon,
    ClipboardDocumentListIcon, LightBulbIcon, HeartIcon, CalendarDaysIcon
} from '@heroicons/react/24/solid';
import Button from '../../components/common/Button';
const FeatureCard = ({ icon, title, description }) => (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-dortmed-100 dark:bg-dortmed-900">
            {React.createElement(icon, { className: "h-8 w-8 text-dortmed-600 dark:text-dortmed-400" })}
        </div>
        <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">{description}</p>
    </div>
);

const FeaturesPage = () => {
    const patientFeatures = [
        { icon: ClipboardDocumentListIcon, title: "Unified Medical Records", description: "Consolidate your entire health history—prescriptions, lab results, and more—in one secure, accessible location." },
        { icon: LightBulbIcon, title: "AI-Driven Health Insights", description: "Receive personalized alerts, risk assessments, and wellness tips powered by our advanced AI engine." },
        { icon: HeartIcon, title: "Personalized Wellness Plans", description: "Get custom-tailored meal plans, exercise regimens, and supplement recommendations based on your unique health profile." },
    ];
    const physicianFeatures = [
        { icon: UserIcon, title: "Streamlined Patient Management", description: "Access comprehensive patient profiles, clinical notes, and communication history in an intuitive dashboard." },
        { icon: CpuChipIcon, title: "AI-Assisted Diagnostics", description: "Enhance your clinical decisions with AI-powered diagnostic suggestions, risk analysis, and drug interaction checking." },
        { icon: CalendarDaysIcon, title: "Effortless Scheduling", description: "Manage your availability with our flexible calendar, reducing administrative overhead and maximizing consultation time." },
    ];

    return (
        <AnimatedWrapper>
            <div className="py-20 bg-gray-50 dark:bg-gray-800">
                <div className="container mx-auto px-6">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">A New Standard in Digital Health</h1>
                        <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                            Discover the powerful suite of tools DortMed offers to patients, physicians, and businesses for a truly integrated healthcare experience.
                        </p>
                    </div>

                    {/* Features for Patients */}
                    <div className="mt-20">
                        <h2 className="text-3xl font-bold text-center flex items-center justify-center gap-3">
                            <UserIcon className="w-8 h-8 text-dortmed-500" />
                            For Patients
                        </h2>
                        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {patientFeatures.map(f => <FeatureCard key={f.title} {...f} />)}
                        </div>
                    </div>

                    {/* Features for Physicians */}
                    <div className="mt-20">
                         <h2 className="text-3xl font-bold text-center flex items-center justify-center gap-3">
                            <BriefcaseIcon className="w-8 h-8 text-dortmed-500" />
                            For Physicians
                        </h2>
                        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {physicianFeatures.map(f => <FeatureCard key={f.title} {...f} />)}
                        </div>
                    </div>

                    {/* AI in Action Section */}
                     <div className="mt-20 text-center bg-dortmed-600 text-white p-12 rounded-2xl">
                        <h2 className="text-3xl font-bold">AI in Action</h2>
                        <p className="mt-4 max-w-2xl mx-auto">See how our intelligent engine is transforming diagnostic accuracy and personalizing care. Watch our interactive demo to learn more.</p>
                        <Button variant="secondary" className="mt-8 px-8 py-3 text-lg">Watch Demo</Button>
                    </div>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default FeaturesPage;