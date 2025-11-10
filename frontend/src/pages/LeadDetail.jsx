import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    fetchLeadById,
    updateLead,
    deleteLead,
    selectLeads,
} from '../store/slices/leadSlice'
import { selectAuth } from '../store/slices/authSlice'
import { toast } from 'react-toastify'
import api from '../store/api'
import { format } from 'date-fns'

const statusColors = {
    New: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-100',
    Contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
    Qualified: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
    Proposal: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
    Negotiation: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
    Won: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
    Lost: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
}

function LeadDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { currentLead, loading } = useSelector(selectLeads)
    const { user } = useSelector(selectAuth)
    const [activities, setActivities] = useState([])
    const [showActivityModal, setShowActivityModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [activityForm, setActivityForm] = useState({
        type: 'Note',
        title: '',
        description: '',
    })
    const [editForm, setEditForm] = useState({})

    useEffect(() => {
        dispatch(fetchLeadById(id))
        fetchActivities()
    }, [id, dispatch])

    useEffect(() => {
        if (currentLead) {
            setEditForm({
                name: currentLead.name,
                email: currentLead.email,
                phone: currentLead.phone || '',
                company: currentLead.company || '',
                status: currentLead.status,
                source: currentLead.source || '',
                estimatedValue: currentLead.estimatedValue || '',
                notes: currentLead.notes || '',
            })
        }
    }, [currentLead])

    const fetchActivities = async () => {
        try {
            const response = await api.get(`/activities/lead/${id}`)
            setActivities(response.data.activities)
        } catch (error) {
            console.error('Error fetching activities:', error)
        }
    }

    const handleActivitySubmit = async (e) => {
        e.preventDefault()
        try {
            await api.post('/activities', { ...activityForm, leadId: id })
            toast.success('Activity created successfully!')
            setShowActivityModal(false)
            setActivityForm({ type: 'Note', title: '', description: '' })
            fetchActivities()
            dispatch(fetchLeadById(id))
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create activity')
        }
    }

    const handleUpdateLead = async (e) => {
        e.preventDefault()
        try {
            await dispatch(updateLead({ id, data: editForm })).unwrap()
            toast.success('Lead updated successfully!')
            setShowEditModal(false)
            fetchActivities()
            dispatch(fetchLeadById(id))
        } catch (error) {
            toast.error(error || 'Failed to update lead')
        }
    }

    const handleDeleteLead = async () => {
        if (
            !window.confirm(
                'Are you sure you want to delete this lead? This action cannot be undone.'
            )
        ) {
            return
        }
        try {
            await dispatch(deleteLead(id)).unwrap()
            toast.success('Lead deleted successfully!')
            navigate('/leads')
        } catch (error) {
            toast.error(error || 'Failed to delete lead')
        }
    }

    if (loading)
        return (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                Loading lead details...
            </div>
        )

    if (!currentLead)
        return (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                Lead not found
            </div>
        )

    return (
        <div className="space-y-6 transition-colors duration-300">
            {/* Header */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => navigate('/leads')}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                    ← Back to Leads
                </button>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                    >
                        Edit Lead
                    </button>
                    <button
                        onClick={handleDeleteLead}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
                    >
                        Delete Lead
                    </button>
                </div>
            </div>

            {/* Lead Card */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-md">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {currentLead.name}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {currentLead.email}
                        </p>
                        {currentLead.company && (
                            <p className="text-gray-500 dark:text-gray-400">
                                {currentLead.company}
                            </p>
                        )}
                    </div>
                    <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[currentLead.status]}`}
                    >
                        {currentLead.status}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            Phone
                        </label>
                        <p className="text-gray-900 dark:text-gray-100">
                            {currentLead.phone || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            Source
                        </label>
                        <p className="text-gray-900 dark:text-gray-100">
                            {currentLead.source || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            Estimated Value
                        </label>
                        <p className="text-gray-900 dark:text-gray-100">
                            {currentLead.estimatedValue
                                ? `$${parseFloat(currentLead.estimatedValue).toLocaleString()}`
                                : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            Assigned To
                        </label>
                        <p className="text-gray-900 dark:text-gray-100">
                            {currentLead.assignedTo?.name || 'Unassigned'}
                        </p>
                    </div>
                    {currentLead.notes && (
                        <div className="col-span-2">
                            <label className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                Notes
                            </label>
                            <p className="text-gray-900 dark:text-gray-100">
                                {currentLead.notes}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Activities */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Activity Timeline
                    </h2>
                    <button
                        onClick={() => setShowActivityModal(true)}
                        className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 text-sm transition"
                    >
                        + Add Activity
                    </button>
                </div>

                <div className="space-y-4">
                    {activities.length > 0 ? (
                        activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {activity.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {activity.description}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {activity.user?.name} •{' '}
                                            {format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}
                                        </p>
                                    </div>
                                    <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                        {activity.type}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                            No activities yet
                        </p>
                    )}
                </div>
            </div>

            {/* Modals (Activity + Edit) */}
            {[showActivityModal, showEditModal].some(Boolean) && (
                <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl p-6 w-[95%] max-w-md">
                        {showActivityModal ? (
                            <>
                                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
                                    Add Activity
                                </h3>
                                <form onSubmit={handleActivitySubmit} className="space-y-4">
                                    <select
                                        value={activityForm.type}
                                        onChange={(e) =>
                                            setActivityForm({ ...activityForm, type: e.target.value })
                                        }
                                        className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2"
                                    >
                                        <option value="Note">Note</option>
                                        <option value="Call">Call</option>
                                        <option value="Meeting">Meeting</option>
                                        <option value="Email">Email</option>
                                        <option value="Status Change">Status Change</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Title *"
                                        required
                                        value={activityForm.title}
                                        onChange={(e) =>
                                            setActivityForm({ ...activityForm, title: e.target.value })
                                        }
                                        className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 placeholder:text-gray-400 dark:placeholder:text-gray-300"
                                    />
                                    <textarea
                                        placeholder="Description"
                                        value={activityForm.description}
                                        onChange={(e) =>
                                            setActivityForm({
                                                ...activityForm,
                                                description: e.target.value,
                                            })
                                        }
                                        className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 placeholder:text-gray-400 dark:placeholder:text-gray-300"
                                        rows="3"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowActivityModal(false)}
                                            className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <>
                                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
                                    Edit Lead
                                </h3>
                                <form onSubmit={handleUpdateLead} className="space-y-4">
                                    {[
                                        'name',
                                        'email',
                                        'phone',
                                        'company',
                                        'source',
                                        'estimatedValue',
                                    ].map((field) => (
                                        <input
                                            key={field}
                                            type={field === 'email' ? 'email' : field === 'estimatedValue' ? 'number' : 'text'}
                                            placeholder={
                                                field.charAt(0).toUpperCase() + field.slice(1)
                                            }
                                            value={editForm[field] || ''}
                                            onChange={(e) =>
                                                setEditForm({ ...editForm, [field]: e.target.value })
                                            }
                                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 placeholder:text-gray-400 dark:placeholder:text-gray-300"
                                        />
                                    ))}
                                    <select
                                        value={editForm.status}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, status: e.target.value })
                                        }
                                        className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2"
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
                                        value={editForm.notes}
                                        onChange={(e) =>
                                            setEditForm({ ...editForm, notes: e.target.value })
                                        }
                                        className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 placeholder:text-gray-400 dark:placeholder:text-gray-300"
                                        rows="3"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditModal(false)}
                                            className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                                        >
                                            Update
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default LeadDetail
