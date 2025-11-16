import React from 'react';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import LegalLayout from '../../components/public/LegalLayout';

const TermsOfServicePage = () => {
    return (
        <AnimatedWrapper>
            <LegalLayout title="Terms of Service" effectiveDate="October 27, 2025">
                <h2>1. Agreement to Terms</h2>
                <p>By using the DortMed platform, you agree to be bound by these Terms of Service. If you do not agree to these Terms, do not use the service. DortMed is a platform to connect patients with healthcare providers and is not a substitute for professional medical advice, diagnosis, or treatment.</p>

                <h2>2. User Accounts</h2>
                <p>You must register for an account to access most features of the platform. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password.</p>

                <h2>3. Telemedicine Services</h2>
                <p>DortMed is not a healthcare provider. We provide a technology platform for you to connect with physicians. The physician is solely responsible for the quality and appropriateness of the care they render to you.</p>
                {/* ... Add more comprehensive, real legal text here ... */}
            </LegalLayout>
        </AnimatedWrapper>
    );
};

export default TermsOfServicePage;