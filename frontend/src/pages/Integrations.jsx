import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectAuth } from '../store/slices/authSlice'
import api from '../store/api'
import { toast } from 'react-toastify'

function Integrations() {
    const { user } = useSelector(selectAuth)
    const [webhooks, setWebhooks] = useState({
        hubspot: { enabled: false, apiKey: '' },
        slack: { enabled: false, webhookUrl: '' }
    })
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState({ hubspot: false, slack: false })

    useEffect(() => {
        if (user && (user.role === 'Admin' || user.role === 'Manager')) {
            fetchWebhooks()
        }
    }, [user])

    const fetchWebhooks = async () => {
        try {
            const response = await api.get('/integrations/webhooks')
            setWebhooks({
                hubspot: { ...webhooks.hubspot, enabled: response.data.hubspot.enabled },
                slack: { ...webhooks.slack, enabled: response.data.slack.enabled }
            })
        } catch (error) {
            console.error('Error fetching webhooks:', error)
        }
    }

    const handleHubSpotSubmit = async (e) => {
        e.preventDefault()
        setSaving({ ...saving, hubspot: true })
        try {
            await api.post('/integrations/webhooks/hubspot', {
                apiKey: webhooks.hubspot.apiKey,
                enabled: webhooks.hubspot.enabled
            })
            toast.success(webhooks.hubspot.enabled ? 'HubSpot integration enabled!' : 'HubSpot integration disabled')
            fetchWebhooks()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to configure HubSpot')
        } finally {
            setSaving({ ...saving, hubspot: false })
        }
    }

    const handleSlackSubmit = async (e) => {
        e.preventDefault()
        setSaving({ ...saving, slack: true })
        try {
            await api.post('/integrations/webhooks/slack', {
                webhookUrl: webhooks.slack.webhookUrl,
                enabled: webhooks.slack.enabled
            })
            toast.success(webhooks.slack.enabled ? 'Slack integration enabled!' : 'Slack integration disabled')
            fetchWebhooks()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to configure Slack')
        } finally {
            setSaving({ ...saving, slack: false })
        }
    }

    const testIntegration = async (type) => {
        try {
            const response = await api.post('/integrations/webhooks/test', { type })
            if (response.data.success) {
                toast.success(response.data.message)
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to test ${type} integration`)
        }
    }

    if (!user || (user.role !== 'Admin' && user.role !== 'Manager')) {
        return (
            <div className="text-center py-12">
                <p className="text-secondary">Access denied. Admin or Manager role required.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary">Integrations</h1>
                <p className="text-secondary mt-2">Connect your CRM with third-party tools</p>
            </div>

            {/* HubSpot Integration */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🔗</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-primary">HubSpot</h2>
                            <p className="text-sm text-secondary">Sync leads to HubSpot CRM</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${webhooks.hubspot.enabled
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-700'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-slate-600'
                            }`}>
                            {webhooks.hubspot.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleHubSpotSubmit} className="space-y-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            HubSpot API Key
                        </label>
                        <input
                            type="password"
                            value={webhooks.hubspot.apiKey}
                            onChange={(e) => setWebhooks({
                                ...webhooks,
                                hubspot: { ...webhooks.hubspot, apiKey: e.target.value }
                            })}
                            placeholder="Enter your HubSpot API key"
                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-primary rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-secondary mt-1">
                            Get your API key from HubSpot Settings → Integrations → Private Apps
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={webhooks.hubspot.enabled}
                                onChange={(e) => setWebhooks({
                                    ...webhooks,
                                    hubspot: { ...webhooks.hubspot, enabled: e.target.checked }
                                })}
                                className="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-primary">Enable HubSpot sync</span>
                        </label>
                        <div className="flex space-x-2">
                            <button
                                type="submit"
                                disabled={saving.hubspot}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving.hubspot ? 'Saving...' : 'Save Configuration'}
                            </button>
                            {webhooks.hubspot.enabled && (
                                <button
                                    type="button"
                                    onClick={() => testIntegration('hubspot')}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                                >
                                    Test Connection
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">How it works:</h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                        <li>• New leads are automatically synced to HubSpot as contacts</li>
                        <li>• Lead status and details are kept in sync</li>
                        <li>• Requires HubSpot Private App API key</li>
                    </ul>
                </div>
            </div>

            {/* Slack Integration */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">💬</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-primary">Slack</h2>
                            <p className="text-sm text-secondary">Send notifications to Slack channels</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${webhooks.slack.enabled
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-300 dark:border-green-700'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-slate-600'
                            }`}>
                            {webhooks.slack.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSlackSubmit} className="space-y-4 mt-4">
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">
                            Slack Webhook URL
                        </label>
                        <input
                            type="url"
                            value={webhooks.slack.webhookUrl}
                            onChange={(e) => setWebhooks({
                                ...webhooks,
                                slack: { ...webhooks.slack, webhookUrl: e.target.value }
                            })}
                            placeholder="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
                            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-primary rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-secondary mt-1">
                            Create a webhook in Slack: Apps → Incoming Webhooks → Add to Slack
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={webhooks.slack.enabled}
                                onChange={(e) => setWebhooks({
                                    ...webhooks,
                                    slack: { ...webhooks.slack, enabled: e.target.checked }
                                })}
                                className="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-primary">Enable Slack notifications</span>
                        </label>
                        <div className="flex space-x-2">
                            <button
                                type="submit"
                                disabled={saving.slack}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving.slack ? 'Saving...' : 'Save Configuration'}
                            </button>
                            {webhooks.slack.enabled && (
                                <button
                                    type="button"
                                    onClick={() => testIntegration('slack')}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                                >
                                    Test Webhook
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">Notifications sent:</h3>
                    <ul className="text-sm text-purple-800 dark:text-purple-300 space-y-1">
                        <li>• New lead created</li>
                        <li>• Lead assigned to user</li>
                        <li>• Important activities (Calls, Meetings, Status Changes)</li>
                    </ul>
                </div>
            </div>

            {/* Integration Info */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">ℹ️ Integration Information</h3>
                <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                    <li>• Integrations are automatically triggered when events occur</li>
                    <li>• Webhook configurations are stored in memory (restart resets them)</li>
                    <li>• For production, consider storing configurations in database</li>
                    <li>• Only Admin and Manager roles can configure integrations</li>
                </ul>
            </div>
        </div>
    )
}

export default Integrations

