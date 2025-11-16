import React from 'react';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import LegalLayout from '../../components/public/LegalLayout'; // Reusing our legal page layout
import { DocumentTextIcon, EyeIcon, PencilIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const HipaaNoticePage = () => {
    return (
        <AnimatedWrapper>
            <LegalLayout title="Notice of HIPAA Privacy Practices" effectiveDate="October 27, 2025">

                <h2 className="!text-dortmed-600 !dark:text-dortmed-400">THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW IT CAREFULLY.</h2>

                <h3>Our Commitment to Your Privacy</h3>
                <p>DortMed is dedicated to maintaining the privacy of your protected health information (PHI). PHI is information that may identify you and that relates to your past, present, or future physical or mental health or condition and related health care services. This Notice of Privacy Practices describes how we may use and disclose your PHI to carry out treatment, payment, or health care operations and for other purposes that are permitted or required by law.</p>

                <h3>Your Health Information Rights</h3>
                <p>You have the following rights regarding the PHI we maintain about you:</p>

                <div className="space-y-4 my-6">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <EyeIcon className="w-8 h-8 text-dortmed-500 flex-shrink-0 mt-1"/>
                        <div>
                            <h4 className="font-bold">Right to Inspect and Copy</h4>
                            <p>You have the right to inspect and copy your PHI. You can access most of this information directly through your secure Patient Portal.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <PencilIcon className="w-8 h-8 text-dortmed-500 flex-shrink-0 mt-1"/>
                        <div>
                            <h4 className="font-bold">Right to Amend</h4>
                            <p>If you feel that the PHI we have about you is incorrect or incomplete, you may ask us to amend the information. You can update much of your medical history directly in your profile.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <DocumentTextIcon className="w-8 h-8 text-dortmed-500 flex-shrink-0 mt-1"/>
                        <div>
                            <h4 className="font-bold">Right to an Accounting of Disclosures</h4>
                            <p>You have the right to request a list of certain disclosures we have made of your PHI.</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <ShieldCheckIcon className="w-8 h-8 text-dortmed-500 flex-shrink-0 mt-1"/>
                        <div>
                            <h4 className="font-bold">Right to Request Restrictions</h4>
                            <p>You have the right to request a restriction or limitation on the PHI we use or disclose for treatment, payment, or health care operations.</p>
                        </div>
                    </div>
                </div>

                <h3>How We May Use and Disclose Your PHI</h3>
                <p>The following are examples of the types of uses and disclosures of your PHI that are permitted by HIPAA:</p>
                <ul>
                    <li><strong>Treatment:</strong> We will use and disclose your PHI to provide, coordinate, or manage your health care. For example, your PHI will be shared with the physician you are consulting with through our platform.</li>
                    <li><strong>Payment:</strong> Your PHI will be used, as needed, to obtain payment for your health care services.</li>
                    <li><strong>Healthcare Operations:</strong> We may use or disclose your PHI for our own healthcare operations in order to run our platform and make sure that all of our users receive quality service.</li>
                </ul>

                <h3>Changes to This Notice</h3>
                <p>We reserve the right to change this notice. We will make the revised notice available upon request and post it on our website.</p>

                <h3>Complaints</h3>
                <p>If you believe your privacy rights have been violated, you may file a complaint with us by contacting our Privacy Officer at <a href="mailto:privacy@dortmed.com">privacy@dortmed.com</a> or with the Secretary of the Department of Health and Human Services. We will not retaliate against you for filing a complaint.</p>
            </LegalLayout>
        </AnimatedWrapper>
    );
};

export default HipaaNoticePage;