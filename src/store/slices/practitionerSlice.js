import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunk to fetch practitioners with backend filtering
export const fetchPractitioners = createAsyncThunk(
  'practitioners/fetchPractitioners',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { filters } = getState().practitioners;
      
      // Map frontend filter state to API query parameters
      const params = {
        keyword: filters.searchTerm,
        discipline: filters.discipline === 'All' ? undefined : filters.discipline,
        telehealth: filters.deliveryMode === 'Telehealth' ? true : filters.deliveryMode === 'In-person' ? false : undefined,
        afterHours: filters.availability.includes('After-Hours') ? true : undefined,
        weekends: filters.availability.includes('Weekends') ? true : undefined,
        page: filters.page || 1,
        limit: 10
      };

      const response = await api.get('/practitioners', { params });
      return response.data; // Now contains { data, pagination, success }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch practitioners');
    }
  }
);

const initialState = {
  practitioners: [],
  pagination: { total: 0, page: 1, pages: 1 },
  loading: false,
  error: null,
  filters: {
    discipline: 'All',
    availability: [],
    deliveryMode: 'All',
    searchTerm: '',
    page: 1
  }
};

const practitionerSlice = createSlice({
  name: 'practitioners',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      // Note: We don't call applyFilters here anymore. 
      // The Marketplace component will trigger a refetch when filters change.
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPractitioners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPractitioners.fulfilled, (state, action) => {
        state.loading = false;
        state.practitioners = action.payload?.data || [];
        state.pagination = action.payload?.pagination || initialState.pagination;
      })
      .addCase(fetchPractitioners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Keep existing practitioners and pagination on error
      });
  }
});

export const { setFilters, resetFilters } = practitionerSlice.actions;
export default practitionerSlice.reducer;
