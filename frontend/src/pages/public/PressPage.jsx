import React from 'react';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Button from '../../components/common/Button';
import { ArrowDownTrayIcon, NewspaperIcon } from '@heroicons/react/24/solid';

const pressReleases = [
    { id: 1, date: 'October 27, 2025', title: 'DortMed Launches Global Telemedicine Platform Powered by Advanced AI', link: '#' },
    { id: 2, date: 'September 15, 2025', title: 'DortMed Secures $50M Series A to Expand Hospital Network in Europe and Asia', link: '#' },
    { id: 3, date: 'August 01, 2025', title: 'New Study Shows DortMed\'s AI Diagnostic Support Tool Improves Accuracy by 25%', link: '#' },
];

const PressPage = () => {
    return (
        <AnimatedWrapper>
            <div className="py-20 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="text-center">
                        <NewspaperIcon className="w-16 h-16 mx-auto text-dortmed-500"/>
                        <h1 className="mt-4 text-4xl font-extrabold text-gray-900 dark:text-white">Press & Media</h1>
                        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                            Information for journalists, bloggers, and media professionals. For all media inquiries, please contact our communications team.
                        </p>
                        <a href="mailto:press@dortmed.com" className="mt-4 inline-block font-semibold text-dortmed-600 hover:underline">press@dortmed.com</a>
                    </div>

                    <div className="mt-16 grid md:grid-cols-2 gap-8 items-center bg-gray-50 dark:bg-gray-800 p-8 rounded-lg">
                        <div>
                            <h2 className="text-2xl font-bold">Media Kit</h2>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Download our comprehensive media kit, including logos, leadership headshots, and company backgrounders.</p>
                        </div>
                        <div className="text-center md:text-right">
                            <Button>
                                <ArrowDownTrayIcon className="w-5 h-5 mr-2"/>
                                Download Press Kit (.zip)
                            </Button>
                        </div>
                    </div>

                    <div className="mt-16">
                        <h2 className="text-2xl font-bold text-center">In The News</h2>
                        <div className="mt-8 flow-root">
                            <ul className="-my-4 divide-y divide-gray-200 dark:divide-gray-700">
                                {pressReleases.map(release => (
                                    <li key={release.id} className="py-6">
                                        <a href={release.link} className="group">
                                            <p className="text-sm text-gray-500">{release.date}</p>
                                            <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white group-hover:text-dortmed-600">{release.title}</h3>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default PressPage;