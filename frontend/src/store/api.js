import axios from 'axios'

const api = axios.create({
    baseURL: 'https://test-full-cmc-system.onrender.com/api',
    headers: {
        'Content-Type': 'application/json'
    }
})

// Add token to requests from localStorage
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
            console.log('✅ Token added to request:', config.url)
        } else {
            console.warn('⚠️ No token found in localStorage for request:', config.url)
            // Don't make the request if it requires auth and no token
            if (config.url && !config.url.includes('/auth/login') && !config.url.includes('/auth/register') && !config.url.includes('/auth/forgot-password') && !config.url.includes('/auth/reset-password')) {
                console.error('❌ Request requires authentication but no token found')
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

