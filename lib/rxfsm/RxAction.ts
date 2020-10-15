import { RxStateContext } from './RxStateContext';

export type RxAction = {
	event: string;
	target?: string;
	action?: (ctx: RxStateContext, rootCtx: RxStateContext, data?: unknown) => void;
};
