import axios from 'axios'

const api = axios.create({
    baseURL: 'https://test-full-cmc-system.onrender.com/api',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: false // Explicitly disable credentials - using token-based auth
})

// Add token to requests from localStorage
api.interceptors.request.use(
    (config) => {
        // Skip adding token for auth endpoints
        const isAuthEndpoint = config.url && (
            config.url.includes('/auth/login') || 
            config.url.includes('/auth/register') || 
            config.url.includes('/auth/forgot-password') || 
            config.url.includes('/auth/reset-password')
        )
        
        if (!isAuthEndpoint) {
            const token = localStorage.getItem('token')
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
                console.log('✅ Token added to request:', config.url)
            } else {
                console.error('❌ No token found in localStorage for request:', config.url)
                // Don't block the request, let the server handle it
            }
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear user data and token from localStorage
            localStorage.removeItem('user')
            localStorage.removeItem('token')
            // Redirect to login
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api

