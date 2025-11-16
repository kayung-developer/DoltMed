import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { telemedicineService } from '../../services/api';
import toast from 'react-hot-toast';
import VideoRoom from '../../components/telemedicine/VideoRoom';

const ConsultationPage = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const response = await telemedicineService.getAccessToken(appointmentId);
                setToken(response.data.token);
            } catch (error) {
                toast.error(error.response?.data?.detail || "Could not join session.");
                navigate(-1); // Go back to the previous page
            } finally {
                setLoading(false);
            }
        };
        fetchToken();
    }, [appointmentId, navigate]);

    const handleLeaveSession = () => {
        toast.success("Consultation ended.");
        navigate(-1); // Go back to the dashboard or previous page
    };

    if (loading) {
        return (
             <div className="h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
                <div className="w-16 h-16 border-4 border-dortmed-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-lg">Connecting to your consultation...</p>
            </div>
        );
    }

    return token ? (
        <VideoRoom token={token} roomName={appointmentId} onLeave={handleLeaveSession} />
    ) : null;
};
export default ConsultationPage;