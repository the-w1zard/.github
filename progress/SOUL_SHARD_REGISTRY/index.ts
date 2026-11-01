export class SOUL_SHARD_REGISTRY {
	public se: SAURONS_EYE;
	public log: ORC_SHOUT = new ORC_SHOUT();
	public crypto: DISRUPTOR_CRYPTO = new DISRUPTOR_CRYPTO();
	public RIFTS_STORAGE_CONTAINER: RIFTS_STORAGE_CONTAINER
	public S_CLASS_STORAGE_CONTAINER: S_CLASS_STORAGE_CONTAINER
	public k: A = "_THE_WIZARD_";
	public s: S = "_SOUL_SHARD_REGISTRY_";
	public c: S= "sauron"
	public m: S;
	public r: S;
	public RTRN_TO_SDR = "_RETURN_TO_SENDER";
	public hc_disptacher = "__DISPATCH_ENGINE__";
	public hc_sl_reg = "__THE_PARTICLE_SMASHER__";
	public cache_type: CACHE_TYPE;
	public _cse_token: A;
	public _init_sessionToken: A;
	public _sessionToken: A;
	public _sessionId: A;
	public _auth_initialized: B = false;
	public DEVTOOLS_ACTIVE = false;
	public IS_THE_WIZARD = true;
	Bun: A = null;
	Deno: A = null;
	hasBun;
	hasDeno;
	hasNode;
	isBrowser = typeof window !== "undefined";
	isVSCode;
	isElectron;
	isUnix;
	isWindows;
	WS_KEY = USERS_CONFIG.WS_KEY;
	WS_ID = "";
	public ready: P<V>;
	constructor() {
		if (typeof (globalThis as A).Deno !== "undefined") {
			this.Deno = (globalThis as A).Deno;
		}
		if (typeof (globalThis as A).Bun !== "undefined") {
			this.Bun = (globalThis as A).Bun;
		}
		this.hasBun = typeof (globalThis as A).Bun !== "undefined";
		this.hasDeno = typeof (globalThis as A).Deno !== "undefined";
		this.hasNode = typeof process !== "undefined" && !!process.versions?.node;
		this.isVSCode = typeof process !== "undefined" && process.env.VSCODE_PID;
		this.isElectron = false;
		this.isUnix = false;
		this.isWindows = true;
		this.cache_type = USERS_CONFIG.CACHE_TYPE as CACHE_TYPE;
		this.ready = this.INIT();
		this.se = new SAURONS_EYE(this);
		this.m = "";
		this.r = USERS_CONFIG.APP_NAME;

		this.RIFTS_STORAGE_CONTAINER = new RIFTS_STORAGE_CONTAINER(this.k, this.s, this.c, this.m, this.r)
		this.S_CLASS_STORAGE_CONTAINER = new S_CLASS_STORAGE_CONTAINER(this.k, this.s, this.c, this.m, this.r)
	}
	public ds(k: A) {
		return `${k}_SHARD_CACHE`;
	}
	MODULE_CACHE = new Map<A, M<A, M<A, A>>>();

	public _map<K, V>(s: A = this.s, c: CACHE = undefined, m: A = this.m, r: A = this.r): M<A, A> {
		/**let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? (globalThis as A)[r] : null;
		 // let root = (globalThis as A)[r]; //this.MODULE_CACHE.get(r);
		 if (!root) {
			 root = new Map<A, Map<A, Map<A, A>>>();
			 (globalThis as A)[r] = root; // this.MODULE_CACHE.set(r, root);
		 } */
		let ss = null;
		let cc = undefined;
		let mm = null;
		let rr = null;
		if (r !== undefined) { ss = s; cc = c; mm = m; rr = r; } 
		else {ss = s; mm = c; rr = m; }

		let root;
		const cache_type = c !== undefined ? c : this.cache_type;
		switch (cache_type) {
			case "disruptor": { break; }
			case "sclass": {  break    }
			case "rifts": { return  r !== undefined ? root= this.RIFTS_STORAGE_CONTAINER._rifts(ss,cc,mm,rr) :root= this.RIFTS_STORAGE_CONTAINER._rifts(ss,mm,rr); }
			case "cookie": { break; }
			case "scookie": { break; }
			case "kvdb": { break; }
			case "rdb": { break; }
			case "tdb": { break; }
			case "gdb": { break; }
			case "idb": { break; }
			case "bdb": { break; }
			case "hpd": { break; }
			case "cache": { root = MODULE_CACHE; break; }
			case "sauron":
			default: {
				root = (globalThis as A)[rr];
				break;
			}
		}
		if (!root) {
			root = new Map<A, M<A, M<A, A>>>();
			switch (this.cache_type) {
				case "disruptor": { break; }
				case "cookie": { break; }
				case "scookie": { break; }
				case "kvdb": { break; }
				case "rdb": { break; }
				case "tdb": { break; }
				case "gdb": { break; }
				case "idb": { break; }
				case "bdb": { break; }
				case "hpd": { break; }
				case "cache": {
					MODULE_CACHE.clear();
					MODULE_CACHE.set(rr, root);
					break;
				}
				case "sauron":
				default: {
					(globalThis as A)[rr] = root;
					break;
				}
			}
		}
		let masterMap = root.get(mm);
		if (!masterMap) {
			masterMap = new Map<A, M<A, A>>();
			root.set(mm, masterMap);
		}
		if (c !== undefined) {
			// 3. Context Map Lookup
			let contextMap = masterMap.get(cc);
			if (!contextMap) {
				contextMap = new Map<A, MODULE_SLOT>();
				masterMap.set(cc, contextMap);
			}

			// 4. Slave Map Lookup
			let slaveMap = contextMap.get(`${ss}_SAURON`);
			if (!slaveMap) {
				slaveMap = new Map<A, A>();
				contextMap.set(`${ss}_SAURON`, slaveMap);
			}
			return slaveMap;
		} else {
			// 3. Slave Map Lookup
			let slaveMap = masterMap.get(`${ss}_SAURON`);
			if (!slaveMap) {
				slaveMap = new Map<A, A>();
				masterMap.set(`${ss}_SAURON`, slaveMap);
			}
			return slaveMap;
		}
	}

	public _sauron<K, V>(s: A = this.s, m: A = this.m, r: A = this.r): M<A, A> {
		// 1. Root Lookup via Module Cache (Fast path)
		let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? (globalThis as A)[r] : null;
		//let root = (globalThis as A)[r]; //this.MODULE_CACHE.get(r);
		if (!root) {
			root = new Map<A, Map<A, Map<A, A>>>();
			(globalThis as A)[r] = root; // this.MODULE_CACHE.set(r, root);
		}

		// 2. Master Map Lookup
		let masterMap = root.get(m);
		if (!masterMap) {
			masterMap = new Map<A, Map<A, A>>();
			root.set(m, masterMap);
		}

		// 3. Slave Map Lookup
		let slaveMap = masterMap.get(`${s}_SAURON`);
		if (!slaveMap) {
			slaveMap = new Map<A, A>();
			masterMap.set(`${s}_SAURON`, slaveMap);
		}

		return slaveMap;
	}
	public _s_class_rifts<K, V>(s: A = this.s, m: A = this.m, r: A = this.r): M<A, A> {
		// 1. Root Lookup via Module Cache (Fast path)
		let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? (globalThis as A)[r] : null;
		//let root = (globalThis as A)[r]; //this.MODULE_CACHE.get(r);
		if (!root) {
			root = new Map<A, Map<A, Map<A, A>>>();
			(globalThis as A)[r] = root; // this.MODULE_CACHE.set(r, root);
		}

		// 2. Master Map Lookup
		let masterMap = root.get(m);
		if (!masterMap) {
			masterMap = new Map<A, Map<A, A>>();
			root.set(m, masterMap);
		}

		// 3. Slave Map Lookup
		let slaveMap = masterMap.get(`${s}_S_CLASS_RIFTS`);
		if (!slaveMap) {
			slaveMap = new Map<A, A>();
			masterMap.set(`${s}_S_CLASS_RIFTS`, slaveMap);
		}

		return slaveMap;
	}
	public _cloud<K, V>(s: A = this.s, m: A = this.m, r: A = this.r): M<A, A> {
		// 1. Root Lookup via Module Cache (Fast path)
		let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? (globalThis as A)[r] : null;
		//let root = (globalThis as A)[r]; //this.MODULE_CACHE.get(r);
		if (!root) {
			root = new Map<A, Map<A, Map<A, A>>>();
			(globalThis as A)[r] = root; // this.MODULE_CACHE.set(r, root);
		}

		// 2. Master Map Lookup
		let masterMap = root.get(m);
		if (!masterMap) {
			masterMap = new Map<A, Map<A, A>>();
			root.set(m, masterMap);
		}

		// 3. Slave Map Lookup
		let slaveMap = masterMap.get(`${s}_CLOUD`);
		if (!slaveMap) {
			slaveMap = new Map<A, A>();
			masterMap.set(`${s}_CLOUD`, slaveMap);
		}

		return slaveMap;
	}
	public _drc<K, V>(s: A = this.s, m: A = this.m, r: A = this.r): M<A, A> {
		// 1. Root Lookup via Module Cache (Fast path) 
		let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? (globalThis as A)[r] : this.MODULE_CACHE.get(r);;
		//let root = this.MODULE_CACHE.get(r); //this. (globalThis as A)[r]; 
		if (!root) {
			root = new Map<A, Map<A, Map<A, A>>>();
			(globalThis as A)[r] = root; // this.MODULE_CACHE.set(r, root);
		}

		// 2. Master Map Lookup
		let masterMap = root.get(m);
		if (!masterMap) {
			masterMap = new Map<A, Map<A, A>>();
			root.set(m, masterMap);
		}

		// 3. Slave Map Lookup
		let slaveMap = masterMap.get(`${s}_DRC`);
		if (!slaveMap) {
			slaveMap = new Map<A, A>();
			masterMap.set(`${s}_DRC`, slaveMap);
		}

		return slaveMap;
	}
	public _meta(s: A = this.s, m: A = this.m, r: A = this.r) {
		let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? (globalThis as A)[r] : null;
		//let root = (globalThis as A)[r];
		if (!root) {
			root = new Map<A, Map<A, Map<A, A>>>();
			(globalThis as A)[r] = root;
		}

		let masterMap = root.get(m);
		if (!masterMap) {
			masterMap = new Map<A, Map<A, A>>();
			root.set(m, masterMap);
		}

		let metaMap = masterMap.get(`${s}_META`);
		if (!metaMap) {
			metaMap = {
				_sys: new Map<string, SysEntry>(),
				_keyContracts: new Map<string, Set<string>>(),
				_scopes: new Map<string, SignalScope>(),
				_tupleCache: new Map<string, string>(),
				_contracts: new Map<string, { name: string; key: string; postcondition: (next: A, prev: A) => boolean; block: boolean }>(),
				_batches: new Set<string | symbol>(),
				_batchQueue: new Map<string | symbol, A>(),
				_batchOpts: new Map<string | symbol, { triggerRender?: boolean }>(),

				_globalListeners: new Set<(key: string | symbol, value: A) => void>(),
				_global_subscribers: new Map<string, Set<() => void>>(),

				_sealed: new Set<string>(),
				_frozen: new Set<string>(),
				_conflicts: new Map<string, ConflictPolicy>(),
				_conflictStrategies: new Map<string, "latest" | "fail" | "accumulate">(),
				_causal: new Map<string, CausalEntry[]>(),

				_msgHandlers: new Map<string, Set<(p: A) => void>>(),
				_lastWriteSource: new Map<string, string>(),
				_mainMap: new Map<A, string>(),
				_weakMap: new WeakMap<object, string>(),
				_boundaries: new WeakMap<object, string>(),
			};
			masterMap.set(`${s}_META`, metaMap);
		}
		return metaMap;
	} 
	public _mq<K, V>(s: A = this.s, m: A = this.m, r: A = this.r): M<A, A> {
		// 1. Root Lookup via Module Cache (Fast path)
		let root =  (globalThis as A)[r]; //USERS_CONFIG.STATE_CONTEXT === "sauron" ? (globalThis as A)[r] : null;
		//let root =  //this.MODULE_CACHE.get(r);
		if (!root) {
			root = new Map<A, Map<A, Map<A, A>>>();
			(globalThis as A)[r] = root; // this.MODULE_CACHE.set(r, root);
		}

		// 2. Master Map Lookup
		let masterMap = root.get(m);
		if (!masterMap) {
			masterMap = new Map<A, Map<A, A>>();
			root.set(m, masterMap);
		}

		// 3. Slave Map Lookup
		let slaveMap = masterMap.get(`${s}_MQ`);
		if (!slaveMap) {
			slaveMap = new Map<A, A>();
			masterMap.set(`${s}_MQ`, slaveMap);
		}

		return slaveMap;
	}
	public _channels(s: A = this.s, m: A = this.m, r: A = this.r) {
		//let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? (globalThis as A)[r] : null;
		let root = (globalThis as A)[r];
		if (!root) {
			root = new Map<A, Map<A, Map<A, A>>>();
			(globalThis as A)[r] = root;
		}

		let masterMap = root.get(m);
		if (!masterMap) {
			masterMap = new Map<A, Map<A, A>>();
			root.set(m, masterMap);
		}

		let metaMap = masterMap.get(`${s}_CHANNELS`);
		if (!metaMap) {
			metaMap = {
				channels: new Map<string, Set<CSEHandler>>(),
				sub_channels: new Map<string, Map<string, Set<CSEHandler>>>(),
				trip_channels: new Map<string, Map<string, Set<CSEHandler>>>(),
				quad_channels: new Map<string, Map<string, Set<CSEHandler>>>(),
			};
			masterMap.set(`${s}_CHANNELS`, metaMap);
		}
		return metaMap;
	}
	public _msgQState<K, V>(s: A = this.s, m: S = this.m, r: S = this.r) {
		//let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? (globalThis as A)[r] : null;
		let root = (globalThis as A)[r];
		if (!root) {
			root = new Map<A, Map<A, Map<A, A>>>();
			(globalThis as A)[r] = root;
		}

		let masterMap = root.get(m);
		if (!masterMap) {
			masterMap = new Map<A, Map<A, A>>();
			root.set(m, masterMap);
		}

		let metaMap = masterMap.get(`${s}_MSG_Q_STATE`);
		if (!metaMap) {
			metaMap = {
				groups: new Map<A, A>(), // string, { channels: Set<string>; enabled: boolean; middleware: ((msg: SIG_BUS_Message) => boolean | void)[] }
				schemas: new Map<A, A>(), // string, SIG_BUS_Schema
				permissions: new Map<A, A>(), // string, SIG_BUS_rtPermissions
				transforms: new Map<A, A>(), // string, SIG_BUS_Transform[]
				tagSubs: new Map<A, A>(), // string, Set<SIG_BUS_Handler>
				tagsByChannel: new Map<A, A>(), // string, Set<string>
				durableHistory: new Map<A, A>(), // string, SIG_BUS_Message[]
				durableOffsets: new Map<A, A>(), // string, number
				deliveryHandlers: new Set<A>(), // (info: { id: string; status: 'ack' | 'nak'; reason?: string }) => void
				middleware: [] as ((msg: SIG_BUS_Message) => boolean | void)[],
				routeRules: [] as SIG_BUS_RouteRule[],
				queue: [] as SIG_BUS_Message[],
				deadLetters: [] as SIG_BUS_Message[],
				encryptionConfigs: [] as SIG_BUS_EncryptionConfig[],
				compressionConfigs: [] as SIG_BUS_CompressionConfig[],
				messageCount: new Map<A, A>(), // string, number
				backpressure: {} as SIG_BUS_BackpressureConfig,
				wildcardSubscriptions: [] as Array<{ pattern: S; handler: Function }>,
			};
			masterMap.set(`${s}_MSG_Q_STATE`, metaMap);
		}
		return metaMap;
	}
	public _adapters(s: A = this.s, m: A = this.m, r: A = this.r) {
		let root = USERS_CONFIG.STATE_CONTEXT === "sauron" ? (globalThis as A)[r] : null;
		//let root = (globalThis as A)[r];
		if (!root) {
			root = new Map<A, Map<A, Map<A, A>>>();
			(globalThis as A)[r] = root;
		}

		let masterMap = root.get(m);
		if (!masterMap) {
			masterMap = new Map<A, Map<A, A>>();
			root.set(m, masterMap);
		}

		let metaMap = masterMap.get(`${s}_ADAPTERS`);
		if (!metaMap) {
			metaMap = {
				same_boundary: null,
				cross_boundary: null,
				http: null,
				ws: null,
				reliableSocket: null,
				workerThreadAdapter: null,
				webTransportDatagramsAdapter: null,
				webTransportClientAdapter: null,
				webRtcDataChannelHostAdapter: null,
				webRtcDataChannelClientAdapter: null,
				dataChannelAdapter: null,
				startWebTransportServer: null,
				webTransportAdapter: null,
				webRTCAdapter: null,
				sseAdapter: null,
				sharedArrayBufferAdapter: null,
				sharedWorkerAdapter: null,
				serviceWorkerAdapter: null,
				postMessageAdapter: null,
				startNamedPipeBroker: null,
				startMQTTBroker: null,
				mqttAdapter: null,
				messageChannelAdapter: null,
				messageChannel: null,
				http2ClientAdapter: null,
				http2ServerAdapter: null,
				httpAdapter: null,
				electronIPCMainAdapter: null,
				electronIPCRendererAdapter: null,
				nativeMessagingHostAdapter: null,
				nativeMessagingBrowserAdapter: null,
				childProcessAdapter: null,
				broadcastChannelAdapter2: null,
				broadcastChannelAdapter: null,
				atom_adapter: null,
				adapterMetrics: new Map<S, { id: S; total: N; failures: N; totalLatency: N; disabled: B; lastWindow: N; lastCount: N }>(),
			};
			masterMap.set(`${s}_ADAPTERS`, metaMap);
		}
		return metaMap;
	}
	public maps = {
		root: (r = this.r) => {
			return (globalThis as A)[r] as Map<A, A> | undefined;
		},
		master: (m = this.m, r = this.r) => {
			return this.maps.root(r)?.get(m) as Map<A, A> | undefined;
		},
		slave: (s = this.s, m = this.m, r = this.r) => {
			return this.maps.master(m, r)?.get(s) as Map<A, A> | undefined;
		},
	};
	public wipe = {
		_map: (a: number, s = this.s) => {
			if (a === 6 + 6) {
				delete (globalThis as any)[`${s}_SHARD_CACHE`];
			}
		},
		_meta: (a: number, s = this.s) => {
			if (a === 6 + 6) {
				delete (globalThis as any)[`${s}_META`];
			}
		},
		_channels: (a: number, s = this.s) => {
			if (a === 6 + 6) {
				delete (globalThis as any)[`${s}_CHANNELS`];
			}
		},
		_msgQState: (a: number, s = this.s) => {
			if (a === 6 + 6) {
				delete (globalThis as any)[`${s}_MSG_Q_STATE`];
			}
		},
		_adapters: (a: number, s = this.s) => {
			if (a === 6 + 6) {
				delete (globalThis as any)[`${s}_ADAPTERS`];
			}
		},
	};
	_SS_MEMORY = new Map<S, A>();
	async _withLock<T>(key: S, fn: () => T | P<T>): P<T> {
		if (typeof navigator !== "undefined" && navigator.locks) {
			return navigator.locks.request("ss_write_" + key, fn) as Promise<T>;
		}
		return fn();
	}
	getSS(key: S) {
		if (typeof window === "undefined") return;
		const raw = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(key) : null;
		const v = this.crypto.deser(raw);
		return MaybePromise(v);
	}
	async setSS(key: S, value: A) {
		if (typeof window === "undefined") return;
		const serialized = this.crypto.ser(value);
		await this._withLock(key, () => {
			sessionStorage.setItem(key, serialized);
			this._SS_MEMORY.set(key, serialized);
		});
		return value;
	}
	generateId(): S {
		if (typeof crypto !== "undefined" && crypto.getRandomValues) {
			const arr = new Uint32Array(1);
			crypto.getRandomValues(arr);
			return arr[0].toString();
		}
		try {
			const { randomBytes } = require("crypto");
			return randomBytes(4).readUInt32BE(0).toString();
		} catch {
			return Math.floor(Math.random() * 0xffffffff).toString();
		}
	}
	private async get_ws_id(): P<S> {
		if (this.isBrowser) {
			let id = this.getSS(this.WS_KEY);
			if (!id) {
				id = this.generateId();
				this.setSS(this.WS_KEY, id);
			}
			this.WS_ID = id;
			return id;
		}
		if (this.isVSCode) {
			const vscode = require("vscode");
			const name = vscode.workspace.workspaceFolders?.[0]?.name;
			if (name) return name;
			const id = this.generateId();
			this.WS_ID = id;
			return id;
		}
		let cwd: string;
		if (this.hasBun || this.hasNode) {
			cwd = process.cwd();
		} else if (this.hasDeno) {
			cwd = this.Deno.cwd();
		} else {
			throw new Error("Unsupported environment");
		}

		let filePath: string;

		if (this.hasDeno) {
			const currentDir = new URL(".", import.meta.url).pathname;
			const projectRoot = new URL("../../../../../../", import.meta.url).pathname;
			filePath = new URL("the_wizard/wizards_vault/ws_id.txt", projectRoot).pathname;
		} else {
			const path = require("path");
			const currentDir = typeof import.meta?.dirname !== "undefined" ? import.meta.dirname : __dirname;
			const projectRoot = path.resolve(currentDir, "../../../../../../");
			filePath = path.join(projectRoot, "the_wizard", "wizards_vault", "ws_id.txt");
		}

		const readFile = async (): Promise<string | null> => {
			try {
				if (this.hasBun) {
					const file = Bun.file(filePath);
					if (!(await file.exists())) return null;
					return await file.text();
				} else if (this.hasDeno) {
					try {
						await this.Deno.stat(filePath);
						return await this.Deno.readTextFile(filePath);
					} catch {
						return null;
					}
				} else if (this.hasNode) {
					const fs = require("fs");
					if (!fs.existsSync(filePath)) return null;
					return fs.readFileSync(filePath, "utf8");
				}
				return null;
			} catch {
				return null;
			}
		};

		const writeFile = async (data: string) => {
			if (this.hasBun) {
				await Bun.write(filePath, data);
			} else if (this.hasDeno) {
				await this.Deno.writeTextFile(filePath, data);
			} else if (this.hasNode) {
				const fs = require("fs");
				fs.writeFileSync(filePath, data, "utf8");
			}
		};

		let id = await readFile();
		if (id && !isNaN(Number(id))) {
			this.WS_ID = id;
			return id;
		}

		id = this.generateId();
		await writeFile(id);
		this.WS_ID = id;
		return id;
	}
	public async INIT(): Promise<void> {
		if (USERS_CONFIG.ENABLE_GLOBAL_WORKSPACE_CONTEXT === true) {
			this.m = await this.get_ws_id();
		} else {
			this.m = "__SAURON__";
		}
	}
}
