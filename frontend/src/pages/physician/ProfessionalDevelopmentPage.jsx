import React, { useState, useEffect } from 'react';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import { BookOpenIcon, AcademicCapIcon, UsersIcon } from '@heroicons/react/24/solid';
import { physicianService } from '../../services/api';
import toast from 'react-hot-toast';

const ProfessionalDevelopmentPage = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    const iconMap = {
        journal: BookOpenIcon,
        course: AcademicCapIcon,
        forum: UsersIcon,
    };

    useEffect(() => {
        const fetchResources = async () => {
            setLoading(true);
            try {
                const response = await physicianService.getDevelopmentResources();
                setResources(response.data);
            } catch (error) {
                toast.error("Could not load resources.");
            } finally {
                setLoading(false);
            }
        };
        fetchResources();
    }, []);

    return (
        <AnimatedWrapper>
             <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Professional Development</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
                Access accredited courses, the latest medical journals, and peer-to-peer collaboration forums.
            </p>

            <div className="mt-8 space-y-6">
                {loading ? <p>Loading resources...</p> : resources.map((res, index) => {
                    const Icon = iconMap[res.resource_type] || BookOpenIcon;
                    return (
                        <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
                            <Icon className="w-10 h-10 text-dortmed-500 flex-shrink-0" />
                            <div className="flex-grow">
                                <p className="text-xs font-semibold uppercase text-blue-500">{res.resource_type}</p>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{res.title}</h3>
                                <p className="text-sm text-gray-500">{res.source}</p>
                            </div>
                            <a href={res.link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-dortmed-600 hover:underline">
                                Access &rarr;
                            </a>
                        </div>
                    );
                })}
            </div>
        </AnimatedWrapper>
    );
};

export default ProfessionalDevelopmentPage;