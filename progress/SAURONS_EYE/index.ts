export class SAURONS_EYE {
	public ssr: SOUL_SHARD_REGISTRY;
	constructor(ssr: A = null) {
		this.ssr = ssr;
	}
	public pending = new Map<S, { resolve: (v: U) => V; reject: (e: Error) => V; timer: RET<typeof setTimeout> }>();
	public streams = new Map<S, (chunk: S, done: B) => V>();



	public u = undefined;
	public uuuu = [this.u, this.u, this.u, this.u];
	public UUUU = () => {
		return [this.ssr.s, this.ssr.m, this.ssr.r];
	};
	public uuu = [this.u, this.u, this.u];
	public UUU = () => {
		return [this.ssr.s, this.ssr.m, this.ssr.r];
	};
	public uu = [this.u, this.u];
	public UU = () => {
		return [this.ssr.m, this.ssr.r];
	};
	public online = false;
	public _auth_initialized: B = false;
    public RTRN_TO_SDR = '_RETURN_TO_SENDER'
    public hc_disptacher = '__DISPATCH_ENGINE__'
    public hc_sl_reg = '__THE_PARTICLE_SMASHER__'
    public WARLOCKS_NECROMANCY_OBSERVATORY_CH = 'WARLOCKS_NECROMANCY_OBSERVATORY'
    public GRIMOIRE_OF_VALUES_CH = 'GRIMOIRE_OF_VALUES'
    public readonly QUEUE_KEY = 'staff:sends:offline:queue'
	public defaultPriority: SIG_BUS_Priority = "normal";
	public throttling = false;

	public seen = new Set<S | U32>();
    public MODULE_CACHE = new Map<any, Map<any, Map<any, any>>>();
    public messageCount = new Map<string, number>()
	public history = new Map<string, unknown[]>();
	public globalMiddleware: {
		beforeSend: ((msg: A) => boolean | void | Promise<boolean | void>)[];
		afterSend: ((msg: A, result: unknown) => void | Promise<void>)[];
		beforeReceive: ((msg: A) => boolean | void | Promise<boolean | void>)[];
		afterReceive: ((msg: A, result: unknown) => void | Promise<void>)[];
		onError: ((err: Error, msg?: A) => void | Promise<void>)[];
	} = {
		beforeSend: [],
		afterSend: [],
		beforeReceive: [],
		afterReceive: [],
		onError: [],
	};
	//  public messageCount = new Map<string, number>()
	public get opts(): ScopeOptions {
		return { s: this.ssr.s, m: this.ssr.m, r: this.ssr.r };
	}

	public getKeyed<K, V>(k: K = this.ssr.k, s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._map<A, A>(s, m, r).get(k);
	}
	public keyedMeta<K, V>(k: K = this.ssr.k, s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._meta(s, m, r).get(k);
	}

	public keyedChannels<K, V>(k: K = this.ssr.k, s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._channels(s, m, r).channels.get(k);
	}
	public channels(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._channels(s, m, r).channels as Map<string, Set<CSEHandler>>;
	}
	public sub_channels(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._channels(s, m, r).sub_channels as Map<string, Map<string, Set<CSEHandler>>>;
	}
	public trip_channels(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._channels(s, m, r).trip_channels as Map<string, Map<string, Set<CSEHandler>>>;
	}
	public quad_channels(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._channels(s, m, r).quad_channels as Map<string, Map<string, Set<CSEHandler>>>;
	}
	public getChannelSubs = (r: A = this.ssr.r): Set<CSEHandler> => this.channels().get(r) ?? new Set<CSEHandler>();
	public getSubChannelSubs = (m: A = this.ssr.m, r: A = this.ssr.r): Set<CSEHandler> => {
		const subs = this.sub_channels().get(m);
		return subs?.get(r) ?? new Set<CSEHandler>();
	};
	public getTripChannelSubs = (s: A = this.ssr.s, m: A = this.ssr.m): Set<CSEHandler> => {
		const subs = this.trip_channels().get(s);
		return subs?.get(m) ?? new Set<CSEHandler>();
	};
	public getQuadChannelSubs = (k: A, s: A = this.ssr.s): Set<CSEHandler> => {
		const subs = this.quad_channels().get(k);
		return subs?.get(s) ?? new Set<CSEHandler>();
	};
	public getAllChannelSubs = (r: A = this.ssr.r): Set<CSEHandler> => {
		const out = new Set<CSEHandler>();
		for (const h of this.getChannelSubs(r)) out.add(h);
		return out;
	};
	public getAllSubChannelSubs = (m: A = this.ssr.m, r: A = this.ssr.r): Set<CSEHandler> => {
		const out = new Set<CSEHandler>();
		for (const h of this.getSubChannelSubs(m, r)) out.add(h);
		for (const h of this.getChannelSubs(r)) out.add(h);
		return out;
	};
	public getAllTripChannelSubs = (s: A = this.ssr.s, m: A = this.ssr.m, r: A = this.ssr.r): Set<CSEHandler> => {
		const out = new Set<CSEHandler>();
		for (const h of this.getTripChannelSubs(s, m)) out.add(h);
		for (const h of this.getSubChannelSubs(m, r)) out.add(h);
		for (const h of this.getChannelSubs(r)) out.add(h);
		return out;
	};
	public getAllQuadChannelSubs = (k: A = this.ssr.k, s: A = this.ssr.s, m: A = this.ssr.m, r: A = this.ssr.r): Set<CSEHandler> => {
		const out = new Set<CSEHandler>();
		for (const h of this.getQuadChannelSubs(k, s)) out.add(h);
		for (const h of this.getTripChannelSubs(s, m)) out.add(h);
		for (const h of this.getSubChannelSubs(m, r)) out.add(h);
		for (const h of this.getChannelSubs(r)) out.add(h);
		return out;
	};
	public getExactSubs = (k: A = this.ssr.k, s: A = this.ssr.s): Set<SIG_BUS_Handler> => this.quad_channels().get(k)?.get(s) ?? new Set<SIG_BUS_Handler>();
	public _groups(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState<S, { channels: Set<A>; enabled: B; middleware: ((msg: SIG_BUS_Message) => B | V)[] }>(s, m, r).groups;
	}
	public _queue(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState(s, m, r).queue;
	}
	public _deadLetters(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState(s, m, r).deadLetters;
	}
	public _wildcardSubscriptions(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState(s, m, r).wildcardSubscriptions;
	}
	public _transforms(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState<string, SIG_BUS_Transform[]>(s, m, r).transforms;
	}
	public _encryptionConfigs(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState(s, m, r).encryptionConfigs;
	}
	public _compressionConfigs(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState(s, m, r).compressionConfigs;
	}
	public _durableOffsets(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState<S, number>(s, m, r).durableOffsets;
	}
	public _durableHistory(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState<S, SIG_BUS_Message[]>(s, m, r).durableHistory;
	}
	public _tagSubs(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState<S, Set<SIG_BUS_Handler>>(s, m, r).tagSubs;
	}
	public _tagsByChannel(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState<S, Set<S>>(s, m, r).tagsByChannel;
	}
	public _routeRules(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState<S, Set<S>>(s, m, r).routeRules;
	}
	public _messageCount(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState<S, N>(s, m, r).messageCount;
	}
	public _middleware(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState(s, m, r).middleware;
	}
	public _schemas(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState<string, SIG_BUS_Schema>(s, m, r).schemas;
	}
	public _permissions(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState<string, SIG_BUS_rtPermissions>(s, m, r).permissions;
	}
	public _backpressure(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._msgQState(s, m, r).backpressure;
	}
	public _http(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._adapters(s, m, r).metaMap.http;
	}
	public _cross_boundary(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._adapters(s, m, r).metaMap.cross_boundary;
	}
	public _same_boundary(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._adapters(s, m, r).metaMap.same_boundary;
	}
	public _adapterMetrics(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) {
		return this.ssr._adapters(s, m, r).adapterMetrics;
	}
	public priorityWeight(p?: SIG_BUS_Priority): N {
		if (p === "high") return 3;
		if (p === "low") return 1;
		return 2;
	}
	public listenerCount(event: string, s = this.ssr.s, m = this.ssr.m, r = this.ssr.r): number {
		const _listeners = this.ssr._map(s, m, r);
		const set = _listeners.get(event);
		return set ? set.size : 0;
	}
	public eventNames(s = this.ssr.s, m = this.ssr.m, r = this.ssr.r): string[] {
		const names: string[] = [];

		// QUAD_CHANNEL: k → s → handlers — the user-facing keys
		for (const [k, bySl] of this.quad_channels()) {
			if (s && !bySl.has(s)) continue;
			names.push(k);
		}

		// Fall back to CHANNEL-level keys (r) if quad map is empty for this scope
		if (names.length === 0) {
			for (const [r, set] of this.channels()) {
				if (r && r !== r) continue;
				if (set.size > 0) names.push(r);
			}
		}

		return names;
	}

	_serialExecutor = class {
		private chain: Promise<void> = Promise.resolve();
		enqueue<T>(fn: () => Promise<T>): Promise<T> {
			const run = this.chain.then(fn);
			this.chain = run.then(
				() => undefined,
				() => undefined,
			);
			return run;
		}
		get idle(): Promise<void> {
			return this.chain;
		}
	};
	public executor() {
		return new this._serialExecutor();
	}
	public handlers = {
		getExact: (q: A, s = this.ssr.s, m = this.ssr.m, r = this.ssr.r) => {
			const handlers = this.quad_channels(s, m, r).get(q);
			return handlers;
		},
		matching: (k: string, s = this.ssr.s, m = this.ssr.m, r = this.ssr.r): CSEHandler[] => {
			// 1. handlers whose CHANNEL matches
			const byChannel = new Set<CSEHandler>();
			for (const [ch, set] of this.channels()) {
				if (this.handlers.matchesPattern(ch, r)) for (const h of set) byChannel.add(h);
			}

			// 2. handlers whose CHANNEL and SUB match
			const bySub = new Set<CSEHandler>();
			for (const [sub, chMap] of this.sub_channels()) {
				if (!this.handlers.matchesPattern(sub, m)) continue;
				for (const [ch, set] of chMap) {
					if (!this.handlers.matchesPattern(ch, r)) continue;
					for (const h of set) bySub.add(h);
				}
			}

			// 3. handlers whose SUB and TRIP match
			const byTrip = new Set<CSEHandler>();
			for (const [trip, subMap] of this.trip_channels()) {
				if (!this.handlers.matchesPattern(trip, s)) continue;
				for (const [sub, set] of subMap) {
					if (!this.handlers.matchesPattern(sub, m)) continue;
					for (const h of set) byTrip.add(h);
				}
			}

			// 4. handlers whose TRIP and QUAD match
			const byQuad = new Set<CSEHandler>();
			for (const [quad, tripMap] of this.quad_channels()) {
				if (!this.handlers.matchesPattern(quad, k)) continue;
				for (const [trip, set] of tripMap) {
					if (!this.handlers.matchesPattern(trip, s)) continue;
					for (const h of set) byQuad.add(h);
				}
			}

			// A handler matches only if it is in ALL four candidate sets.
			const out: CSEHandler[] = [];
			for (const h of byChannel) {
				if (bySub.has(h) && byTrip.has(h) && byQuad.has(h)) out.push(h);
			}
			return out;
		},
		list: (k?: string, s?: string, m?: string, r?: string): { r: string; count: number }[] => {
			if (r) {
				const handlers = this.ssr._map<string, Set<A>>(s ?? this.ssr.s, m ?? this.ssr.m, r);
				const set = handlers.get(k ?? this.ssr.k);
				return [{ r, count: set?.size ?? 0 }];
			}
			// no r given — enumerate via the accessor across the current scope
			const out: { r: string; count: number }[] = [];
			for (const [ch] of this.ssr._map<string, Set<A>>(this.ssr.s, this.ssr.m, this.ssr.r)) {
				const set = this.ssr._map<string, Set<A>>(this.ssr.s, this.ssr.m, ch).get(this.ssr.k);
				out.push({ r: ch, count: set?.size ?? 0 });
			}
			return out;
		},
		invoke: async (msg: SIG_BUS_Message): Promise<unknown> => {
			const handlers = this.handlers.matching(msg.k ? msg.k : "[NO_ADP_FOUND]", msg.s, msg.m, msg.r);
			if (handlers.length === 0) return { success: false };
			console.log(handlers, "emitter.invokeHandlers.handlers");

			// transforms (incoming)
			//  msg = await this.applyTransforms(msg, 'incoming')

			const results = await Promise.all(handlers.map((h: A) => Promise.resolve(h(msg.p)).catch(() => ({ success: false }))));
			console.log(results, "emitter.invokeHandlers.results");

			if (results.length === 1) return results[0];

			const merged: Record<string, unknown> = {};
			const collisions: { key: string; r: string }[] = [];

			for (const result of results) {
				if (result === undefined || result === null) continue;

				if (typeof result !== "object") {
					merged["value"] = result;
					continue;
				}

				const r = result as Record<string, unknown>;
				for (const [key, value] of Object.entries(r)) {
					if (key in merged) collisions.push({ key, r: msg.r });
					merged[key] = value;
				}
			}

			if (collisions.length > 0) {
				(merged as A)._cse_collisions = collisions;
			}
			console.log(merged, "emitter.invokeHandlers.merged");

			return Object.keys(merged).length === 0 ? { success: true } : merged;
		},
		matchesPattern: (pattern: string, r: string): boolean => {
			if (pattern === "*") return true;
			if (pattern === r) return true;
			const regex = new RegExp("^" + pattern.replace(/\*/g, "[^:]+(?::[^:]+)*") + "$");
			return regex.test(r);
		},
	};
	public schemas = {
		getAll: (): Record<string, SIG_BUS_Schema> => {
			return Object.fromEntries(this.ssr._msgQState().schemas);
		},
	};
	public groups = {
		create: (name: string, channels: string[] = [], options?: SIG_BUS_GroupOptions): void => {
			this._groups().set(name, {
				channels: new Set(channels),
				enabled: options?.enabled ?? true,
				middleware: options?.middleware ? [options.middleware] : [],
			});
			if (this.ssr.DEVTOOLS_ACTIVE) log(`[HOOK_SYSTEM][SIGNALS][GROUPS][CREATE]`, { msg: "group_created", name }, t.error);
		},
		delete: (name: string): void => {
			this._groups().delete(name);
			if (this.ssr.DEVTOOLS_ACTIVE) log(`[HOOK_SYSTEM][SIGNALS][GROUPS][DELETE]`, { msg: "group_deleted", name }, t.error);
		},
		enable: (name: string): void => {
			const g = this._groups().get(name);
			if (!g) return;
			g.enabled = true;
			if (this.ssr.DEVTOOLS_ACTIVE) log(`[HOOK_SYSTEM][SIGNALS][GROUPS][ENABLE]`, { msg: "group_enabled", name }, t.error);
		},
		disable: (name: string): void => {
			const g = this._groups().get(name);
			if (!g) return;
			g.enabled = false;
			if (this.ssr.DEVTOOLS_ACTIVE) log(`[HOOK_SYSTEM][SIGNALS][GROUPS][DISABLE]`, { msg: "group_disabled", name }, t.error);
		},
		addTo: (name: string, r: string): void => {
			const g = this._groups().get(name);
			if (!g) return;
			g.channels.add(r);
		},
		removeFrom: (name: string, r: string): void => {
			const g = this._groups().get(name);
			if (!g) return;
			g.channels.delete(r);
		},
		use: (name: string, fn: (msg: SIG_BUS_Message) => boolean | void): void => {
			const g = this._groups().get(name);
			if (!g) return;
			g.middleware.push(fn);
		},
		getAll: (): Record<string, { channels: string[]; enabled: boolean; middlewareCount: number }> => {
			const out: Record<string, { channels: string[]; enabled: boolean; middlewareCount: number }> = {};
			for (const [name, g] of this._groups()) {
				out[name] = { channels: [...g.channels], enabled: g.enabled, middlewareCount: g.middleware.length };
			}
			return out;
		},
	};
	public transforms = {
		add: (channelPattern: string, transform: SIG_BUS_Transform): void => {
			const list = this._transforms().get(channelPattern) ?? [];
			list.push(transform);
			this._transforms().set(channelPattern, list);
			if (this.ssr.DEVTOOLS_ACTIVE)
				log(
					`[✘][HOOK_SYSTEM][CHECK_DYNAMIC]`,
					{
						channelPattern,
						msg: "transform_added",
					},
					t.error,
				); //this.emitDevtoolsEvent('transform_added', channelPattern)
		},
		getAll: (): Record<string, SIG_BUS_Transform[]> => {
			return Object.fromEntries(this._transforms());
		},
		apply: async (msg: SIG_BUS_Message, dir: "incoming" | "outgoing"): Promise<SIG_BUS_Message> => {
			for (const [pattern, list] of this._transforms().entries()) {
				if (!this.handlers.matchesPattern(pattern, msg.r)) continue;
				for (const t of list) {
					const fn = dir === "incoming" ? t.incoming : t.outgoing;
					if (!fn) continue;
					msg = await Promise.resolve(fn(msg));
				}
			}
			return msg;
		},
		remove: (channelPattern: string): void => {
			this._transforms().delete(channelPattern);
		},
	};
	public encryption = {
		getConfigs: (): SIG_BUS_EncryptionConfig[] => {
			return [...this._encryptionConfigs()];
		},

		configure: (config: SIG_BUS_EncryptionConfig): void => {
			this._encryptionConfigs().push(config);
			if (this.ssr.DEVTOOLS_ACTIVE) log(`[SIGNALS][ENCRYPTION][CONFIGURE]`, { msg: "encryption_configured", config }, t.deep);
		},

		unwrap: async (msg: A) => {
			if (!msg?.sessionId || !msg?.token) return null;
			const expected = this.encryption.computeHmacSha256(this.ssr._cse_token, msg.sessionId);
			if (msg.token !== expected) return null;
			return msg.p;
		},

		wrap: (p: A) => {
			return {
				sessionId: this.ssr._sessionId,
				token: this.ssr._sessionToken,
				p,
			};
		},

		init: async () => {
			// no dotenv import — read the env directly
			const sk = (typeof process !== "undefined" && process.env?.ENC_TOKEN) || undefined;

			if (sk && sk.length >= 5) {
				// seed the session once, then derive a stable token from it
				this.ssr._cse_token = sk;
				this.ssr._sessionId = this.ssr.crypto.to_hex(this.ssr.crypto.random_bytes(16));
				// computeHmacSha256 is sync-hex on Node; if only WebCrypto is available
				// the async path fills _hmacCache and the sync read picks it up next tick.
				this.ssr._sessionToken = this.encryption.computeHmacSha256(this.ssr._cse_token, this.ssr._sessionId);
				this.ssr._init_sessionToken = !!this.ssr._sessionToken;
			} else {
				if (this.ssr.DEVTOOLS_ACTIVE) log(`[SIGNALS][ENCRYPTION][CONFIGURE]`, { msg: "[!ENC_TOKEN - SIGNALS IS STILL AVAILABLE, IF YOU WOULD LIKE TO ADD A SECURITY LAYER THEN ADD ENC_TOKEN TO .ENV]" }, t.deep);
				this._auth_initialized = false;
			}
		},

		computeHmacSha256: (secret: string, data: string): string => {
			if (!this.ssr.crypto.ready()) return "";
		
			// try the sync path first (Node); catch the "no Node crypto" throw
			let syncResult = "";
			try {
				syncResult = this.ssr.crypto.hash_hmac_hex(secret, data);
			} catch {
				syncResult = "";
			}
			if (syncResult) return syncResult;
		
			// WebCrypto-only: fire async, cache, return "" this tick.
			// cache key must match whatever the sync path will look up next tick.
			const cacheKey =
				this.ssr.crypto.to_hex(this.ssr.crypto.to_utf8_bytes(secret)) + ":" +
				this.ssr.crypto.to_hex(this.ssr.crypto.to_utf8_bytes(data));
		
			this.ssr.crypto.hash_hmac_hex_async(secret, data).then((hex) => {
				this.ssr.crypto._hmacCache.set(cacheKey, hex);
			});
		
			return "";
		},
	};
	public compression = {
		getConfigs: (): SIG_BUS_CompressionConfig[] => {
			return [...this._compressionConfigs()];
		},
		configure: (config: SIG_BUS_CompressionConfig): void => {
			this._compressionConfigs().push(config);
			if (this.ssr.DEVTOOLS_ACTIVE) log(`[SIGNALS][COMPRESSION][CONFIGURE]`, { msg: "compression_configured", config }, t.deep);
		},
	};
	public checkpoints = {
		getAll: (): Record<string, number> => {
			return Object.fromEntries(this._durableOffsets());
		},
	};
	public durable = {
		getHistorySizes: (): Record<string, number> => {
			const out: Record<string, number> = {};
			for (const [ch, hist] of this._durableHistory()) out[ch] = hist.length;
			return out;
		},
	};
	public tags = {
		sub: (tag: string, handler: SIG_BUS_Handler): (() => void) => {
			const set = this._tagSubs().get(tag) ?? new Set<SIG_BUS_Handler>();
			set.add(handler);
			this._tagSubs().set(tag, set);
			if (this.ssr.DEVTOOLS_ACTIVE) log(`[SIGNALS][TAGS][SUB]`, { msg: "tag_subscribed", tag }, t.deep);
			return () => set.delete(handler);
		},
		list: (): string[] => {
			return [...this._tagSubs().keys()];
		},
		listChannels: (tag: string): string[] => {
			const out: string[] = [];
			for (const [ch, tags] of this._tagsByChannel().entries()) {
				if (tags.has(tag)) out.push(ch);
			}
			return out;
		},
	};
	public routes = {
		addRule: (rule: SIG_BUS_RouteRule): void => {
			this._routeRules().push(rule);
			if (this.ssr.DEVTOOLS_ACTIVE) log(`[SIGNALS][ROUTES][ADD_RULE]`, { msg: "route_added", rule }, t.deep);
		},
		removeRule: (name: string): void => {
            const state = this.ssr._msgQState();
            state.routeRules = state.routeRules.filter((r: A) => r.name !== name);
          },
		listRules: (): SIG_BUS_RouteRule[] => {
			return [...this._routeRules()];
		},
	};
	public msgs = {
		getCount: (r: string): number => {
			return this._messageCount().get(r) ?? 0;
		},
	};
	public middleware = {
		list: (): number[] => {
			return [this._middleware().length];
		},
	};
	public channels_ = {
		list: (): string[] => {
			return [...this.ssr._channels(this.ssr.s, this.ssr.m, this.ssr.r).keys()];
		},
		setSchema: (schema: SIG_BUS_Schema, r: string): void => {
			this._schemas().set(r, schema);
		},
		setPermissions: (perms: SIG_BUS_rtPermissions, r: string): void => {
			this._permissions().set(r, perms);
		},
		getSchema: (r: string): SIG_BUS_Schema | null => {
			return this._schemas().get(r) ?? null;
		},
		getPermissions: (r: string): SIG_BUS_rtPermissions | null => {
			return this._permissions().get(r) ?? null;
		},
	};
	public defaultPriority_ = {
		set: (priority: SIG_BUS_Priority): void => {
			this.defaultPriority = priority;
		},
		get: (): SIG_BUS_Priority => {
			return this.defaultPriority;
		},
	};
	public traceCounter = 0;
	public relayCounter = 0;
	private closeHandlers = new Set<() => V>();
	private counters: StreamLabMetrics = {
		dataSent: 0,
		dataAcked: 0,
		dataRetransmitted: 0,
		nackSent: 0,
		nackReceived: 0,
		overflow: 0,
		dlq: 0,
		dropped: 0,
		errors: 0,
		streamsActive: 0,
		streamsCompleted: 0,
		relaySent: 0,
	};
	public h = {
		//HELPERS
		WIRE_VERSION: 1,
		parseEnvelope: (raw: unknown): WireEnvelope | null => {
			if (!raw || typeof raw !== "object") return null;
			const e = raw as Record<string, unknown>;
			if (e.v !== this.h.WIRE_VERSION || typeof e.sid !== "string" || typeof e.seq !== "number") return null;
			return e as unknown as WireEnvelope;
		},
		normCh: (v: string): string => {
			return v.replace(/[\[\]]/g, "").trim();
		},
		fnv1a: (input: string): string => {
			// FNV-1a 32-bit — isomorphic, deterministic, no crypto dependency.
			let h = 0x811c9dc5;
			for (let i = 0; i < input.length; i++) {
				h ^= input.charCodeAt(i);
				h = Math.imul(h, 0x01000193);
			}
			return (h >>> 0).toString(36);
		},
		streamId: (quad: string, trip: string, sub: string, ch: string, name = "stream"): string => {
			const base = [this.h.normCh(quad), this.h.normCh(trip), this.h.normCh(sub), this.h.normCh(ch)].join("|");
			const slug = name.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 20) || "s";
			return `sl_${this.h.fnv1a(`${base}|${name}`)}_${slug}`;
		},
		newEpoch: (): string => {
			return `${Date.now().toString(36)}-${this.h.fnv1a(Math.random().toString(36).slice(2))}`;
		},
		newTrace: (): string => {
			this.traceCounter = (this.traceCounter + 1) >>> 0;
			return `tr-${Date.now().toString(36)}-${this.traceCounter.toString(36)}-${this.h.fnv1a(Math.random().toString(36).slice(2))}`;
		},
		toBase64: (bytes: Uint8Array): string => {
			if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
			let s = "";
			for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
			return btoa(s);
		},
		fromBase64: (b64: string): Uint8Array => {
			if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
			const bin = atob(b64);
			const out = new Uint8Array(bin.length);
			for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
			return out;
		},
		encodePayload: (data: unknown, binary: boolean): { enc: "json" | "base64"; data: unknown } => {
			if (!binary) return { enc: "json", data };
			const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
			return { enc: "base64", data: this.h.toBase64(bytes) };
		},
		decodePayload: (env: WireEnvelope, binary: boolean): unknown => {
			if (binary && env.enc === "base64" && typeof env.data === "string") return this.h.fromBase64(env.data);
			return env.data;
		},
		sleep: (m: number) => new Promise<void>((r) => setTimeout(r, m)),
		isFunc: (v: unknown): v is (...a: never[]) => unknown => {
			return typeof v === "function";
		},
		trackActive: (delta: number) => {
			this.counters.streamsActive = Math.max(0, this.counters.streamsActive + delta);
		},
		normalizeKey: (rawKey: string) => {
			return rawKey.trim().toLowerCase();
		},
	};
	public BACK_END = (() => {
			const fn = () => {};
			fn.run = {
				beforeSend: async (msg: SIG_BUS_Message): P<B> => {
					for (const fn of this.globalMiddleware.beforeSend) {
						const r = await fn(msg);
						if (r === false) return false;
					}
					return true;
				},
				afterSend: async (msg: SIG_BUS_Message, result: U): P<V> => {
					for (const fn of this.globalMiddleware.afterSend) {
						await fn(msg, result);
					}
				},
				beforeReceive: async (msg: SIG_BUS_Message): P<B> => {
					for (const fn of this.globalMiddleware.beforeReceive) {
						const r = await fn(msg);
						if (r === false) return false;
					}
					return true;
				},
				afterReceive: async (msg: SIG_BUS_Message, result: U): P<V> => {
					for (const fn of this.globalMiddleware.afterReceive) {
						await fn(msg, result);
					}
				},
				onError: async (err: Error, msg?: SIG_BUS_Message): P<V> => {
					for (const fn of this.globalMiddleware.onError) {
						await fn(err, msg);
					}
					//  log(`[THE_WIZARD][STAFF][SEND_VIA_ADAPTER]`, {   msg: msg,  transport: `[${msg ? msg.boundary : 'undefined'}]`,  }, t.deep)//this.drop.t.error
				},
				middleware: (msg: SIG_BUS_Message): B => {
					for (const fn of this._middleware()) {
						if (fn(msg) === false) return false;
					}
					// group middleware
					for (const [, g] of this._groups()) {
						if (!g.enabled) continue;
						if (![...g.channels].some((ch) => ssr.se.handlers.matchesPattern(ch, msg.r))) continue;
						for (const fn of g.middleware) {
							if (fn(msg) === false) return false;
						}
					}
					return true;
				},
			};
			
			fn.clean_string = (r: S) => {
				return r.replace(/[\[\]]/g, "");
			};
			fn.getActiveStreams = (): S[] => {
				return [...this.streams.keys()];
			};
			return fn;
	})();



    public async invokeHandler1s(msg: SIG_BUS_Message): P<U> {
        const handlers = this.handlers.matching(msg.k ? msg.k : '[NO_ADP_FOUND]', msg.s, msg.m, msg.r)
        if (handlers.length === 0) return { success: false }

        // transforms (incoming)
        msg = await this.transforms.apply(msg, 'incoming')
        // if (this.DEVTOOLS_ACTIVE) this.emitDevtoolsEvent('transform_applied', msg.rt, msg.ms || undefined, msg.id, { direction: 'incoming' })

        const results = await Promise.all(handlers.map((h: any) => Promise.resolve(h(msg.p)).catch(() => ({ success: false }))))

        if (results.length === 1) return results[0]

        const merged: Record<S, U> = {}
        const collisions: { key: A; rt: S }[] = []

        for (const result of results) {
            if (result === undefined || result === null) continue

            if (typeof result !== 'object') { merged['value'] = result; continue; }

            const r = result as Record<S, U>
            for (const [key, value] of Object.entries(r)) {
                if (key in merged) collisions.push({ key, rt: msg.r })
                merged[key] = value
            }
        }

        if (collisions.length > 0) {
            (merged as A)._cse_collisions = collisions
        }

        return Object.keys(merged).length === 0 ? { success: true } : merged
    }
	// saving but should not be needed 
	public matchingHandlers1() {
		/**k: string, s = this.s, m = this.m, r = this.r
		 * : CSEHandler[]
		const byChannel = new Set<CSEHandler>();
		for (const [ch, set] of this.channels()) {
			if (this.matchesPattern(ch, r)) for (const h of set) byChannel.add(h);
		}

		// 2. handlers whose CHANNEL and SUB match
		const bySub = new Set<CSEHandler>();
		for (const [sub, chMap] of this.sub_channels()) {
			if (!this.matchesPattern(sub, m)) continue;
			for (const [ch, set] of chMap) {
				if (!this.matchesPattern(ch, r)) continue;
				for (const h of set) bySub.add(h);
			}
		}

		// 3. handlers whose SUB and TRIP match
		const byTrip = new Set<CSEHandler>();
		for (const [trip, subMap] of this.trip_channels()) {
			if (!this.matchesPattern(trip, s)) continue;
			for (const [sub, set] of subMap) {
				if (!this.matchesPattern(sub, m)) continue;
				for (const h of set) byTrip.add(h);
			}
		}

		// 4. handlers whose TRIP and QUAD match
		const byQuad = new Set<CSEHandler>();
		for (const [quad, tripMap] of this.quad_channels()) {
			if (!this.matchesPattern(quad, k)) continue;
			for (const [trip, set] of tripMap) {
				if (!this.matchesPattern(trip, s)) continue;
				for (const h of set) byQuad.add(h);
			}
		}

		// A handler matches only if it is in ALL four candidate sets.
		const out: CSEHandler[] = [];
		for (const h of byChannel) {
			if (bySub.has(h) && byTrip.has(h) && byQuad.has(h)) out.push(h);
		}
		return out; */
	}
}
