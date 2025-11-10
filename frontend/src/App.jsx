import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import LeadDetail from './pages/LeadDetail'
import Integrations from './pages/Integrations'
import Users from './pages/Users'
import Layout from './components/Layout'
import { selectAuth } from './store/slices/authSlice'
import { useSocket } from './hooks/useSocket'

function PrivateRoute({ children }) {
    const { isAuthenticated } = useSelector(selectAuth)
    // Initialize socket for authenticated users
    useSocket()
    return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
                path="/"
                element={
                    <PrivateRoute>
                        <Layout />
                    </PrivateRoute>
                }
            >
                <Route index element={<Dashboard />} />
                <Route path="leads" element={<Leads />} />
                <Route path="leads/:id" element={<LeadDetail />} />
                <Route path="integrations" element={<Integrations />} />
                <Route path="users" element={<Users />} />
            </Route>
        </Routes>
    )
}

export default App

