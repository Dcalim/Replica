import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    selectedFolderPath: null,
    duplicateFiles: [],
    isScanning: false,
    progress: 0,
}

const filesReducer = createSlice({
    name: 'files',
    initialState,
    reducers: {
        setSelectedFolderPath: (state, action) => {
            state.selectedFolderPath = action.payload;
        },
    }
})

export const { setSelectedFolderPath } = filesReducer.actions;
export default filesReducer.reducer;