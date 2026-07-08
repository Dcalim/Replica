import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isUploading: false,
  showSettingsModal: false,
}

const uiReducer = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setIsUploading: (state, action) => {
      state.isUploading = action.payload;
    },
    setShowSettingsModal: (state, action) => {
      state.showSettingsModal = action.payload;
    },
  },
});

export const { setIsUploading, setShowSettingsModal } = uiReducer.actions;
export default uiReducer.reducer;
