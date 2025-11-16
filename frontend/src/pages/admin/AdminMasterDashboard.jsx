import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { adminService, systemService } from '../../services/api';
import toast from 'react-hot-toast';
import {
    UsersIcon,
    CurrencyDollarIcon,
    ShieldCheckIcon,
    ClockIcon,
    ArrowUpIcon,
    ArrowRightIcon,
    HeartIcon // For Platform Health
} from '@heroicons/react/24/solid';

// Register all necessary Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

// Reusable Stat Card Component for displaying KPIs
const StatCard = ({ title, value, icon, change, changeType, isLoading }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
                {isLoading ? (
                    <div className="h-9 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mt-2"></div>
                ) : (
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
                )}
            </div>
            <div className="p-3 rounded-full bg-dortmed-100 dark:bg-dortmed-900">
                {React.createElement(icon, { className: "h-7 w-7 text-dortmed-600 dark:text-dortmed-400" })}
            </div>
        </div>
        {!isLoading && change && (
            <div className={`mt-4 flex items-center text-sm ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                <ArrowUpIcon className={`w-4 h-4 mr-1 ${changeType === 'decrease' && 'transform rotate-180'}`} />
                <span>{change} vs last month</span>
            </div>
        )}
    </div>
);

// Configuration for the user growth chart
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
    },
    scales: {
        x: {
            type: 'time',
            time: { unit: 'day', tooltipFormat: 'MMM dd, yyyy' },
            grid: { display: false }
        },
        y: {
            beginAtZero: true,
            grid: { color: '#e5e7eb', // Tailwind gray-200
                   borderDash: [5, 5] }
        }
    }
};

const AdminMasterDashboard = () => {
    const [kpis, setKpis] = useState(null);
    const [growthData, setGrowthData] = useState({ labels: [], datasets: [] });
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Fetch all data points in parallel for faster loading
                const [kpiRes, growthRes, healthRes] = await Promise.all([
                    adminService.getDashboardKpis(),
                    adminService.getUserGrowthData(),
                    systemService.getHealth()
                ]);

                setKpis(kpiRes.data);
                setHealth(healthRes.data);

                // Process the time-series data for the chart
                const labels = growthRes.data.data.map(d => new Date(d.date));
                const counts = growthRes.data.data.map(d => d.count);

                setGrowthData({
                    labels: labels,
                    datasets: [{
                        label: 'New User Registrations',
                        data: counts,
                        fill: true,
                        backgroundColor: 'rgba(2, 132, 199, 0.2)',
                        borderColor: 'rgb(2, 132, 199)',
                        tension: 0.3,
                        pointBackgroundColor: 'rgb(2, 132, 199)',
                    }]
                });

            } catch (error) {
                console.error("Failed to load dashboard data:", error);
                toast.error("Could not load all dashboard data. Please check service status.");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

    const quickLinks = [
        { name: 'Manage Users', path: '/admin/users', icon: UsersIcon },
        { name: 'Verify Physicians', path: '/admin/verify', icon: ShieldCheckIcon },
        { name: 'View Audit Trail', path: '/admin/audit-trail', icon: ClockIcon },
        { name: 'Manage Subscriptions', path: '/admin/subscriptions', icon: CurrencyDollarIcon },
    ];

    const healthStatusConfig = {
        'Operational': { color: 'green', text: 'All Systems Normal' },
        'Degraded': { color: 'red', text: 'System Degraded' }
    };
    const currentHealth = healthStatusConfig[health?.status] || { color: 'gray', text: 'Status Unknown' };

    return (
        <AnimatedWrapper>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Master Dashboard</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
                A real-time, 360-degree view of the DortMed platform's health and performance.
            </p>

            {/* KPI Cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Active Users" value={kpis?.total_active_users ?? '...'} icon={UsersIcon} isLoading={loading} />
                <StatCard title="Monthly Recurring Revenue" value={formatCurrency(kpis?.monthly_recurring_revenue ?? 0)} icon={CurrencyDollarIcon} isLoading={loading} />
                <StatCard title="Pending Verifications" value={kpis?.pending_verifications ?? '...'} icon={ShieldCheckIcon} isLoading={loading} />
                <div className={`bg-${currentHealth.color}-500 text-white p-6 rounded-lg shadow-md flex items-center justify-center`}>
                    {loading ? <div className="animate-pulse">Loading Status...</div> : (
                        <div className="text-center">
                            <p className="text-sm font-medium uppercase tracking-wider">Platform Health</p>
                            <p className="text-3xl font-bold mt-2">{health?.status || 'Unknown'}</p>
                            <div className="mt-4 flex items-center justify-center text-sm">
                               <div className={`w-3 h-3 rounded-full bg-white ${health?.status === 'Operational' && 'animate-pulse'} mr-2`}></div>
                               <span>{currentHealth.text}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Growth Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Growth (Last 30 Days)</h2>
                    <div className="mt-4 h-72">
                        {loading ? <div className="h-full w-full bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div> : <Line options={chartOptions} data={growthData} />}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
                    <div className="mt-4 space-y-3">
                        {quickLinks.map(link => (
                            <Link key={link.name} to={link.path} className="group flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 hover:bg-dortmed-100 dark:hover:bg-dortmed-900 rounded-md transition-colors">
                                <div className="flex items-center">
                                    {React.createElement(link.icon, { className: "w-6 h-6 text-gray-600 dark:text-gray-300" })}
                                    <span className="ml-3 font-medium text-gray-800 dark:text-gray-200">{link.name}</span>
                                </div>
                                <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-dortmed-600 transition-colors" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default AdminMasterDashboard;