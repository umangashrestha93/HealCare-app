import { configureStore } from '@reduxjs/toolkit';
import bookingReducer from './slices/bookingSlice';
import practitionerReducer from './slices/practitionerSlice';

export const store = configureStore({
  reducer: {
    booking: bookingReducer,
    practitioners: practitionerReducer
  }
});
