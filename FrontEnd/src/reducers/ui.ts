import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { MODAL_VIEWS, type ModalView } from '../models/constant'
import { clearScanState, scanFolder } from './files'

const initialState = {
  isUploading: false,
  modalView: MODAL_VIEWS.NONE as ModalView,
  previewClusterKey: null as string | null,
  selectedFiles: [] as string[],
  expandedClusters: [] as string[],
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
    toggleFileSelected: (state, action: PayloadAction<string>) => {
      const filePath = action.payload;

      if (state.selectedFiles.includes(filePath)) {
        state.selectedFiles = state.selectedFiles.filter(
          (path) => path !== filePath,
        );
      } else {
        state.selectedFiles.push(filePath);
      }
    },
    setSelectedFiles: (state, action: PayloadAction<string[]>) => {
      state.selectedFiles = action.payload;
    },
    clearSelectedFiles: (state) => {
      state.selectedFiles = [];
    },
    toggleClusterExpanded: (state, action: PayloadAction<string>) => {
      const hash = action.payload;

      if (state.expandedClusters.includes(hash)) {
        state.expandedClusters = state.expandedClusters.filter(
          (id) => id !== hash,
        );
      } else {
        state.expandedClusters.push(hash);
      }
    },
  },
  extraReducers: (builder) => {
    const resetResultsUi = (state: typeof initialState) => {
      state.modalView = MODAL_VIEWS.NONE;
      state.previewClusterKey = null;
      state.selectedFiles = [];
      state.expandedClusters = [];
    };

    builder.addCase(scanFolder.pending, resetResultsUi);
    builder.addCase(clearScanState, resetResultsUi);
  },
});

export const {
  setIsUploading,
  setModalView,
  setPreviewClusterKey,
  openPreviewModal,
  closeModal,
  toggleFileSelected,
  setSelectedFiles,
  clearSelectedFiles,
  toggleClusterExpanded,
} = uiReducer.actions;
export default uiReducer.reducer;
