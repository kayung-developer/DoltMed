import React, { useState } from 'react';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import { PhoneIcon, EnvelopeIcon, ChatBubbleBottomCenterTextIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

const faqData = [
    { q: "How do I book an appointment?", a: "Navigate to the 'Find a Doctor' section in your patient dashboard. You can search for physicians by specialty and location, view their availability, and book a time slot that works for you." },
    { q: "Is my medical data secure?", a: "Absolutely. We use enterprise-grade encryption for all data at rest and in transit. Our platform is designed to be HIPAA compliant, ensuring your sensitive health information is protected." },
    { q: "How does the AI diagnosis work?", a: "Our AI Diagnosis Support tool analyzes the symptoms and medical history you provide against a vast database of medical knowledge. It suggests potential conditions to your physician to aid in their decision-making process. It is a support tool and not a final diagnosis." },
    { q: "Can I cancel my subscription?", a: "Yes, you can manage your subscription at any time from the 'Financials' section in your dashboard. You can upgrade, downgrade, or cancel your plan with a few clicks." },
];

const ContactPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredFaqs = faqData.filter(faq =>
        faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AnimatedWrapper>
            <div className="py-20 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-6">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">Contact Us & Support</h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                            We're here to help. Find answers to your questions or get in touch with our support team.
                        </p>
                    </div>

                    <div className="mt-16 grid md:grid-cols-3 gap-8">
                        <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <EnvelopeIcon className="w-12 h-12 mx-auto text-dortmed-500" />
                            <h3 className="mt-4 text-xl font-semibold">Email Support</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Get a detailed response within 24 hours.</p>
                            <a href="mailto:support@dortmed.com" className="font-semibold text-dortmed-600 mt-4 inline-block">support@dortmed.com</a>
                        </div>
                         <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <PhoneIcon className="w-12 h-12 mx-auto text-dortmed-500" />
                            <h3 className="mt-4 text-xl font-semibold">Phone Support</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Available 24/7 for urgent inquiries.</p>
                            <a href="tel:+18005551234" className="font-semibold text-dortmed-600 mt-4 inline-block">+1 (800) 555-1234</a>
                        </div>
                         <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <ChatBubbleBottomCenterTextIcon className="w-12 h-12 mx-auto text-dortmed-500" />
                            <h3 className="mt-4 text-xl font-semibold">Live Chat</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Chat with a support agent instantly.</p>
                            <button className="font-semibold text-dortmed-600 mt-4">Start Chat</button>
                        </div>
                    </div>

                    <div className="mt-20">
                         <h2 className="text-3xl font-bold text-center flex items-center justify-center gap-3">
                            <QuestionMarkCircleIcon className="w-8 h-8 text-dortmed-500" />
                            Frequently Asked Questions
                        </h2>
                        <div className="mt-8 max-w-3xl mx-auto">
                            <input
                                type="text"
                                placeholder="Search for a question..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="input-base w-full"
                            />
                        </div>
                        <div className="mt-8 max-w-3xl mx-auto space-y-4">
                            {filteredFaqs.map((faq, index) => (
                                <div key={index} className="border dark:border-gray-700 rounded-lg p-4">
                                    <h3 className="font-semibold">{faq.q}</h3>
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default ContactPage;