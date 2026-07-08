import { createSlice } from '@reduxjs/toolkit'
import { MODAL_VIEWS } from '../models/constant'

const initialState = {
  isUploading: false,
  modalView: "none"
}

const uiReducer = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setIsUploading: (state, action) => {
      state.isUploading = action.payload;
    },
    setModalView: (state, action) => {
      state.modalView = action.payload;
    },
  },
});

export const { setIsUploading, setModalView } = uiReducer.actions;
export default uiReducer.reducer;
