import { RxState } from './RxState';

export interface RxFSMConfig {
	initialState: string;
	debug: boolean;
	states?: RxState[];
	[key: string]: unknown;
}
