import axios from 'axios'

const api = axios.create({
    baseURL: 'https://test-full-cmc-system.onrender.com/api',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // Send cookies with requests
})

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear user data from localStorage
            localStorage.removeItem('user')
            // Redirect to login
            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api

