import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ─── Async Thunks ───────────────────────────────────────────────────────────

export const fetchMyBookings = createAsyncThunk(
  'booking/fetchMyBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err || 'Failed to fetch bookings');
    }
  }
);

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err || 'Failed to create booking');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancelBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      await api.delete(`/bookings/${bookingId}`);
      return bookingId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err || 'Failed to cancel booking');
    }
  }
);

export const fetchAvailableSlots = createAsyncThunk(
  'booking/fetchAvailableSlots',
  async ({ practitionerId, date }, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/availability', {
        params: { practitionerId, date }
      });
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err || 'Failed to fetch slots');
    }
  }
);

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState = {
  appointments: [],
  availableSlots: [],
  slotsLoading: false,
  currentBooking: {
    practitioner: null,
    date: null,
    time: null
  },
  loading: false,
  createLoading: false,
  cancelLoading: null, // holds the ID being cancelled
  error: null
};

// ─── Slice ───────────────────────────────────────────────────────────────────

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setCurrentBooking: (state, action) => {
      state.currentBooking = { ...state.currentBooking, ...action.payload };
    },
    clearBookingError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch bookings
    builder
      .addCase(fetchMyBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload || [];
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create booking
    builder
      .addCase(createBooking.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.createLoading = false;
        state.appointments.push(action.payload);
        state.currentBooking = initialState.currentBooking;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      });

    // Cancel booking
    builder
      .addCase(cancelBooking.pending, (state, action) => {
        state.cancelLoading = action.meta.arg;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.cancelLoading = null;
        // Remove the cancelled booking from local state
        state.appointments = state.appointments.filter(
          a => a._id !== action.payload
        );
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.cancelLoading = null;
        state.error = action.payload;
      });

    // Available slots
    builder
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.slotsLoading = true;
        state.availableSlots = [];
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.slotsLoading = false;
        state.availableSlots = action.payload?.available || [];
      })
      .addCase(fetchAvailableSlots.rejected, (state) => {
        state.slotsLoading = false;
        state.availableSlots = [];
      });
  }
});

export const { setCurrentBooking, clearBookingError } = bookingSlice.actions;
export default bookingSlice.reducer;
