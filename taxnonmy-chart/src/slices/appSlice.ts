import { createSlice } from '@reduxjs/toolkit';
import { RootState, Payload } from '../types';

const initialState: RootState = {};

export const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        searchAttorney: (state, { payload }: Payload<string>) => {},
    },
});

export const { searchAttorney } = appSlice.actions;

export default appSlice.reducer;
