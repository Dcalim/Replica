import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { MODAL_VIEWS, type ModalView } from '../models/constant'
import { scanFolder } from './files'

const initialState = {
  isUploading: false,
  modalView: MODAL_VIEWS.NONE as ModalView,
  previewClusterKey: null as string | null,
  duplicateFilter: "",
}

const uiReducer = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setIsUploading: (state, action) => {
      state.isUploading = action.payload;
    },
    setModalView: (state, action: PayloadAction<ModalView>) => {
      state.modalView = action.payload;
    },
    setPreviewClusterKey: (state, action: PayloadAction<string | null>) => {
      state.previewClusterKey = action.payload;
    },
    openPreviewModal: (state, action: PayloadAction<string>) => {
      state.modalView = MODAL_VIEWS.PREVIEW;
      state.previewClusterKey = action.payload;
    },
    closeModal: (state) => {
      state.modalView = MODAL_VIEWS.NONE;
      state.previewClusterKey = null;
    },
    setDuplicateFilter: (state, action: PayloadAction<string>) => {
      state.duplicateFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(scanFolder.pending, (state) => {
      state.modalView = MODAL_VIEWS.NONE;
      state.previewClusterKey = null;
    });
  },
});

export const {
  setIsUploading,
  setModalView,
  setPreviewClusterKey,
  openPreviewModal,
  closeModal,
  setDuplicateFilter,
} = uiReducer.actions;
export default uiReducer.reducer;
