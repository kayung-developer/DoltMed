import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../../services/api';
import toast from 'react-hot-toast';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Button from '../../components/common/Button';
import { EyeIcon, PencilSquareIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

// A simple debounce hook
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

// Edit User Modal
const EditUserModal = ({ user, isOpen, onClose, onUpdateSuccess }) => {
    const [isActive, setIsActive] = useState(user?.is_active || false);
    const [isVerified, setIsVerified] = useState(user?.is_verified || false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setIsActive(user.is_active);
            setIsVerified(user.is_verified);
        }
    }, [user]);

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            const updateData = {
                is_active: isActive,
                is_verified: isVerified,
            };
            await adminService.updateUserStatus(user.id, updateData);
            toast.success(`User ${user.email} updated successfully.`);
            onUpdateSuccess();
            onClose();
        } catch (error) {
            toast.error("Failed to update user status.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h2 className="text-2xl font-bold mb-4">Edit User: {user.email}</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <label htmlFor="isActive" className="font-medium text-gray-800 dark:text-gray-200">Account Active</label>
                        <input id="isActive" type="checkbox" className="h-6 w-6 rounded text-dortmed-600 focus:ring-dortmed-500" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                    </div>
                     <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <label htmlFor="isVerified" className="font-medium text-gray-800 dark:text-gray-200">Account Verified</label>
                        <input id="isVerified" type="checkbox" className="h-6 w-6 rounded text-dortmed-600 focus:ring-dortmed-500" checked={isVerified} onChange={e => setIsVerified(e.target.checked)} />
                    </div>
                </div>
                <div className="flex justify-end space-x-4 mt-8">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button isLoading={isLoading} onClick={handleUpdate}>Save Changes</Button>
                </div>
            </div>
        </div>
    );
};

// Main Component
const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ page: 1, size: 10, role: '', search: '' });

    const [selectedUser, setSelectedUser] = useState(null);

    const debouncedSearch = useDebounce(filters.search, 500); // 500ms delay

    const fetchUsers = useCallback(async (appliedFilters) => {
        setLoading(true);
        try {
            const params = {
                page: appliedFilters.page,
                size: appliedFilters.size,
                role: appliedFilters.role || undefined,
                search: appliedFilters.search || undefined, // Add search to backend if supported
            };
            const response = await adminService.listUsers(params);
            setUsers(response.data.items);
            setPagination({
                total: response.data.total,
                page: response.data.page,
                size: response.data.size,
                pages: response.data.pages,
            });
        } catch (error) {
            toast.error("Failed to fetch users.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Trigger fetch when page, role, or debounced search term changes
        fetchUsers({ ...filters, search: debouncedSearch });
    }, [filters.page, filters.role, debouncedSearch, fetchUsers]);

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.pages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    const headers = ["Email", "Role", "Status", "Verified", "Created At", "Actions"];

    const renderUserRow = (user) => (
        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <td className="table-cell font-medium">{user.email}</td>
            <td className="table-cell capitalize">{user.role}</td>
            <td className="table-cell">
                {user.is_active ?
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircleIcon className="w-4 h-4 mr-1"/> Active</span> :
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircleIcon className="w-4 h-4 mr-1"/> Inactive</span>
                }
            </td>
            <td className="table-cell">{user.is_verified ? 'Yes' : 'No'}</td>
            <td className="table-cell">{new Date(user.created_at).toLocaleDateString()}</td>
            <td className="table-cell space-x-2">
                <Button variant="ghost" className="p-1 h-8 w-8" onClick={() => {/* Implement detail view modal */}}><EyeIcon className="w-4 h-4" /></Button>
                <Button variant="ghost" className="p-1 h-8 w-8" onClick={() => setSelectedUser(user)}><PencilSquareIcon className="w-4 h-4" /></Button>
            </td>
        </tr>
    );

    return (
        <AnimatedWrapper>
            <EditUserModal
                isOpen={!!selectedUser}
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
                onUpdateSuccess={() => fetchUsers(filters)}
            />
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">View, search, and manage all users on the platform.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                        className="filter-select md:col-span-1"
                        placeholder="Search by email..."
                    />
                    <select name="role" value={filters.role} onChange={handleFilterChange} className="filter-select">
                        <option value="">All Roles</option>
                        <option value="patient">Patient</option>
                        <option value="physician">Physician</option>
                    </select>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                             <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>{headers.map(h => <th key={h} className="table-header">{h}</th>)}</tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan={headers.length} className="text-center py-8">Loading users...</td></tr>
                                ) : users.length > 0 ? users.map(renderUserRow) : (
                                    <tr><td colSpan={headers.length} className="text-center py-8">No users found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                     {pagination && pagination.pages > 1 && (
                        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.pages}</span> ({pagination.total} total results)
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="pagination-button rounded-l-md">
                                    <ChevronLeftIcon className="h-5 w-5" />
                                </button>
                                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="pagination-button rounded-r-md">
                                    <ChevronRightIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AnimatedWrapper>
    );
};
export default UserManagement;