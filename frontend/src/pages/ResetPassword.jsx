import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../store/api'
import AnimatedBackground from '../components/AnimatedBackground'

function ResetPassword() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const token = searchParams.get('token')

    useEffect(() => {
        if (!token) {
            toast.error('Invalid or missing reset token')
            navigate('/forgot-password')
        }
    }, [token, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Validation
        if (!password || !confirmPassword) {
            setError('Please fill in all fields')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)

        try {
            await api.post('/auth/reset-password', {
                token,
                password,
            })
            toast.success('Password reset successfully! You can now sign in.')
            setTimeout(() => navigate('/login'), 2000)
        } catch (error) {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                'Failed to reset password'
            setError(errorMessage)
            toast.error(errorMessage)
            console.error('Reset password error:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!token) return null

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300 bg-gray-100 dark:bg-slate-900">
            <AnimatedBackground />
            <div className="w-full max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg shadow-2xl rounded-2xl px-8 py-10 z-10 border border-white/20 dark:border-slate-700 relative">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Reset Password
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                        Enter your new password below
                    </p>
                </div>

                {/* Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-lg bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 p-4">
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* New Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            New Password
                        </label>
                        <div className="mt-1 relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    setError('')
                                }}
                                className="block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 pr-10 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                            >
                                {showPassword ? (
                                    // 👁 Visible Icon
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z"
                                        />
                                    </svg>
                                ) : (
                                    // 👁 Hidden Icon
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.02 7.192 19 12 19c1.943 0 3.773-.46 5.395-1.28M9.88 9.88A3 3 0 0114.12 14.12M3 3l18 18"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value)
                                setError('')
                            }}
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 sm:text-sm transition"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Submit Button */}
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
                                Resetting...
                            </>
                        ) : (
                            'Reset Password'
                        )}
                    </button>

                    {/* Back to login */}
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        <Link
                            to="/login"
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline transition"
                        >
                            Back to Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}

export default ResetPassword
