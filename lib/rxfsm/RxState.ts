import { RxStateContext } from './RxStateContext';
import { RxAction } from './RxAction';

export type RxState = {
	name: string;
	onEnter(from: string, ctx: RxStateContext, rootCtx: RxStateContext): void;
	onExit(to: string, ctx: RxStateContext, rootCtx: RxStateContext): void;
	actions: RxAction[];
	ctx?: RxStateContext;
};
