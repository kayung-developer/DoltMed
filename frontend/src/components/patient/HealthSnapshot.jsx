import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns'; // Import the adapter
import { patientService } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

const HealthSnapshot = () => {
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVitals = async () => {
            setLoading(true);
            try {
                // Fetch real systolic blood pressure data
                const response = await patientService.getVitals('systolic_bp');
                const data = response.data.data_points;

                setChartData({
                    labels: data.map(d => new Date(d.timestamp)), // Use Date objects for labels
                    datasets: [{
                        label: 'Systolic Blood Pressure',
                        data: data.map(d => d.value),
                        borderColor: 'rgb(2, 132, 199)',
                        backgroundColor: 'rgba(2, 132, 199, 0.5)',
                        tension: 0.1
                    }],
                });
            } catch (error) {
                console.error("Could not load vital data for chart.");
            } finally {
                setLoading(false);
            }
        };
        fetchVitals();
    }, []);

    const options = {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    tooltipFormat: 'MMM dd, yyyy HH:mm'
                },
                title: { display: true, text: 'Date' }
            },
            y: {
                title: { display: true, text: 'Value (mmHg)' }
            }
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Health Snapshot: Blood Pressure Trend</h3>
            {loading ? <p>Loading chart data...</p> :
                chartData.labels.length > 0 ? <Line data={chartData} options={options} /> :
                <p>No blood pressure data recorded yet. You can add data via the "My Vitals" page.</p>
            }
        </div>
    );
};

export default HealthSnapshot;