import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectAuth } from '../store/slices/authSlice'
import { toast } from 'react-toastify'
import api from '../store/api'
import { format } from 'date-fns'
import { UserPlus, Edit3, Trash2 } from 'lucide-react'

const roleColors = {
    Admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300 dark:border-purple-700',
    Manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700',
    'Sales Executive':
        'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700',
}

function Users() {
    const { user: currentUser } = useSelector(selectAuth)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Sales Executive',
        isActive: true,
    })

    useEffect(() => {
        if (currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Manager')) {
            fetchUsers()
        }
    }, [currentUser])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const response = await api.get('/auth/users')
            setUsers(response.data.users)
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateUser = async (e) => {
        e.preventDefault()
        try {
            await api.post('/auth/admin/register', formData)
            toast.success('User created successfully!')
            setShowModal(false)
            resetForm()
            fetchUsers()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create user')
        }
    }

    const handleEditUser = (user) => {
        setSelectedUser(user)
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            isActive: user.isActive,
        })
        setShowEditModal(true)
    }

    const handleUpdateUser = async (e) => {
        e.preventDefault()
        try {
            const updateData = { ...formData }
            if (!updateData.password) delete updateData.password
            await api.put(`/auth/users/${selectedUser.id}`, updateData)
            toast.success('User updated successfully!')
            setShowEditModal(false)
            setSelectedUser(null)
            resetForm()
            fetchUsers()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update user')
        }
    }

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return
        try {
            await api.delete(`/auth/users/${userId}`)
            toast.success('User deleted successfully!')
            fetchUsers()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete user')
        }
    }

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'Sales Executive',
            isActive: true,
        })
    }

    if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'Manager')) {
        return (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400 text-lg font-medium">
                🚫 Access denied. Only Admin or Manager can view this page.
            </div>
        )
    }

    if (loading) {
        return (
            <div className="text-center py-16 text-gray-600 dark:text-gray-400 text-lg font-medium">
                Loading users...
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    User Management
                </h1>
                {currentUser.role === 'Admin' && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
                    >
                        <UserPlus size={18} />
                        <span>Create User</span>
                    </button>
                )}
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-800 shadow-lg rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-900/50">
                            <tr>
                                {['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map((header) => (
                                    <th
                                        key={header}
                                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-blue-50 dark:hover:bg-slate-700/40 transition duration-150"
                                >
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                                        {user.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${roleColors[user.role]}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-3 py-1 text-xs font-semibold rounded-full ${user.isActive
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700'
                                                }`}
                                        >
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                        {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={() => handleEditUser(user)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 transition"
                                            >
                                                <Edit3 size={16} />
                                                <span className="hidden sm:inline">Edit</span>
                                            </button>
                                            {user.id !== currentUser.id && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-1 transition"
                                                >
                                                    <Trash2 size={16} />
                                                    <span className="hidden sm:inline">Delete</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit User Modal */}
            {(showModal || showEditModal) && (
                <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-[95%] max-w-md border border-gray-200 dark:border-slate-700 animate-fadeIn">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {showModal ? 'Create New User' : 'Edit User'}
                        </h3>

                        <form
                            onSubmit={showModal ? handleCreateUser : handleUpdateUser}
                            className="space-y-4"
                        >
                            <input
                                type="text"
                                placeholder="Full Name *"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <input
                                type="email"
                                placeholder="Email *"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <input
                                type="password"
                                placeholder={showModal ? 'Password *' : 'New Password (optional)'}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                                required={showModal}
                            />
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="Sales Executive">Sales Executive</option>
                                <option value="Manager">Manager</option>
                                <option value="Admin">Admin</option>
                            </select>

                            <div className="flex items-center">
                                <input
                                    id="isActive"
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) =>
                                        setFormData({ ...formData, isActive: e.target.checked })
                                    }
                                    className="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                                />
                                <label
                                    htmlFor="isActive"
                                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    Active
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        setShowEditModal(false)
                                    }}
                                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition"
                                >
                                    {showModal ? 'Create' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Users
