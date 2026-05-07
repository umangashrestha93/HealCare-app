import { createSlice } from '@reduxjs/toolkit';
import { MOCK_PRACTITIONERS } from '../../utils/mockData';

const initialState = {
  allPractitioners: MOCK_PRACTITIONERS,
  filteredPractitioners: MOCK_PRACTITIONERS,
  filters: {
    discipline: 'All',
    availability: [], // ['After-Hours', 'Weekends']
    deliveryMode: 'All', // 'All', 'Telehealth', 'In-person'
    searchTerm: ''
  }
};

const practitionerSlice = createSlice({
  name: 'practitioners',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.filteredPractitioners = state.allPractitioners.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(state.filters.searchTerm.toLowerCase()) ||
                          p.discipline.toLowerCase().includes(state.filters.searchTerm.toLowerCase());
        
        const matchDiscipline = state.filters.discipline === 'All' || p.discipline === state.filters.discipline;
        
        const matchTelehealth = state.filters.deliveryMode === 'All' || 
                               (state.filters.deliveryMode === 'Telehealth' && p.telehealth) ||
                               (state.filters.deliveryMode === 'In-person' && !p.telehealth);

        const matchAvailability = state.filters.availability.length === 0 || 
                                 state.filters.availability.every(attr => {
                                   if (attr === 'After-Hours') return p.afterHours;
                                   if (attr === 'Weekends') return p.weekends;
                                   return true;
                                 });

        return matchSearch && matchDiscipline && matchTelehealth && matchAvailability;
      });
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.filteredPractitioners = state.allPractitioners;
    }
  }
});

export const { setFilters, resetFilters } = practitionerSlice.actions;
export default practitionerSlice.reducer;
