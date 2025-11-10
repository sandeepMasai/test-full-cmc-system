import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer
} from 'recharts'
import api from '../store/api'
import { selectAuth } from '../store/slices/authSlice'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

function Dashboard() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const { user } = useSelector(selectAuth)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await api.get('/dashboard/stats')
            setStats(response.data.stats)
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-page">
                <div className="text-center text-secondary animate-pulse">
                    Loading dashboard...
                </div>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-page">
                <div className="text-center text-muted">No data available</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-page py-10 px-6">
            {/* Header */}
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold text-primary mb-2">
                    Welcome back, {user?.name || 'User'}
                </h1>
                <p className="text-secondary text-sm">
                    Here's an overview of your CRM performance
                </p>
            </div>

            {/* Statistic Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { title: 'Total Leads', value: stats.totalLeads, color: 'from-blue-500 to-blue-600' },
                    {
                        title: 'Total Value',
                        value: `$${stats.totalValue.toLocaleString()}`,
                        color: 'from-green-500 to-green-600'
                    },
                    {
                        title: 'Recent Activities',
                        value: stats.recentActivities,
                        color: 'from-yellow-400 to-yellow-500'
                    },
                    {
                        title: 'Leads (30 days)',
                        value: stats.leadsLast30Days,
                        color: 'from-indigo-500 to-indigo-600'
                    }
                ].map((card, idx) => (
                    <div
                        key={idx}
                        className={`p-6 bg-gradient-to-br ${card.color} rounded-xl text-white shadow-lg transform transition hover:scale-105`}
                    >
                        <h3 className="text-sm font-medium opacity-90">{card.title}</h3>
                        <p className="text-3xl font-bold mt-2">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Leads by Status */}
                <div className="card p-6">
                    <h2 className="text-xl font-semibold text-primary mb-4">
                        Leads by Status
                    </h2>
                    <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.leadsByStatus}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-slate-700" />
                                <XAxis dataKey="status" className="text-gray-600 dark:text-gray-400" />
                                <YAxis className="text-gray-600 dark:text-gray-400" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="count" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Activities by Type */}
                <div className="card p-6">
                    <h2 className="text-xl font-semibold text-primary mb-4">
                        Activities by Type
                    </h2>
                    <div className="flex justify-center items-center w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.activitiesByType}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="count"
                                    label={({ type, count }) => `${type}: ${count}`}
                                >
                                    {stats.activitiesByType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Leads by Source */}
            {stats.leadsBySource && stats.leadsBySource.length > 0 && (
                <div className="card p-6 mt-8">
                    <h2 className="text-xl font-semibold text-primary mb-4">
                        Leads by Source
                    </h2>
                    <div className="w-full h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.leadsBySource}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-slate-700" />
                                <XAxis dataKey="source" className="text-gray-600 dark:text-gray-400" />
                                <YAxis className="text-gray-600 dark:text-gray-400" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--card)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="count" fill="#22c55e" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard
