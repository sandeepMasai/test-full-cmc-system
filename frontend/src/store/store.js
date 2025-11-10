import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import leadReducer from './slices/leadSlice'
import notificationReducer from './slices/notificationSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        leads: leadReducer,
        notifications: notificationReducer
    }
})

