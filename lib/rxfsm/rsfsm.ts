import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, share } from 'rxjs/operators';

export interface RxState {
	name: string;
	onEnter(ctx: RxFSM, from?: RxState): void;
	onExit(ctx: RxFSM, to?: RxState): void;
	targets: string[];
	// children?: RxFSM[];
}

export interface RxFSMConfig {
	defaultState: string;
	debug: boolean;
	states?: RxState[];
	[key: string]: any;
}

const defaultConfig: RxFSMConfig = {
	defaultState: 'DEFAULT',
	debug: false,
};

export class RxFSM {
	private internalState$ = new BehaviorSubject<string>('');

	private states = new Map<string, RxState>();

	private config: RxFSMConfig;

	public state$ = new Observable<string>();

	get currentState(): RxState {
		return this.getState(this.internalState$.value) as RxState;
	}

	get availableTransitions(): string[] {
		return this.currentState.targets;
	}

	constructor(options: Partial<RxFSMConfig> = defaultConfig) {
		this.config = {
			...defaultConfig,
			...options,
		};

		if ((this.config.states as RxState[])?.length > 0) {
			this.addStates(...(this.config.states as RxState[]));
			delete this.config.states;
		}
	}

	init(): void {
		if (!this.states.has(this.config.defaultState)) {
			throw new Error('The default state  does not exist, add that state before initializing');
		}

		if (this.internalState$) {
			this.internalState$.complete();
		}

		const defaultState = this.getState(this.config.defaultState) as RxState;
		this.internalState$ = new BehaviorSubject(defaultState.name);
		this.state$ = this.internalState$.asObservable().pipe(share());
	}

	addStates(...states: RxState[]): RxFSM {
		states.forEach((state) => this.registerState(state));

		return this;
	}

	removeState(state: RxState): RxFSM {
		this.states.delete(state.name);
		return this;
	}

	on(stateName: string): Observable<string> {
		if (this.states.has(stateName)) {
			return this.state$.pipe(filter((state) => state === stateName));
		}
		return of();
	}

	trigger(stateName: string): RxFSM {
		if (this.states.has(stateName)) {
			this.transitionState(this.internalState$.value, stateName);
		} else {
			throw new Error(`State "${stateName}" not found`);
		}

		return this;
	}

	private registerState(state: RxState): void {
		this.states.set(state.name, state);
	}

	private getState(stateName: string): RxState | undefined {
		return this.states.get(stateName);
	}

	private transitionState(fromStateName: string, toStateName: string): RxFSM {
		const fromState = this.getState(fromStateName);
		const toState = this.getState(toStateName);

		if (!fromState) {
			throw new Error(`From state "${fromStateName}: does not exist`);
		}

		if (!toState) {
			throw new Error(`To state "${toStateName}" does not exist`);
		}

		if (!fromState.targets.includes(toStateName)) {
			throw new Error(`State "${fromStateName}" cannot transition to state "${toStateName}".`);
		}

		fromState.onExit(this, toState);
		toState.onEnter(this, fromState);
		this.internalState$.next(toStateName);

		return this;
	}
}
