import React from 'react';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import LegalLayout from '../../components/public/LegalLayout';
const PrivacyPolicyPage = () => {
return (
<AnimatedWrapper>
<LegalLayout title="Privacy Policy" effectiveDate="October 27, 2025">
<h2>1. Introduction</h2>
<p>Welcome to DortMed. We are committed to protecting your privacy and handling your personal health information with the utmost care and security. This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you use our platform.</p>

<h2>2. Information We Collect</h2>
            <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
            <ul>
                <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information, such as your age, gender, hometown, and interests, that you voluntarily give to us when you register with the Site.</li>
                <li><strong>Protected Health Information (PHI):</strong> Medical history, conditions, treatments, lab results, and other health-related data you provide or upload to the platform. All PHI is handled in compliance with HIPAA regulations.</li>
            </ul>

            <h2>3. Use of Your Information</h2>
            <p>Having accurate information permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to...</p>
            {/* ... Add more comprehensive, real legal text here ... */}
        </LegalLayout>
    </AnimatedWrapper>
);

};
export default PrivacyPolicyPage;