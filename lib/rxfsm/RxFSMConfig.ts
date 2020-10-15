import { RxState } from './RxState';
import { RxStateContext } from './RxStateContext';

export type RxFSMConfig = {
	initialState: string;
	debug: boolean;
	states?: RxState[];
	ctx?: RxStateContext;
	[key: string]: unknown;
};
