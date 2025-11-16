import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/api';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';

const LogEntry = ({ log }) => {
    const statusColor = log.status === 'SUCCESS' ? 'text-green-500' : 'text-red-500';
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <td className="table-cell">{new Date(log.timestamp).toLocaleString()}</td>
            <td className="table-cell font-mono text-xs">{log.user_id || 'System'}</td>
            <td className="table-cell font-semibold">{log.action}</td>
            <td className="table-cell">
                <span className={`font-bold ${statusColor}`}>{log.status}</span>
            </td>
            <td className="table-cell font-mono text-xs">
                {log.target_type && `${log.target_type} (${log.target_id})`}
            </td>
             <td className="table-cell text-xs font-mono text-gray-500">
                {log.details}
            </td>
        </tr>
    );
};

const AuditTrailPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ user_id: '', action: '' });

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const params = {
                    user_id: filters.user_id || undefined,
                    action: filters.action || undefined,
                    limit: 200,
                };
                const response = await adminService.getAuditLogs(params);
                setLogs(response.data);
            } catch (error) {
                toast.error("Could not fetch audit logs.");
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [filters]);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <AnimatedWrapper>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Audit Trail</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
                A real-time log of critical events and actions performed within the system.
            </p>

            {/* Filter Controls */}
            <div className="flex space-x-4 my-6">
                <input
                    name="user_id"
                    value={filters.user_id}
                    onChange={handleFilterChange}
                    className="filter-select"
                    placeholder="Filter by User ID..."
                />
                 <input
                    name="action"
                    value={filters.action}
                    onChange={handleFilterChange}
                    className="filter-select"
                    placeholder="Filter by Action (e.g., USER_LOGIN_SUCCESS)..."
                />
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="table-header">Timestamp</th>
                                <th className="table-header">User ID</th>
                                <th className="table-header">Action</th>
                                <th className="table-header">Status</th>
                                <th className="table-header">Target</th>
                                <th className="table-header">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-8">Loading logs...</td></tr>
                            ) : logs.map(log => <LogEntry key={log.id} log={log} />)}
                        </tbody>
                    </table>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default AuditTrailPage;