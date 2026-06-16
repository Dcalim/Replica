import { createSlice } from '@reduxjs/toolkit'
import { VIEWS } from '../models/constant';

const initialState = {
  isUploading: false,
  currentView: VIEWS.UPLOAD,
}

const uiReducer = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setIsUploading: (state, action) => {
      state.isUploading = action.payload;
    },
    setCurrentView: (state, action) => {
      state.currentView = action.payload;
    },
  },
});

export const { setIsUploading, setCurrentView } = uiReducer.actions;
export default uiReducer.reducer;