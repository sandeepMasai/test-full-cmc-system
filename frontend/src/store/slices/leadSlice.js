import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../api'

export const fetchLeads = createAsyncThunk(
    'leads/fetchLeads',
    async (filters = {}, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams()
            if (filters.status) params.append('status', filters.status)
            if (filters.assignedToId) params.append('assignedToId', filters.assignedToId)
            if (filters.page) params.append('page', filters.page)
            if (filters.limit) params.append('limit', filters.limit)

            const response = await api.get(`/leads?${params.toString()}`)
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch leads')
        }
    }
)

export const fetchLeadById = createAsyncThunk(
    'leads/fetchLeadById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.get(`/leads/${id}`)
            return response.data.lead
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch lead')
        }
    }
)

export const createLead = createAsyncThunk(
    'leads/createLead',
    async (leadData, { rejectWithValue }) => {
        try {
            const response = await api.post('/leads', leadData)
            return response.data.lead
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create lead')
        }
    }
)

export const updateLead = createAsyncThunk(
    'leads/updateLead',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/leads/${id}`, data)
            return response.data.lead
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update lead')
        }
    }
)

export const deleteLead = createAsyncThunk(
    'leads/deleteLead',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`/leads/${id}`)
            return id
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete lead')
        }
    }
)

const leadSlice = createSlice({
    name: 'leads',
    initialState: {
        leads: [],
        currentLead: null,
        pagination: {
            total: 0,
            page: 1,
            limit: 10,
            pages: 0
        },
        loading: false,
        error: null
    },
    reducers: {
        clearCurrentLead: (state) => {
            state.currentLead = null
        },
        clearError: (state) => {
            state.error = null
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLeads.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchLeads.fulfilled, (state, action) => {
                state.loading = false
                state.leads = action.payload.leads
                state.pagination = action.payload.pagination
            })
            .addCase(fetchLeads.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            .addCase(fetchLeadById.pending, (state) => {
                state.loading = true
            })
            .addCase(fetchLeadById.fulfilled, (state, action) => {
                state.loading = false
                state.currentLead = action.payload
            })
            .addCase(fetchLeadById.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            .addCase(createLead.fulfilled, (state, action) => {
                state.leads.unshift(action.payload)
            })
            .addCase(updateLead.fulfilled, (state, action) => {
                const index = state.leads.findIndex(lead => lead.id === action.payload.id)
                if (index !== -1) {
                    state.leads[index] = action.payload
                }
                if (state.currentLead?.id === action.payload.id) {
                    state.currentLead = action.payload
                }
            })
            .addCase(deleteLead.fulfilled, (state, action) => {
                state.leads = state.leads.filter(lead => lead.id !== action.payload)
            })
    }
})

export const { clearCurrentLead, clearError } = leadSlice.actions
export const selectLeads = (state) => state.leads
export default leadSlice.reducer

