import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { initializeSocket, getSocket } from '../utils/socket'
import { selectAuth } from '../store/slices/authSlice'
import { addNotification } from '../store/slices/notificationSlice'
import { toast } from 'react-toastify'

export const useSocket = () => {
    const { user } = useSelector(selectAuth)
    const dispatch = useDispatch()

    useEffect(() => {
        if (!user?.id) return

        const socket = initializeSocket(user.id)

        if (!socket) return

        // Listen for lead created
        socket.on('lead_created', (data) => {
            const notification = {
                id: Date.now(),
                type: 'lead_created',
                message: `New lead "${data.lead.name}" created`,
                read: false,
                timestamp: new Date()
            }
            dispatch(addNotification(notification))
            toast.info(notification.message, { autoClose: 5000 })
        })

        // Listen for lead assigned
        socket.on('lead_assigned', (data) => {
            const notification = {
                id: Date.now(),
                type: 'lead_assigned',
                message: `Lead "${data.lead.name}" assigned to you`,
                read: false,
                timestamp: new Date()
            }
            dispatch(addNotification(notification))
            toast.info(notification.message, { autoClose: 5000 })
        })

        // Listen for activity created
        socket.on('activity_created', (data) => {
            const notification = {
                id: Date.now(),
                type: 'activity_created',
                message: `New ${data.activity.type} on lead "${data.lead.name}"`,
                read: false,
                timestamp: new Date()
            }
            dispatch(addNotification(notification))

            // Show toast for important activities
            if (['Call', 'Meeting', 'Status Change'].includes(data.activity.type)) {
                toast.info(notification.message, { autoClose: 5000 })
            }
        })

        // Listen for user registered (for admins)
        socket.on('user_registered', (data) => {
            if (user?.role === 'Admin' || user?.role === 'Manager') {
                const notification = {
                    id: Date.now(),
                    type: 'user_registered',
                    message: `New user "${data.user.name}" registered as ${data.user.role}`,
                    read: false,
                    timestamp: new Date()
                }
                dispatch(addNotification(notification))
                toast.info(notification.message, { autoClose: 5000 })
            }
        })

        return () => {
            if (socket) {
                socket.off('lead_created')
                socket.off('lead_assigned')
                socket.off('activity_created')
                socket.off('user_registered')
            }
        }
    }, [user, dispatch])
}

