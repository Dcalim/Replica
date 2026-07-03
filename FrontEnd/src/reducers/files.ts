import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { ScanProgress, ScanResult } from '../types/api'
import apiService from '../services/apiService'
import { ApiError } from '../services/axiosInterceptor'

export const scanFolder = createAsyncThunk(
  'files/scanFolder',
  async (directory: string, { dispatch, rejectWithValue }) => {
    try {
      return await apiService.scanFolderWithProgress(directory, (progress) => {
        dispatch(setScanProgress(progress));
      });
    } catch (error) {
      if (error instanceof ApiError) {
        return rejectWithValue(error.message);
      }

      return rejectWithValue("Scan failed");
    }
  },
);

const initialState = {
    selectedFolderPath: null as string | null,
    duplicateFiles: null as ScanResult | null,
    isScanning: false,
    scanProgress: null as ScanProgress | null,
    error: null as string | null,
}

const filesReducer = createSlice({
    name: 'files',
    initialState,
    reducers: {
        setSelectedFolderPath: (state, action) => {
            state.selectedFolderPath = action.payload;
        },
        setScanProgress: (state, action) => {
            state.scanProgress = action.payload;
        },
        clearScanState: (state) => {
            state.duplicateFiles = null;
            state.scanProgress = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(scanFolder.pending, (state) => {
            state.isScanning = true;
            state.error = null;
            state.scanProgress = {
                phase: "discovering",
                current: 0,
                total: null,
                unit: "folders",
            };
        });
        builder.addCase(scanFolder.fulfilled, (state, action) => {
            state.isScanning = false;
            state.duplicateFiles = action.payload;
            state.scanProgress = null;
        });
        builder.addCase(scanFolder.rejected, (state, action) => {
            state.isScanning = false;
            state.scanProgress = null;
            state.error = typeof action.payload === "string"
                ? action.payload
                : action.error.message ?? "Scan failed";
        });
    },
})

export const { setSelectedFolderPath, setScanProgress, clearScanState } = filesReducer.actions;
export default filesReducer.reducer;
