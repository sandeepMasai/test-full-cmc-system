import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { login, selectAuth } from '../store/slices/authSlice'
import { toast } from 'react-toastify'
import AnimatedBackground from '../components/AnimatedBackground'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { loading, isAuthenticated } = useSelector(selectAuth)

    useEffect(() => {
        if (isAuthenticated) navigate('/')
    }, [isAuthenticated, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const result = await dispatch(login({ email, password })).unwrap()
            if (result && result.user) {
                toast.success(`Welcome back, ${result.user.name || 'User'}!`)
                setTimeout(() => navigate('/'), 500)
            }
        } catch (error) {
            let errorMessage = 'Login failed'
            if (typeof error === 'string') errorMessage = error
            else if (error?.message) errorMessage = error.message
            else if (error?.response?.data?.message)
                errorMessage = error.response.data.message
            else if (!error?.response)
                errorMessage = 'Unable to connect to server. Please check if the backend is running.'

            toast.error(errorMessage)
            console.error('Login error:', error)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300 bg-gray-100 dark:bg-slate-900">
            <AnimatedBackground />

            {/* Card */}
            <div className="w-full max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg shadow-2xl rounded-2xl px-8 py-10 z-10 border border-white/20 dark:border-slate-700 relative">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        CRM Login
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                        Sign in to manage your leads and activities
                    </p>
                </div>

                {/* Login Form */}
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
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Forgot password */}
                    <div className="flex items-center justify-between">
                        <Link
                            to="/forgot-password"
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline transition"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`group relative w-full flex justify-center items-center py-2.5 px-4 text-sm font-semibold rounded-lg text-white transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl ${loading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
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
                                Signing in...
                            </>
                        ) : (
                            'Sign in'
                        )}
                    </button>

                    {/* Register Link */}
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        Don’t have an account?{' '}
                        <Link
                            to="/register"
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline transition"
                        >
                            Create one
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}

export default Login
