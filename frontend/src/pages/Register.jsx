import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { register, selectAuth } from '../store/slices/authSlice'
import { toast } from 'react-toastify'
import AnimatedBackground from '../components/AnimatedBackground'

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Sales Executive',
    })

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { loading, isAuthenticated } = useSelector(selectAuth)

    useEffect(() => {
        if (isAuthenticated) navigate('/')
    }, [isAuthenticated, navigate])

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match ❌')
            return
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters 🔒')
            return
        }

        try {
            const { confirmPassword, ...registerData } = formData
            const result = await dispatch(register(registerData)).unwrap()

            if (result && result.user) {
                toast.success('Registration successful 🎉')
                setTimeout(() => navigate('/'), 500)
            }
        } catch (error) {
            let errorMessage = 'Registration failed'
            if (typeof error === 'string') errorMessage = error
            else if (error?.message) errorMessage = error.message
            else if (error?.response?.data?.message)
                errorMessage = error.response.data.message
            else if (!error?.response)
                errorMessage =
                    'Unable to connect to server. Please check your network or backend.'

            toast.error(errorMessage)
            console.error('Registration error:', error)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300 bg-gray-100 dark:bg-slate-900">
            <AnimatedBackground />

            <div className="w-full max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg shadow-2xl rounded-2xl px-8 py-10 z-10 border border-white/20 dark:border-slate-700 relative">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Create Account
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                        Join the CRM system and manage your workflow efficiently
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Full Name */}
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Full Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 sm:text-sm transition"
                        />
                    </div>

                    {/* Email */}
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
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 sm:text-sm transition"
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label
                            htmlFor="role"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Role
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 sm:text-sm transition"
                        >
                            <option value="Sales Executive">Sales Executive</option>
                            <option value="Manager">Manager</option>
                            <option value="Admin">Admin</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Admin and Manager roles may require approval.
                        </p>
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="At least 6 characters"
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 sm:text-sm transition"
                        />
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
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter your password"
                            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 shadow-sm focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 sm:text-sm transition"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`group relative w-full flex justify-center items-center py-2.5 px-4 text-sm font-semibold rounded-lg text-white shadow-lg transition-all duration-300 ease-in-out ${loading
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
                                Creating account...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>

                    {/* Login Redirect */}
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline transition"
                        >
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    )
}

export default Register
