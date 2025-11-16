import React, { useState, useEffect } from 'react';
import { hospitalService } from '../../services/api';
import toast from 'react-hot-toast';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import HospitalMap from '../../components/hospitals/HospitalMap';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/solid';

const HospitalCard = ({ hospital }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <h3 className="font-bold text-lg text-dortmed-700 dark:text-dortmed-300">{hospital.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center">
            <MapPinIcon className="w-4 h-4 mr-2" />
            {hospital.address}, {hospital.city}, {hospital.country}
        </p>
        <div className="mt-3 text-xs">
            {hospital.specialties && <p><span className="font-semibold">Specialties:</span> {hospital.specialties}</p>}
            {hospital.services && <p className="mt-1"><span className="font-semibold">Services:</span> {hospital.services}</p>}
        </div>
    </div>
);

const HospitalDirectoryPage = () => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchHospitals = async () => {
            setLoading(true);
            try {
                const response = await hospitalService.search(searchTerm);
                setHospitals(response.data);
            } catch (error) {
                toast.error("Could not fetch hospital data.");
            } finally {
                setLoading(false);
            }
        };
        fetchHospitals();
    }, [searchTerm]);

    const handleSearch = (e) => {
        e.preventDefault();
        // The useEffect hook will trigger the search
    };

    return (
        <AnimatedWrapper>
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hospital Directory</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Find validated hospitals and specialists near you.
                </p>
            </div>
            <div className="mt-6">
                <form onSubmit={handleSearch} className="flex items-center max-w-lg">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, city, specialty..."
                            className="input-base pl-10 w-full"
                        />
                    </div>
                </form>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-[70vh]">
                {/* Hospital List */}
                <div className="lg:col-span-1 h-full overflow-y-auto pr-4 space-y-4">
                    {loading ? <p>Loading...</p> : hospitals.length > 0 ? (
                        hospitals.map(h => <HospitalCard key={h.id} hospital={h} />)
                    ) : <p>No hospitals found matching your search.</p>}
                </div>

                {/* Map View */}
                <div className="lg:col-span-2 h-full rounded-lg overflow-hidden shadow-lg">
                    <HospitalMap hospitals={hospitals} />
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default HospitalDirectoryPage;