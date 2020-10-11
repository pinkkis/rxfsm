import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter, share } from 'rxjs/operators';
import { RxFSMConfig } from './RxFSMConfig';
import { RxState } from './RxState';
import { RxTransition } from './RxTransition';

const defaultConfig: RxFSMConfig = {
	initialState: 'DEFAULT',
	debug: false,
};

export class RxFSM {
	private internalState$ = new BehaviorSubject<string>('');
	private states = new Map<string, RxState>();
	private currentTransitions: RxTransition[] = [];
	private config: RxFSMConfig;

	public state$ = new Observable<string>();

	get currentState(): RxState {
		return this.getState(this.internalState$.value) as RxState;
	}

	get availableTransitions(): RxTransition[] {
		return this.currentState.transitions;
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
		if (!this.states.has(this.config.initialState)) {
			throw new Error('The default state does not exist, add that state before initializing');
		}

		if (this.internalState$) {
			this.internalState$.complete();
		}

		const intialState = this.getState(this.config.initialState) as RxState;
		this.currentTransitions = intialState.transitions;
		this.internalState$ = new BehaviorSubject(intialState.name);
		this.state$ = this.internalState$.asObservable().pipe(share());
	}

	addStates(...states: RxState[]): RxFSM {
		this.hasValidStateTargets(states);
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

	trigger(eventName: string): RxFSM {
		if (this.currentTransitions.map((ct) => ct.event).includes(eventName)) {
			this.transitionState(this.currentTransitions.find((ct) => ct.event === eventName)?.target as string);
		}

		return this;
	}

	private hasValidStateTargets(states: RxState[]): void {
		const existingStates = Array.from(this.states.keys());
		const newStates = states.map((s) => s.name);
		const stateNames = new Set(existingStates.concat(newStates));
		const targets = new Set(states.flatMap((state) => state.transitions.map((transition) => transition.target)));

		targets.forEach((target) => {
			if (!stateNames.has(target)) {
				throw new Error(`States have a target state "${target}" that does not exist`);
			}
		});
	}

	private registerState(state: RxState): void {
		this.states.set(state.name, state);
	}

	private getState(stateName: string): RxState | undefined {
		return this.states.get(stateName);
	}

	private transitionState(toStateName: string): RxFSM {
		const toState = this.getState(toStateName);

		if (!toState) {
			throw new Error(`To state "${toStateName}" does not exist`);
		}

		if (!this.currentTransitions.map((ct) => ct.target).includes(toStateName)) {
			throw new Error(`State "${this.currentState.name}" cannot transition to state "${toStateName}".`);
		}

		this.currentState.onExit.call(this, toStateName);
		toState.onEnter.call(this, this.currentState.name);
		this.currentTransitions = toState.transitions;
		this.internalState$.next(toStateName);

		return this;
	}
}
