import { BehaviorSubject, Observable } from 'rxjs';
import { filter, pairwise, share } from 'rxjs/operators';
import { RxFSMConfig } from './RxFSMConfig';
import { RxState } from './RxState';
import { RxStateContext } from './RxStateContext';
import { RxAction } from './RxAction';

const defaultConfig: RxFSMConfig = {
	initialState: 'DEFAULT',
	debug: false,
	ctx: {},
};

export class RxFSM {
	private internalState$!: BehaviorSubject<string>;
	private states = new Map<string, RxState>();
	private config: RxFSMConfig;
	private rootCtx: RxStateContext = {};

	public state$ = new Observable<string>();

	get currentState(): RxState {
		return this.getState(this.internalState$.value) as RxState;
	}

	get ctx(): RxStateContext {
		return { ...this.rootCtx };
	}

	get availableTransitions(): RxAction[] {
		return this.currentState.actions;
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

		this.internalState$ = new BehaviorSubject('');
		this.internalState$.pipe(pairwise()).subscribe(([prev, curr]) => this.onInternalStateTransition(prev, curr));
		this.internalState$.next(this.config.initialState);
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
		return this.state$.pipe(filter((state) => state === stateName));
	}

	trigger(eventName: string, data?: unknown): RxFSM {
		const validActions = this.currentState.actions.filter((ct) => ct.event === eventName);
		if (validActions.map((ct) => ct.event).includes(eventName)) {
			const transitionState = validActions.find((ct) => ct.event === eventName)?.target as string;

			validActions
				.filter((vt) => vt.action)
				.forEach((action) =>
					action.action?.call(this, this.currentState.ctx as RxStateContext, this.rootCtx, data)
				);

			if (transitionState) {
				this.transitionState(transitionState);
			}
		}

		return this;
	}

	private hasValidStateTargets(states: RxState[]): void {
		const existingStates = Array.from(this.states.keys());
		const newStates = states.map((s) => s.name);
		const stateNames = new Set(existingStates.concat(newStates));
		const targets = new Set(
			states.flatMap((state) => state.actions.map((action) => action?.target).filter(Boolean))
		);

		targets.forEach((target) => {
			if (!stateNames.has(target as string)) {
				throw new Error(
					`States [${states
						.filter((state) => state.actions.map((a) => a?.target).includes(target))
						.map((state) => state.name)
						.join(',')}] have a target state "${target}" that does not exist`
				);
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
		if (!this.states.has(toStateName)) {
			throw new Error(`To state "${toStateName}" does not exist`);
		}

		if (!this.currentState.actions.map((action) => action.target).includes(toStateName)) {
			throw new Error(`State "${this.currentState.name}" cannot transition to state "${toStateName}".`);
		}

		this.internalState$.next(toStateName);

		return this;
	}

	private onInternalStateTransition(prev: string, curr: string): void {
		const prevState = this.getState(prev) as RxState;

		prevState?.onExit.call(this, curr, prevState.ctx as RxStateContext, this.rootCtx);
		this.currentState.onEnter.call(this, prev, this.currentState.ctx as RxStateContext, this.rootCtx);
	}
}
