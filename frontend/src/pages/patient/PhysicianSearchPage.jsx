import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { appointmentService } from '../../services/api';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/solid';

const PhysicianCard = ({ physician }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-lg text-dortmed-700 dark:text-dortmed-300">{physician.first_name} {physician.last_name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{physician.specialty}</p>
            </div>
            {physician.distance_km !== null && (
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{physician.distance_km} km away</span>
            )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 flex items-center">
            <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            {physician.address || 'Address not available'}
        </p>
         {/* Add a button to book appointment */}
    </div>
);


const PhysicianSearchPage = () => {
    const [physicians, setPhysicians] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchParams, setSearchParams] = useState({
        latitude: null,
        longitude: null,
        radius_km: 25,
        specialty: ""
    });

    const handleLocationSearch = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        toast.loading("Getting your location...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                toast.dismiss();
                toast.success("Location found!");
                setSearchParams(prev => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }));
            },
            () => {
                toast.dismiss();
                toast.error("Unable to retrieve your location.");
            }
        );
    };

    useEffect(() => {
        const fetchPhysicians = async () => {
            if (searchParams.latitude && searchParams.longitude) {
                setLoading(true);
                try {
                    const response = await appointmentService.searchPhysiciansGeo(searchParams);
                    setPhysicians(response.data);
                } catch (error) {
                    toast.error("Could not fetch physician data.");
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchPhysicians();
    }, [searchParams]);

    return (
        <AnimatedWrapper>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Find a Doctor</h1>

            <div className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Specialty (e.g., Cardiology)</label>
                    <input
                        type="text"
                        value={searchParams.specialty}
                        onChange={(e) => setSearchParams(p => ({...p, specialty: e.target.value}))}
                        className="input-base mt-1"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium">Search Radius (km)</label>
                    <select
                        value={searchParams.radius_km}
                        onChange={(e) => setSearchParams(p => ({...p, radius_km: e.target.value}))}
                        className="input-base mt-1"
                    >
                        <option value={10}>10 km</option>
                        <option value={25}>25 km</option>
                        <option value={50}>50 km</option>
                        <option value={100}>100 km</option>
                    </select>
                </div>
                <div>
                    <button onClick={handleLocationSearch} className="w-full h-10 flex items-center justify-center p-2 bg-dortmed-600 text-white rounded-md hover:bg-dortmed-700">
                        <MapPinIcon className="w-5 h-5 mr-2"/> Use My Location
                    </button>
                </div>
            </div>

            <div className="mt-8">
                {loading ? <p>Searching for doctors...</p> : (
                    <div className="space-y-4">
                        {searchParams.latitude ? (
                             physicians.length > 0 ? (
                                physicians.map(p => <PhysicianCard key={p.id} physician={p} />)
                             ) : <p>No physicians found within the selected radius.</p>
                        ) : <p className="text-center text-gray-500">Please use your location to find nearby doctors.</p>}
                    </div>
                )}
            </div>
        </AnimatedWrapper>
    );
};

export default PhysicianSearchPage;