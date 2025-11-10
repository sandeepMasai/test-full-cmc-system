import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../store/api'
import AnimatedBackground from '../components/AnimatedBackground'

function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email) {
            toast.error('Please enter your email address')
            return
        }

        setLoading(true)
        try {
            await api.post('/auth/forgot-password', { email })
            setSent(true)
            toast.success('Password reset link sent to your email 📩')
        } catch (error) {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                'Failed to send reset email'
            toast.error(errorMessage)
            console.error('Forgot password error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300 bg-gray-100 dark:bg-slate-900">
            <AnimatedBackground />

            <div className="w-full max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg shadow-2xl rounded-2xl px-8 py-10 z-10 border border-white/20 dark:border-slate-700 relative">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Forgot Password?
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                        {sent
                            ? 'Check your email for reset instructions.'
                            : 'Enter your email to receive a password reset link.'}
                    </p>
                </div>

                {/* If email not yet sent */}
                {!sent ? (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 sm:text-sm transition"
                                placeholder="you@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center items-center py-2 px-4 text-sm font-semibold rounded-lg text-white shadow-lg transition-all duration-300 ease-in-out ${loading
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 active:scale-95 hover:shadow-xl'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5 mr-2 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                        ></path>
                                    </svg>
                                    Sending...
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>

                        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                            Remember your password?{' '}
                            <Link
                                to="/login"
                                className="font-medium text-blue-600 dark:text-blue-400 hover:underline transition"
                            >
                                Sign in
                            </Link>
                        </p>
                    </form>
                ) : (
                    // If email sent confirmation view
                    <div className="space-y-6 animate-fadeIn">
                        <div className="rounded-lg bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-700 p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="h-5 w-5 text-green-500 dark:text-green-400 mt-0.5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                        Password reset link sent to <strong>{email}</strong>
                                    </p>
                                    <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                                        Please check your inbox and follow the instructions to reset
                                        your password.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setSent(false)
                                setEmail('')
                            }}
                            className="w-full py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 transition"
                        >
                            Send Another Email
                        </button>

                        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                            <Link
                                to="/login"
                                className="font-medium text-blue-600 dark:text-blue-400 hover:underline transition"
                            >
                                Back to Sign in
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ForgotPassword
