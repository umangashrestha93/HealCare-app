import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  appointments: [
    {
      id: 1,
      practitionerName: 'Dr. Sarah Jenkins',
      discipline: 'Physiotherapy',
      date: '2026-05-10',
      time: '6:30 PM',
      status: 'upcoming',
      type: 'Telehealth'
    },
    {
      id: 2,
      practitionerName: 'Marcus Chen',
      discipline: 'Occupational Therapy',
      date: '2026-05-12',
      time: '5:00 PM',
      status: 'upcoming',
      type: 'In-person'
    }
  ],
  currentBooking: {
    practitioner: null,
    date: null,
    time: null,
    loading: false,
    error: null
  }
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setPractitioner: (state, action) => {
      state.currentBooking.practitioner = action.payload;
    },
    setBookingDetails: (state, action) => {
      state.currentBooking.date = action.payload.date;
      state.currentBooking.time = action.payload.time;
    },
    confirmBooking: (state) => {
      const newAppointment = {
        id: Date.now(),
        practitionerName: state.currentBooking.practitioner.name,
        discipline: state.currentBooking.practitioner.discipline,
        date: state.currentBooking.date,
        time: state.currentBooking.time,
        status: 'upcoming',
        type: state.currentBooking.practitioner.telehealth ? 'Telehealth' : 'In-person'
      };
      state.appointments.push(newAppointment);
      state.currentBooking = initialState.currentBooking;
    },
    cancelAppointment: (state, action) => {
      state.appointments = state.appointments.filter(app => app.id !== action.payload);
    },
    rescheduleAppointment: (state, action) => {
      const { id, date, time } = action.payload;
      const index = state.appointments.findIndex(app => app.id === id);
      if (index !== -1) {
        state.appointments[index].date = date;
        state.appointments[index].time = time;
      }
    }
  }
});

export const { 
  setPractitioner, setBookingDetails, confirmBooking, 
  cancelAppointment, rescheduleAppointment 
} = bookingSlice.actions;

export default bookingSlice.reducer;
