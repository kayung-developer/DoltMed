import React, { useState, useEffect } from 'react';
import { hospitalService } from '../../services/api';
import toast from 'react-hot-toast';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import HospitalMap from '../../components/hospitals/HospitalMap';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

const GlobalNetworkPage = () => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    useEffect(() => {
        const fetchHospitals = async () => {
            setLoading(true);
            try {
                const response = await hospitalService.search(debouncedSearchTerm);
                setHospitals(response.data);
            } catch (error) {
                toast.error("Could not fetch hospital data.");
            } finally {
                setLoading(false);
            }
        };
        fetchHospitals();
    }, [debouncedSearchTerm]);

    return (
        <AnimatedWrapper>
            <div className="flex flex-col h-[calc(100vh-4rem)]">
                {/* Header and Search */}
                <div className="p-6 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                    <h1 className="text-3xl font-bold">Our Global Network of Hospitals</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Search our curated network of internationally-accredited medical centers.</p>
                     <form className="mt-4 max-w-md">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><MagnifyingGlassIcon className="w-5 h-5 text-gray-500" /></div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name, city, country, or specialty..."
                                className="input-base pl-10 w-full"
                            />
                        </div>
                    </form>
                </div>

                {/* Map View - takes up the remaining space */}
                <div className="flex-grow">
                    {loading ? <div className="flex h-full items-center justify-center">Loading map...</div> : <HospitalMap hospitals={hospitals} />}
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default GlobalNetworkPage;