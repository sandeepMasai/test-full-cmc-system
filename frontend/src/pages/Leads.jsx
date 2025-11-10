import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchLeads, createLead, selectLeads } from '../store/slices/leadSlice'
import { toast } from 'react-toastify'
import api from '../store/api'

const statusColors = {
    New: 'bg-gray-100 text-gray-800 border border-gray-300 dark:bg-slate-800 dark:text-gray-100 dark:border-slate-600',
    Contacted: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/50 dark:text-blue-200',
    Qualified: 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-200',
    Proposal: 'bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900/50 dark:text-purple-200',
    Negotiation: 'bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-900/50 dark:text-orange-200',
    Won: 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/50 dark:text-green-200',
    Lost: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/50 dark:text-red-200',
}

function Leads() {
    const [showModal, setShowModal] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        status: 'New',
        source: '',
        estimatedValue: '',
        notes: '',
    })
    const [users, setUsers] = useState([])
    const [filters, setFilters] = useState({ status: '', page: 1 })
    const dispatch = useDispatch()
    const { leads, pagination, loading } = useSelector(selectLeads)

    useEffect(() => {
        dispatch(fetchLeads(filters))
        fetchUsers()
    }, [dispatch, filters])

    const fetchUsers = async () => {
        try {
            const response = await api.get('/auth/users')
            setUsers(response.data.users)
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await dispatch(createLead(formData)).unwrap()
            toast.success('Lead created successfully!')
            setShowModal(false)
            setFormData({
                name: '',
                email: '',
                phone: '',
                company: '',
                status: 'New',
                source: '',
                estimatedValue: '',
                notes: '',
            })
            dispatch(fetchLeads(filters))
        } catch (error) {
            toast.error(error || 'Failed to create lead')
        }
    }

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value, page: 1 })
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                    Leads Dashboard
                </h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 transition-transform duration-200 text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl"
                >
                    + New Lead
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4 flex items-center justify-between bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-center space-x-3">
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">All Statuses</option>
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Proposal">Proposal</option>
                        <option value="Negotiation">Negotiation</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                    </select>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    Total Leads: <span className="font-semibold">{leads.length}</span>
                </p>
            </div>

            {/* Leads List */}
            {loading ? (
                <div className="text-center py-16 text-gray-600 dark:text-gray-400 font-medium">
                    Loading leads...
                </div>
            ) : leads.length === 0 ? (
                <div className="text-center py-20 text-gray-500 dark:text-gray-400 font-semibold text-lg">
                    No leads found. Try adjusting your filters or add a new lead.
                </div>
            ) : (
                <>
                    <div className="card bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <ul className="divide-y divide-gray-200 dark:divide-slate-700">
                            {leads.map((lead) => (
                                <li
                                    key={lead.id}
                                    className="transition hover:bg-blue-50/40 dark:hover:bg-slate-700/50 cursor-pointer"
                                >
                                    <Link to={`/leads/${lead.id}`} className="block px-6 py-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                                    {lead.name}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{lead.email}</p>
                                                {lead.company && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {lead.company}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span
                                                    className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[lead.status]}`}
                                                >
                                                    {lead.status}
                                                </span>
                                                {lead.estimatedValue && (
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        ${parseFloat(lead.estimatedValue).toLocaleString()}
                                                    </p>
                                                )}
                                                {lead.assignedTo && (
                                                    <p className="text-sm text-gray-500 italic dark:text-gray-400">
                                                        {lead.assignedTo.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex justify-center items-center space-x-4 mt-6">
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                disabled={filters.page === 1}
                                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                Page <strong>{filters.page}</strong> of {pagination.pages}
                            </span>
                            <button
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                disabled={filters.page === pagination.pages}
                                className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Create Lead Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-[95%] max-w-lg border border-gray-200 dark:border-slate-700 animate-fadeIn">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                            Create New Lead
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {['name', 'email', 'phone', 'company', 'source', 'estimatedValue'].map((field) => (
                                <input
                                    key={field}
                                    type={field === 'email' ? 'email' : field === 'estimatedValue' ? 'number' : 'text'}
                                    placeholder={
                                        field === 'source'
                                            ? 'Source (Website, Referral, etc.)'
                                            : field === 'estimatedValue'
                                                ? 'Estimated Value ($)'
                                                : `${field.charAt(0).toUpperCase() + field.slice(1)} *`
                                    }
                                    required={['name', 'email'].includes(field)}
                                    value={formData[field]}
                                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                                    className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                                />
                            ))}

                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                            >
                                <option value="New">New</option>
                                <option value="Contacted">Contacted</option>
                                <option value="Qualified">Qualified</option>
                                <option value="Proposal">Proposal</option>
                                <option value="Negotiation">Negotiation</option>
                                <option value="Won">Won</option>
                                <option value="Lost">Lost</option>
                            </select>

                            <textarea
                                placeholder="Notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                                rows="3"
                            />

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Leads
