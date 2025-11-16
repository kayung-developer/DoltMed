import React, { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/api';
import toast from 'react-hot-toast';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import AdminTable from '../../components/admin/AdminTable';
import Button from '../../components/common/Button';
import { EyeIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
const UserManagement = () => {
const [users, setUsers] = useState([]);
const [pagination, setPagination] = useState(null);
const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState({ page: 1, size: 10, role: '', is_active: '' });

const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
        const response = await adminService.listUsers(filters);
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
}, [filters]);

useEffect(() => {
    fetchUsers();
}, [fetchUsers]);

const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
};

const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
};

const headers = ["Email", "Role", "Status", "Verified", "Created At", "Actions"];

const renderUserRow = (user) => (
    <tr key={user.id}>
        <td className="table-cell">{user.email}</td>
        <td className="table-cell capitalize">{user.role}</td>
        <td className="table-cell">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
                {user.is_active ? 'Active' : 'Inactive'}
            </span>
        </td>
        <td className="table-cell">{user.is_verified ? 'Yes' : 'No'}</td>
        <td className="table-cell">{new Date(user.created_at).toLocaleDateString()}</td>
        <td className="table-cell space-x-2">
            <Button variant="ghost" className="p-1 h-8 w-8"><EyeIcon className="w-4 h-4" /></Button>
            <Button variant="ghost" className="p-1 h-8 w-8"><PencilSquareIcon className="w-4 h-4" /></Button>
        </td>
    </tr>
);

return (
    <AnimatedWrapper>
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">View, search, and manage all users on the platform.</p>
            </div>
            {/* Filter Controls */}
            <div className="flex space-x-4">
                <select name="role" value={filters.role} onChange={handleFilterChange} className="filter-select">
                    <option value="">All Roles</option>
                    <option value="patient">Patient</option>
                    <option value="physician">Physician</option>
                </select>
                <select name="is_active" value={filters.is_active} onChange={handleFilterChange} className="filter-select">
                    <option value="">Any Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </div>
            {loading ? <p>Loading users...</p> : (
                <AdminTable
                    headers={headers}
                    data={users}
                    renderRow={renderUserRow}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    </AnimatedWrapper>
);
};
export default UserManagement;