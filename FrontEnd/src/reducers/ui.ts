import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isUploading: false,
  showFeedbackModal: false,
}

const uiReducer = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setIsUploading: (state, action) => {
      state.isUploading = action.payload;
    },
    setShowFeedbackModal: (state, action) => {
      state.showFeedbackModal = action.payload;
    },
  },
});

export const { setIsUploading, setShowFeedbackModal } = uiReducer.actions;
export default uiReducer.reducer;
