import  { MaybePromise } from "../../bag_of_tricks/maybe_promise/index.js";

const _gs = <T = A>(s: A, m?: A, r?: A, k?: A): T | undefined => {
	const g = globalThis as A;
	if (m === undefined && r === undefined && k === undefined) return g[s] as T | undefined;
	return g[r]?.get(m)?.get(s)?.get(k) as T | undefined;
};


let queuedLength = 0;


export class PATCHWERKZ_FEL_HOARDER<t> {
    r: A               = _gs('r_') ?? 'THE_WIZARD_ROOT_REG';
    m: A               = _gs('m_') ?? "SAURON_MASTER_REG";
    s: A               = _gs('s_') ?? "PATCHWERKZ_FEL_HOARDER";
    k: A               = _gs('k_') ?? 'THE_KEY';
	public mc: A =   _gs('THE_WARLOCK_MODULE_CACHE_') ?? `__THE_WARLOCK_MODULE_CACHE__`;

	public root;
	public link;
	public unlink;
	public propagate;
	public checkDirty;
	public shallowPropagate;
	public computed;
	public signal;
	public openScopes = new Set<BatchScope>();
	public dirty = new Set<FlushCallback>();
	public _flushScheduled = false;
	public _adapter: RuntimeAdapter | null = null;
	public _currentHookState: HookState | null = null;
	public _currentComponent: ComponentInstance | null = null;
	public PRIORITY_ORDER: Priority[] = ["immediate", "user-blocking", "normal", "background", "idle"];
	public GLOBAL_SCOPE = Symbol("global-scope");
	public scopeCursors: Record<Priority, number> = { immediate: 0, "user-blocking": 0, normal: 0, background: 0, idle: 0 };
	public currentScope: symbol | string = this.GLOBAL_SCOPE;
	public loopScheduled = false;
	public _subscribers = new Map<string, Set<() => void>>();
	public __subscribers = new Map<string, Map<string, Map<string, Map<SignalKey, Set<(value: A) => void>>>>>();
	//  public _externalSubscribers = new Map<string, Map<string, Map<string, Map<SignalKey, Set<(value: A) => void>>>>>();

	public _components = new Map<string, ComponentInstance>();
	public _pendingNotifications = new Set<string>();
	public externalSubscribers = new Set<() => void>();
	public readonly instanceId: string = `instance_${Date.now()}_${Math.random().toString(36).slice(2)}`;
	public total_cache_size = 5000;
	public cycle = 0;
	public runDepth = 0;
	public batchDepth = 0;
	public notifyIndex = 0;
	public queuedLength = 0;
	HasChildEffect = 64;

	queued: (EffectNode | undefined)[] = [];
	public activeSub: ReactiveNode | undefined;
	u = undefined;
	uuuu = [this.u, this.u, this.u, this.u];
	UUUU = [this.s, this.m, this.r];
	uuu = [this.u, this.u, this.u];
	UUU = [this.s, this.m, this.r];
	uu = [this.u, this.u];
	UU = [this.m, this.r];
	defaultErrorHandler: EffectErrorHandler | null = null;
	public _mainMap = new Map<string | number | symbol, string>();
	public _weakMap = new WeakMap<object, string>();
	public _tupleCache = new Map<string, string>();
	//public _listeners: Map<string, Set<SignalListener>> = new Map();
	public _conflicts: Map<string, ConflictPolicy> = new Map();
	public _causal: Map<string, CausalEntry[]> = new Map();

	public _listeners = new Map<string, Set<Listener>>();
	public _globalListeners = new Map<string, Set<Listener>>();
	public _externalSubscribers = new Map<string, Set<Listener>>();
	public _waiters = new Map<string, Set<Listener>>();

	constructor(root: A = null) {
		this.root = root;
		const self = this;

		function createReactiveSystem({ update, notify, unwatched }: { update(sub: ReactiveNode): boolean; notify(sub: ReactiveNode): void; unwatched(sub: ReactiveNode): void }) {
			return {
				link,
				unlink,
				propagate,
				checkDirty,
				shallowPropagate,
			};

			function link(dep: ReactiveNode, sub: ReactiveNode, version: number): void {
				const prevDep = sub.depsTail;
				if (prevDep !== undefined && prevDep.dep === dep) {
					return;
				}
				const nextDep = prevDep !== undefined ? prevDep.nextDep : sub.deps;
				if (nextDep !== undefined && nextDep.dep === dep) {
					nextDep.version = version;
					sub.depsTail = nextDep;
					return;
				}
				const prevSub = dep.subsTail;
				if (prevSub !== undefined && prevSub.version === version && prevSub.sub === sub) {
					return;
				}
				const newLink =
					(sub.depsTail =
					dep.subsTail =
						{
							version,
							dep,
							sub,
							prevDep,
							nextDep,
							prevSub,
							nextSub: undefined,
						});
				if (nextDep !== undefined) {
					nextDep.prevDep = newLink;
				}
				if (prevDep !== undefined) {
					prevDep.nextDep = newLink;
				} else {
					sub.deps = newLink;
				}
				if (prevSub !== undefined) {
					prevSub.nextSub = newLink;
				} else {
					dep.subs = newLink;
				}
			}
			function unlink(link: Link, sub = link.sub): Link | undefined {
				const { dep, prevDep, nextDep, nextSub, prevSub } = link;
				if (nextDep !== undefined) {
					nextDep.prevDep = prevDep;
				} else {
					sub.depsTail = prevDep;
				}
				if (prevDep !== undefined) {
					prevDep.nextDep = nextDep;
				} else {
					sub.deps = nextDep;
				}
				if (nextSub !== undefined) {
					nextSub.prevSub = prevSub;
				} else {
					dep.subsTail = prevSub;
				}
				if (prevSub !== undefined) {
					prevSub.nextSub = nextSub;
				} else if ((dep.subs = nextSub) === undefined) {
					unwatched(dep);
				}
				return nextDep;
			}
			function propagate(link: Link, innerWrite: boolean): void {
				let next = link.nextSub;
				let stack: Stack<Link | undefined> | undefined;
				top: do {
					const sub = link.sub;
					let flags = sub.flags;
					if (!(flags & (ReactiveFlags.RecursedCheck | ReactiveFlags.Recursed | ReactiveFlags.Dirty | ReactiveFlags.Pending))) {
						sub.flags = flags | ReactiveFlags.Pending;
						if (innerWrite) {
							sub.flags |= ReactiveFlags.Recursed;
						}
					} else if (!(flags & (ReactiveFlags.RecursedCheck | ReactiveFlags.Recursed))) {
						flags = ReactiveFlags.None;
					} else if (!(flags & ReactiveFlags.RecursedCheck)) {
						sub.flags = (flags & ~ReactiveFlags.Recursed) | ReactiveFlags.Pending;
					} else if (!(flags & (ReactiveFlags.Dirty | ReactiveFlags.Pending)) && isValidLink(link, sub)) {
						sub.flags = flags | (ReactiveFlags.Recursed | ReactiveFlags.Pending);
						flags &= ReactiveFlags.Mutable;
					} else {
						flags = ReactiveFlags.None;
					}

					if (flags & ReactiveFlags.Watching) {
						notify(sub);
					}

					if (flags & ReactiveFlags.Mutable) {
						const subSubs = sub.subs;
						if (subSubs !== undefined) {
							const nextSub = (link = subSubs).nextSub;
							if (nextSub !== undefined) {
								stack = { value: next, prev: stack };
								next = nextSub;
							}
							continue;
						}
					}

					if ((link = next!) !== undefined) {
						next = link.nextSub;
						continue;
					}
					while (stack !== undefined) {
						link = stack.value!;
						stack = stack.prev;
						if (link !== undefined) {
							next = link.nextSub;
							continue top;
						}
					}
					break;
				} while (true);
			}
			function checkDirty(link: Link, sub: ReactiveNode): boolean {
				let stack: Stack<Link> | undefined;
				let checkDepth = 0;
				let dirty = false;

				top: do {
					const dep = link.dep;
					const flags = dep.flags;

					if (sub.flags & ReactiveFlags.Dirty) {
						dirty = true;
					} else if ((flags & (ReactiveFlags.Mutable | ReactiveFlags.Dirty)) === (ReactiveFlags.Mutable | ReactiveFlags.Dirty)) {
						const subs = dep.subs!;
						if (update(dep)) {
							if (subs.nextSub !== undefined) {
								shallowPropagate(subs);
							}
							dirty = true;
						}
					} else if ((flags & (ReactiveFlags.Mutable | ReactiveFlags.Pending)) === (ReactiveFlags.Mutable | ReactiveFlags.Pending)) {
						stack = { value: link, prev: stack };
						link = dep.deps!;
						sub = dep;
						++checkDepth;
						continue;
					}
					if (!dirty) {
						const nextDep = link.nextDep;
						if (nextDep !== undefined) {
							link = nextDep;
							continue;
						}
					}
					while (checkDepth--) {
						link = stack!.value;
						stack = stack!.prev;
						if (dirty) {
							const subs = sub.subs!;
							if (update(sub)) {
								if (subs.nextSub !== undefined) {
									shallowPropagate(subs);
								}
								sub = link.sub;
								continue;
							}
							dirty = false;
						} else {
							sub.flags &= ~ReactiveFlags.Pending;
						}
						sub = link.sub;
						const nextDep = link.nextDep;
						if (nextDep !== undefined) {
							link = nextDep;
							continue top;
						}
					}
					return dirty && !!sub.flags;
				} while (true);
			}
			function shallowPropagate(link: Link): void {
				do {
					const sub = link.sub;
					const flags = sub.flags;
					if ((flags & (ReactiveFlags.Pending | ReactiveFlags.Dirty)) === ReactiveFlags.Pending) {
						sub.flags = flags | ReactiveFlags.Dirty;
						if ((flags & (ReactiveFlags.Watching | ReactiveFlags.RecursedCheck)) === ReactiveFlags.Watching) {
							notify(sub);
						}
					}
				} while ((link = link.nextSub!) !== undefined);
			}
			function isValidLink(checkLink: Link, sub: ReactiveNode): boolean {
				let link = sub.depsTail;
				while (link !== undefined) {
					if (link === checkLink) {
						return true;
					}
					link = link.prevDep;
				}
				return false;
			}
		}
		const { link, unlink, propagate, checkDirty, shallowPropagate } = createReactiveSystem({
			update(node: SignalNode | ComputedNode | EffectScopeNode): boolean {
				if ("getter" in node) {
					return self.updateComputed(node);
				}
				if ("currentValue" in node) {
					return self.updateSignal(node);
				}
				node.flags = ReactiveFlags.Mutable;
				return true;
			},
			notify(effect: EffectNode) {
				let insertIndex = queuedLength;
				let firstInsertedIndex = insertIndex;

				do {
					self.queued[insertIndex++] = effect;
					effect.flags &= ~ReactiveFlags.Watching;
					effect = effect.subs?.sub as EffectNode;
					if (effect === undefined || !(effect.flags & ReactiveFlags.Watching)) {
						break;
					}
				} while (true);

				queuedLength = insertIndex;

				while (firstInsertedIndex < --insertIndex) {
					const left = self.queued[firstInsertedIndex];
					self.queued[firstInsertedIndex++] = self.queued[insertIndex];
					self.queued[insertIndex] = left;
				}
			},
			unwatched(node: SignalNode | ComputedNode | EffectNode | EffectScopeNode) {
				if ("getter" in node) {
					if (node.depsTail !== undefined) {
						node.flags = ReactiveFlags.Mutable | ReactiveFlags.Dirty;
						self.disposeAllDepsInReverse(node);
					}
				} else if ("currentValue" in node) {
					// Nothing to do for signals, they are always mutable and never dirty until pendingValue changes
				} else if ("fn" in node) {
					self.effectOper.call(node, node);
				} else {
					self.effectScopeOper.call(node, node);
				}
			},
		});

		function signal<T>(): {
			(): T | undefined;
			(value: T | undefined): void;
		};
		function signal<T>(v: T): {
			(): T;
			(value: T): void;
		};
		function signal<T>(v?: T): { (): T | undefined; (value: T | undefined): void } {
			return self.signalOper.bind({
				value: v,
				currentValue: v,
				pendingValue: v,
				subs: undefined,
				subsTail: undefined,
				flags: ReactiveFlags.Mutable,
			}) as () => T | undefined;
		}

		function computed<T>(getter: (previousValue?: T) => T): () => T {
			return self.computedOper.bind({
				value: undefined,
				subs: undefined,
				subsTail: undefined,
				deps: undefined,
				depsTail: undefined,
				flags: ReactiveFlags.None,
				getter: getter as (previousValue?: unknown) => unknown,
			}) as () => T;
		}

		this.computed = computed;
		this.signal = signal;
		this.link = link;
		this.unlink = unlink;
		this.propagate = propagate;
		this.shallowPropagate = shallowPropagate;
		this.checkDirty = checkDirty;
	}


	public _validateSchema<T>(schema: SignalSchema, value: T): T {
		try {
			const next = schema.coerce ? schema.coerce(value) : value;

			if (schema.validate(next)) {
				return next as T;
			}

			throw new Error("[Sauron] Schema validation failed");
		} catch (error) {
			console.error("[Sauron] Schema validation failed:", error);
			throw error;
		}
	}
	public _resolveConflict<T>(conflict: ConflictPolicy | undefined, previous: T, next: T, strategy: "latest" | "fail" | "accumulate" = "latest"): T | null {
		if (conflict?.resolve) {
			return conflict.resolve(previous, next);
		}

		if (strategy === "fail") {
			console.warn('[Sauron] conflict rejected by "fail" strategy');
			return null;
		}

		if (strategy === "accumulate" && Array.isArray(previous) && Array.isArray(next)) {
			return [...previous, ...next] as T;
		}

		return next;
	}
	flush = (): void => {
		try {
			while (this.notifyIndex < queuedLength) {
				const effect = this.queued[this.notifyIndex]!;
				this.queued[this.notifyIndex++] = undefined;
				this.run(effect);
			}
		} finally {
			while (this.notifyIndex < queuedLength) {
				const effect = this.queued[this.notifyIndex]!;
				this.queued[this.notifyIndex++] = undefined;
				effect.flags |= ReactiveFlags.Watching | ReactiveFlags.Recursed;
			}
			this.notifyIndex = 0;
			queuedLength = 0;
		}
	};
	run = (e: EffectNode): void => {
		const flags = e.flags;
		if (flags & ReactiveFlags.Dirty || (flags & ReactiveFlags.Pending && this.checkDirty(e.deps!, e))) {
			if (flags & this.HasChildEffect) {
				let link = e.depsTail;
				while (link !== undefined) {
					const prev = link.prevDep;
					const dep = link.dep;
					if (!("getter" in dep) && !("currentValue" in dep)) {
						this.unlink(link, e);
					}
					link = prev;
				}
			}
			if (e.cleanup) {
				this.runCleanup(e);
				if (!e.flags) {
					return;
				}
			}
			e.depsTail = undefined;
			e.flags = ReactiveFlags.Watching | ReactiveFlags.RecursedCheck;
			const prevSub = this.setActiveSub(e);
			try {
				++this.cycle;
				++this.runDepth;
				e.cleanup = e.fn();
			} catch (err) {
				const handler = e.onError ?? this.defaultErrorHandler;
				if (handler) handler(err, e);
				else
					queueMicrotask(() => {
						throw err;
					});
			} finally {
				--this.runDepth;
				this.activeSub = prevSub;
				e.flags &= ~ReactiveFlags.RecursedCheck;
				this.purgeDeps(e);
			}
		} else if (e.deps !== undefined) {
			e.flags = ReactiveFlags.Watching | (flags & this.HasChildEffect);
		}
	};
	setActiveSub = (sub?: ReactiveNode) => {
		const prevSub = this.activeSub;
		this.activeSub = sub;
		return prevSub;
	};
	purgeDeps = (sub: ReactiveNode) => {
		const depsTail = sub.depsTail;
		let dep = depsTail !== undefined ? depsTail.nextDep : sub.deps;
		while (dep !== undefined) {
			dep = this.unlink(dep, sub);
		}
	};
	updateComputed = (c: ComputedNode): boolean => {
		if (c.flags & this.HasChildEffect) {
			let link = c.depsTail;
			while (link !== undefined) {
				const prev = link.prevDep;
				const dep = link.dep;
				if (!("getter" in dep) && !("currentValue" in dep)) {
					this.unlink(link, c);
				}
				link = prev;
			}
		}
		c.depsTail = undefined;
		c.flags = ReactiveFlags.Mutable | ReactiveFlags.RecursedCheck;
		const prevSub = this.setActiveSub(c);
		try {
			++this.cycle;
			const oldValue = c.value;
			return oldValue !== (c.value = c.getter(oldValue));
		} finally {
			this.activeSub = prevSub;
			c.flags &= ~ReactiveFlags.RecursedCheck;
			this.purgeDeps(c);
		}
	};
	computedOper = <T,>(that: ComputedNode<T>): T => {
		const flags = that.flags;
		if (flags & ReactiveFlags.Dirty || (flags & ReactiveFlags.Pending && (this.checkDirty(that.deps!, that) || ((that.flags = flags & ~ReactiveFlags.Pending), false)))) {
			if (this.updateComputed(that)) {
				const subs = that.subs;
				if (subs !== undefined) {
					this.shallowPropagate(subs);
				}
			}
		} else if (!flags) {
			that.flags = ReactiveFlags.Mutable | ReactiveFlags.RecursedCheck;
			const prevSub = this.setActiveSub(that);
			try {
				that.value = that.getter();
			} finally {
				this.activeSub = prevSub;
				that.flags &= ~ReactiveFlags.RecursedCheck;
			}
		}
		const sub = this.activeSub;
		if (sub !== undefined) {
			this.link(that, sub, this.cycle);
		}
		return that.value!;
	};
	public signalOper<T>(that: SignalNode<T>, ...value: [T]): T | void {
		if (value.length) {
			if (that.pendingValue !== (that.pendingValue = value[0])) {
				that.flags = ReactiveFlags.Mutable | ReactiveFlags.Dirty;
				const subs = that.subs;
				if (subs !== undefined) {
					this.propagate(subs, !!this.runDepth);
					if (!this.batchDepth) {
						this.flush();
					}
				}
			}
		} else {
			if (that.flags & ReactiveFlags.Dirty) {
				if (this.updateSignal(that)) {
					const subs = that.subs;
					if (subs !== undefined) {
						this.shallowPropagate(subs);
					}
				}
			}
			const sub = this.activeSub;
			if (sub !== undefined) {
				this.link(that, sub, this.cycle);
			}
			return that.currentValue;
		}
	}
	public effectOper(that: EffectNode): void {
		this.effectScopeOper.call(this, that);
		if (that.cleanup) {
			this.runCleanup(that);
		}
	}

	public disposeAllDepsInReverse(sub: ReactiveNode): void {
		let link = sub.depsTail;
		while (link !== undefined) {
			const prev = link.prevDep;
			this.unlink(link, sub);
			link = prev;
		}
	}
	public effectScopeOper(that: EffectScopeNode): void {
		if (that.children) {
			for (const child of that.children) {
				if ("fn" in child) this.effectOper.call(this, child as EffectNode);
				else this.effectScopeOper.call(this, child as EffectScopeNode);
			}
			that.children.clear();
		}
		that.flags = ReactiveFlags.None;
		this.disposeAllDepsInReverse(that);
		const sub = that.subs;
		if (sub !== undefined) this.unlink(sub);
	}
	public atom<T = any>(v: A, key: SignalKey = `__THE_WARLOCK_SIGNALS_${_sid()}`, s = this.s, m = this.m, r = this.r, options?: SignalOptions) {
		const rk = this.create(key, v, options, s, m, r);
		const self = this;
		return {
			get value(): T {
				self._bindComponentToSignal(rk, s, m, r);
				return self.read<T>(rk, s, m, r) as T;
			},
			set value(v: T) {
				self.write(rk, v, "write", s, m, r);
			},
			peek(): T {
				return rk.node;
			},
			get current(): T {
				self._bindComponentToSignal(rk, s, m, r);
				return self.read<T>(rk, s, m, r) as T;
			},
			set current(v: T) {
				self.write(rk, v, "write", s, m, r);
			},
			set crt(v: T) {
				self.write(rk, v, "write", s, m, r);
			},
			set set(v: T) {
				self.write(rk, v, "write", s, m, r);
			},
		};
	}
	public get<T = A>(key: SignalKey, s = this.s, m = this.m, r = this.r): A {
		const resolvedKey = this.resolveKey(key, s, m, r);
		const registry = ssr._map(s, m, r);
		return registry.get(resolvedKey) as SIGNAL_CELL<T> | undefined;
	}
	public create<T = A>(key: SignalKey, v?: T | (() => T), options?: SignalOptions, s = this.s, m = this.m, r = this.r): SIGNAL_CELL<T> | T {
		const resolvedKey = this.resolveKey(key, s, m, r);
		const registry = ssr._map(s, m, r);
		let atom = registry.get(resolvedKey);

		if (atom || v === undefined) {
			return atom as SIGNAL_CELL<T> | T;
		}

		const initialValue = typeof v === "function" ? (v as () => T)() : v;
		atom = new SIGNAL_CELL(resolvedKey, initialValue, options);
		registry.set(resolvedKey, atom);
		return atom as SIGNAL_CELL<T> | T;
	}
	public write<T>(key: SignalKey, value: T | ((previous: T) => T), source = "write", s = this.s, m = this.m, r = this.r): T {
		return this._writeResolved(key, value, source, s, m, r);
	}
	public read<T>(key: SignalKey, s = this.s, m = this.m, r = this.r): T | undefined {
		const rk = this.resolveKey(key, s, m, r);
		const atom = ssr._map(s, m, r).get(rk) as SIGNAL_CELL<T> | undefined;

		return atom?.read();
	}
	public peek<T>(key: SignalKey, s = this.s, m = this.m, r = this.r): T | undefined {
		const rk = this.resolveKey(key, s, m, r);
		const atom = ssr._map(s, m, r).get(rk) as SIGNAL_CELL<T> | undefined;

		return atom?.peek();
	}
	public updateSignal(s: SignalNode): boolean {
		s.flags = ReactiveFlags.Mutable;
		return s.currentValue !== (s.currentValue = s.pendingValue);
	}
	public resolveKey(key: A, s = this.s, m = this.m, r = this.r): SignalKey {
		const atomMap = ssr._map(s, m, r);
		// 1. Arrays / Tuples -> Hash to a structural string key
		if (Array.isArray(key)) {
			return this._hashTuple(key);
		}
		// 2. Existing SIGNAL_CELL lookup by exact key (Symbol, Object reference, String, or Number)
		if (atomMap.has(key)) {
			return key;
		}
		// 3. Return raw key as-is (Map handles Symbol & Object references natively as SignalKey)
		return key;
	}
	public normalizeKey(rawKey: string) {
		return rawKey.trim().toLowerCase();
	}
	public runCleanup(e: EffectNode): void {
		const cleanup = e.cleanup!;
		e.cleanup = undefined;
		const prevSub = this.activeSub;
		this.activeSub = undefined;
		try {
			cleanup();
		} catch (err) {
			const handler = e.onError ?? this.defaultErrorHandler;
			if (handler) handler(err, e);
			else
				queueMicrotask(() => {
					throw err;
				});
		} finally {
			this.activeSub = prevSub;
		}
	}
	public _bindComponentToSignal(rk: string, s = this.s, m = this.m, r = this.r): void {
		const component = this.root.SAURON.getCurrentComponent();
		if (!component) return;
		const hookKey = `${component.id}:signal:${r}:${m}:${s}:${rk}`;
		if (component.hooks.has(hookKey)) {
			return;
		}
		component.hooks.set(hookKey, { value: undefined });

		const atom = this.create(rk, undefined, undefined, s, m, r);
		if (!atom) {
			return;
		}

		const unsubSignal = atom.subscribeExternal(() => {
			this.root.SAURON.notifyHook(hookKey);
		});
		component.unmount.add(unsubSignal);

		if (component.render) {
			const unsubRender = this.root.SAURON.subscribeToHook(hookKey, () => component.render?.());
			component.unmount.add(unsubRender);
		}
	}
	public _serializeTuple(tuple: A[]): string {
		const parts: string[] = new Array(tuple.length);

		for (let i = 0; i < tuple.length; i++) {
			const item = tuple[i];
			const type = typeof item;

			if (item === null) {
				parts[i] = "null";
			} else if (type === "string") {
				parts[i] = `s:${item}`;
			} else if (type === "number") {
				parts[i] = `n:${item}`;
			} else if (type === "symbol") {
				parts[i] = `sym:${item!.description ?? String(item)}`;
			} else if (type === "bigint") {
				parts[i] = `bi:${item!.toString()}`;
			} else if (type === "undefined") {
				parts[i] = "undef";
			} else if (Array.isArray(item)) {
				parts[i] = `arr:[${this._serializeTuple(item)}]`;
			} else if (type === "object" || type === "function") {
				// Store object references cleanly
				let refId = this._weakMap.get(item);
				if (!refId) {
					refId = `ref:${_sid()}`;
					this._weakMap.set(item, refId);
				}
				parts[i] = refId;
			} else {
				parts[i] = `v:${String(item)}`;
			}
		}

		return parts.join("|");
	}
	public _hashTuple(tuple: unknown[]): string {
		const key = this._serializeTuple(tuple);
		const cached = this._tupleCache.get(key);
		if (cached) {
			// Refresh LRU position on access
			this._tupleCache.delete(key);
			this._tupleCache.set(key, cached);
			return cached;
		}

		// Use 64-bit split FNV-1a (or raw string key if total key length is short)
		let h1 = 0x811c9dc5;
		let h2 = 0x01000193;
		for (let i = 0; i < key.length; i++) {
			const code = key.charCodeAt(i);
			h1 = Math.imul(h1 ^ code, 16777619) >>> 0;
			h2 = Math.imul(h2 ^ code, 2246822507) >>> 0;
		}

		const result = `tuple:${h1.toString(36)}-${h2.toString(36)}`;
		this._tupleCache.set(key, result);

		// Evict oldest (true LRU) when over limit
		if (this._tupleCache.size > this.total_cache_size) {
			const toRemove = Math.floor(this._tupleCache.size * 0.2);
			const iter = this._tupleCache.keys();
			for (let i = 0; i < toRemove; i++) {
				const k = iter.next().value;
				if (k !== undefined) this._tupleCache.delete(k);
			}
		}

		return result;
	}
	public _writeResolved<T>(rk: SignalKey, value: A, source: string, s = this.s, m = this.m, r = this.r, cause?: string): T {
		const resolvedKey = this.resolveKey(rk, s, m, r);
		const atom = this.create(resolvedKey, typeof value === "function" ? value() : value, undefined, s, m, r) as SIGNAL_CELL;

		if (!atom) {
			throw new Error(`[Sauron] Cannot write unknown signal "${String(resolvedKey)}"`);
		}

		return atom.write(value, {
			source,
			cause,
			triggerRender: atom.triggerRender,
		});
	}
}



export interface AsyncSignalHandles {
    dataKey: string;
    loadingKey: string;
    errorKey: string;
}
export interface SignalScopeHandle {
    add(key: any): void;
    suspend(): void;
    resume(): void;
    dispose(): void;
    snapshot(): Record<string, any>;
    restore(snapshot: Record<string, any>): void;
    fork(): SignalScopeHandle;
    merge(forked: SignalScopeHandle): void;
}
export type Teardown =
    | void
    | null
    | (() => void)
    | { unsubscribe(): void }
    | { [Symbol.dispose](): void }
    | Teardown[];
export interface Link {
    version: number;
    dep: ReactiveNode;
    sub: ReactiveNode;
    prevSub: Link | undefined;
    nextSub: Link | undefined;
    prevDep: Link | undefined;
    nextDep: Link | undefined;
    bus?: any
    value?: any
    label?: string
}
export interface Stack<T> {
    value: T;
    prev: Stack<T> | undefined;
}
export const enum ReactiveFlags {
    None = 0,
    Mutable = 1,
    Watching = 2,
    RecursedCheck = 4,
    Recursed = 8,
    Dirty = 16,
    Pending = 32,
}
export interface EffectScopeNode extends ReactiveNode {
    onError?: EffectErrorHandler;
    children?: Set<ReactiveNode>;
}
export type EffectErrorHandler = (err: unknown, node: ReactiveNode) => void;
export interface ReactiveNode {
    deps?: Link;
    depsTail?: Link;
    subs?: Link;
    subsTail?: Link;
    flags: ReactiveFlags;
}
export interface AsyncNode<T = any> extends ReactiveNode {
    fetcher: (signal: AbortSignal) => Promise<T>;
    value: T | undefined;
    error: unknown;
    pending: boolean;
    controller: AbortController | null;
    version: number;
    onError?: EffectErrorHandler;
}
export interface EffectNode extends ReactiveNode {
    fn(): (() => void) | void;
    cleanup: (() => void) | void;
    onError?: EffectErrorHandler;
}
export interface ComputedNode<T = any> extends ReactiveNode {
    value: T | undefined;
    getter: (previousValue?: T) => T;
}
export interface SignalNode<T = any> extends ReactiveNode {
    currentValue: T;
    pendingValue: T;
}
export interface SignalScope {
    id: string
    keys: Set<string>
    effects: Set<any>
    suspended: boolean
    pendingFlush: Map<string, any>
}
export type SignalListener = { (value: any, source?: string): void }
export interface SignalLifecycle<T = any> {
    onCreate?: () => void;
    onWrite?: (value: T, prev: T | undefined) => void;
    onRead?: (value: T) => void;
    onDelete?: () => void;
    onFreeze?: () => void;
    onExpire?: () => void;
    onError?: (err: Error) => void;
}
export interface SignalEffect {
    keys: string[];
    fn: (...values: any[]) => (() => void) | void | Promise<(() => void) | void>;
    cleanup: (() => void) | null;
    controller: AbortController | null;
}
export interface AsyncSignalState<T> {
    fetcher: () => Promise<T> | void;
    controller: AbortController | null;
    retryCount: number;
    staleValue?: T;
}
export type ConflictPolicy2<T = any> = | ConflictPolicyName | ((current: T, incoming: T, meta: { key: string; timestamp: number }) => T)
//export interface ConflictPolicy<T = any> { resolve?: (prev: T | undefined, next: T) => T | undefined; }
export interface ConflictPolicy<T = any> { resolve?: (prev: T | undefined, next: T) => T | undefined; }
export interface SignalOptions<T = any> {
    schema?: SignalSchema<T>;
    conflict?: ConflictPolicy<T>;
    history?: { max: number };
    lifecycle?: SignalLifecycle<T>;
    persist?: boolean;
    ttl?: number;
    broadcast?: boolean;
    trigger_render?: boolean;
    conflictStrategy?: any
}
export interface SysEntry {
    read: () => any;
    write: (v: any) => void;
    node: any;
    isComputed: boolean;
}
export interface Metrics {
    readCount: number;
    writeCount: number;
    subscriberCount: number;
    lastWrite: number | null;
    flushDuration: number;
}
export interface SignalHandle<T = any> {
    value: T;
    peek(): T;
}
export interface ComputedHandle<T = any> {
    value: T;
    peek(): T;
}
export interface SignalSchema<T = any> {
    validate: (v: any) => boolean;
    coerce?: (v: any) => T;
}
export interface SignalLifecycle<T = any> {
    onCreate?: () => void;
    onWrite?: (value: T, prev: T | undefined) => void;
    onRead?: (value: T) => void;
    onDelete?: () => void;
    onFreeze?: () => void;
    onExpire?: () => void;
    onError?: (err: Error) => void;
}
export interface SignalEffect {
    keys: string[];
    fn: (...values: any[]) => (() => void) | void | Promise<(() => void) | void>;
    cleanup: (() => void) | null;
    controller: AbortController | null;
}
export interface AsyncSignalState<T = any> {
    fetcher: () => Promise<T> | void;
    controller: AbortController | null;
    retryCount: number;
    staleValue?: T;
}
export interface SignalOptions<T = any> {
    schema?: SignalSchema<T>;
    conflict?: ConflictPolicy<T>;
    history?: { max: number };
    lifecycle?: SignalLifecycle<T>;
    persist?: boolean;
    ttl?: number;
    broadcast?: boolean;
}
export interface SignalTimelineEntry {
    value: any;
    timestamp: number;
    source?: string;
}
export type ConflictPolicyName = 'last-write-wins' | 'first-write-wins' | 'merge' | 'reject-on-conflict' | 'queue'
export interface CausalEntry {
    key: string
    value: any
    timestamp: number
    source?: 'write' | 'effect' | 'derived' | 'staff' | 'ngin' | string
    cause?: string
}
export interface DOMBinding {
    node: Node
    update: (node: Node, value: any) => void
    active?: boolean
}
export interface CallbackHookState extends HookState {
    callback: (...args: any[]) => any
    deps: any[]
}

export function chain<T = any>(value: MaybePromise<T>) { return Promise.resolve(value); }
