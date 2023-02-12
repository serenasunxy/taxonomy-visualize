import { RootState } from './store';

export const attorneyListSelector = ({ search }: RootState) => search?.attorneyList;
