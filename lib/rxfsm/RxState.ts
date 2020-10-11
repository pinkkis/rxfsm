import { RxTransition } from './RxTransition';

export interface RxState {
	name: string;
	onEnter(from: string): void;
	onExit(to: string): void;
	transitions: RxTransition[];
}
