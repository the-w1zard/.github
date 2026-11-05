
<div style="display: grid; grid-template-columns: 4fr 2fr; gap: 20px;">
<div>

# `MaybePromise`



# USAGE

Whenever you are using a fn that has maybe promise, it makes our jobs as devs even easier...
1. Do I need the result/value from this?
   - No: then do not await the fn
   - Yes: await the fn

That's it, seriously, that is the entire usage. Full stop, actually you can stop reading right now. IF, you want to learn how to set up your own code so you do not have to create 2 seperate apis... Then I would continue. 


# IMPLEMENTATION

You cannot look at this from any other perspective than... improving the ux. Because when you look at it, especially at first, in any other manner... it simply should not work. Below is the actual maybe promise fn.

```ts
export type MaybePromise<R = any> = R;
export function MaybePromise<R = any>(v: R): MaybePromise {
  return v !== undefined ? v as R : Promise.resolve(v) as Promise<R>
}
```

> [!NOTE] TYPESCRIPT NOT REQUIRED
>
> The above typescript adds to the ergonomics of the solution, but it is not needed in any way shape or form to do any of the following you read about. As it passes ALL tests, with and without the typescript.

Depending on where you are getting it from, there will be a test bed for it so you can actually test it yourself and see how the tests are set up and just how great of an surface area it covers. There were more, but I just thought it was stupid that there were 1000 of them, so I just brought the number down to 100 or so.

In order to take advantage of this, the code has to written a certain way. Not all of it, just where you need it. And to be honest, ever since I had uncovered this and produce the code it requires to work... it genuinely makes sense. 

In order to take advantage of it, you have to push all of the async functionality, to the back of the fn. This is to ensure that the sync work executes first, while the async work is behind a logic gate at the very end. Thinking of it in terms of how you really want your code to execute, or how you should want it to... this is how we should already be coding. 

One note before moving on to the code... the typescript written in maybe promise... is not required for this to actually work. It just increases ergonomics and in some cases to shut typescript right the fuck up.

## JS RUNTIME WINDOW

Javascript does not take into consideration whenever you type await. It could not give any less of a fuck if you code in with defining your fn. It waits till it actually sees a async fn or a promise before triggering the promise process and slowing everything down. 

That is why we must hide all of the async work behind a logic gate. Once it is behind one, javascript cannot execute a promise... becasue OH MAYBE... it might have a change at triggering in this logic gate, so I'll start before the logic to get prepared for it... it does not do that. Why is why the logic gate is important. 

But very simply put, run your sync work first.

Put down a logic gate by if'ing the sync value and returning it... then placing else with all of the async work behind it.

Below I have included a reproducable instruction set for ai's. I got reallly frustrated with them, but in the end had finally got a prompt to work where the ai responded with actual code written exactly the way its supposed to.


> [!IMPORTANT]
>
> FUCK... I just tried teaching and getting several ai's to do this, so that I can create a scripte that autoamtes this process...*sigh*, it went as well as you think it would... SO IF I SEEM A LITTLE FRUSTRATED... and just... on edge... it's not you... it is those fucking ai's man...
>
> ALRIGHT... so now you KINDA know what the fuck MaybePromise is... but how the FUCK do you convert your code over to... take advantage of it everywhere. Because there IS A SET OF REQUIREMENTS THAT NEED TO BE MET...
>
> First lets start with the 'DO NOTS'

```tsx
// let me get some real arrows so I can be super specific...
//                             ↘  ↓  ↓  ↓  ↙ ... fuck off with that shit...
function resolveEnvThenables(): Promise<any>
```

```tsx
//     ↘ ↓ ↓ ↙   ↘  ↓  ↓  ↓  ↓  ↙            ... you guessed it, both of them...
return (async (): Promise<T | F> => {
```

```tsx
//         ↘ ↓ ↓ ↙                           ... yup
const res = await blindImport(moduleName);
```

> [!WARNING]
>
> Fair warning... this is the same guide that I automate my conversions while working with ai. Obviously... there was some frustration, as I was well in the 20-some odd attempts... finally, this version when written exactly as it is... immediately came with a result of 4/4 ai's getting it correct. I am leaving it here as written, because so far... it has a 100% success rate in teaching the ai on what it is that needs to happen, the requirements and how it can go about succesfully converting the code for you despite not having a single example it can reference off of within its own training data. With saying that... expect swear swords.
>
> Basically, if you use async, Promise or await... ANYWHERE... just throw it out.
>
> Which means everything has to be converted into a promise. That is just the first requirement.
>
> REQUIREMENTS
> 1. NO USE OF ASYNC, AWAIT OR DEFINING THE TYPE PROMISE IE PROMISE< T >
> 2. ALL PROMISE WORK HAS TO BE MOVED, TO THE END OF THE FN OR THE BACK OF THE BUS IF YOU WILL
> 3. ALL PROMISE FUNCTIONALITY MUST BE BEHIND A LOGIC GATE
> ... that's it, it is simple... but it does go against literally everything you have been taught on how to program for the last... 15 years.
>
> Lets do an example, of what we need to convert... followed by what some asshole ai had attemted to give me, which is just another example on exactly what NOT to do... followed by the correct example.


> [!WARNING] A LOGIC GATE
>
> A LOGIC GATE... NOT AN EARLY FUCKING RETURN... A FUCKING LOGIC GATE

```tsx
if (syncFuckingValue) {
  return MaybePromise(syncFuckingValue)
} else {
  return MaybePromise(
  // START THE FUCKING PROMISE NOW AS IT IS BEHIND A LOGIC GATE... FUCK
  // DO NOT USE ASYNC
  // DO NOT USE AWAIT
  // DO NOT DEFINE THE FUNCTION BODY WITH A PROMISE TYPE DEFINITION
  // A PROMISE... FOR THE FUCKING LOVE OF GOD... A FUCKING PROMISE...
  )
}
// FUCK...
```

### WHAT WE NEED TO CONVERT
```tsx
async function CONJURATION_LIBS_UNCACHED<T = any, F = any>(options: OptionalImportOptions<T, F>,): Promise<T | F> {
  const {
    moduleName,
    fallback: rawFallback,
    comp_name,
    module = true,
    preferRequire = false,
    importPromise,
    ...userEnvImports
  } = options;
  const fallback = normalizeFallback<F>(rawFallback, createSafeProxy as () => F);
  const forceNode = userEnvImports.force !== undefined;

  // moduleName-less, direct-promise path — for local files with no
  // package name to resolve. Mirrors APPRENTICE_CONJURER_LIBS' own
  // importPromise branch, just reachable from the public API now.
  if (!module || (importPromise && !moduleName)) {
    if (importPromise) {
      try {
        const resolved = await importPromise;
        if (resolved !== null && resolved !== undefined) return resolved;
      } catch { /* fall through to userEnvImports scan below */ }
    }
    for (const value of Object.values(userEnvImports)) {
      if (value && typeof value === 'object' && typeof (value as any).then === 'function') {
        try {
          const result = await value;
          if (result !== null && result !== undefined) return result;
        } catch { continue; }
      }
    }
    return fallback() as unknown as F;
  }

  const resolveImportCandidate = async (candidate: any) => {
    if (!candidate) return null;
    try {
      const resolved = typeof candidate.then === 'function' ? await candidate : candidate;
      return resolved ?? null;
    } catch { return null; }
  };

  const state = disruptor? disruptor.useCell(ENV_CHANNEL, ENV_SUB_CHANNEL, ENV_STATE_DEFAULT): null;
  const priorityKeys = [...state.adapters, ...state.compilers, state.moduleLevel, state.platform, state.bundler];

  for (const key of priorityKeys) {
    if (key && userEnvImports[key]) {
      const res = await resolveImportCandidate(userEnvImports[key]);
      if (res !== null) return res as unknown as F;
    }
  }

  if (userEnvImports.default) { const res = await resolveImportCandidate(userEnvImports.default); if (res !== null) return res as unknown as F; }

  if (moduleName) {
    if (forceNode) {
      try {
        const res = typeof forceNode === 'function' ? (forceNode as () => F)() : forceNode;
        if (res !== null && res !== undefined) return res as unknown as F;
      } catch { }
    } else if (moduleName && comp_name) {
      if (blindRequire && is_require_available) {
        try {
          const res = blindRequire(moduleName);
          if (res && res[comp_name] !== undefined) return res[comp_name] as unknown as F
        } catch { }
      } else {
        try {
          const res = await blindImport(moduleName);
          if (res && res[comp_name] !== undefined) return res[comp_name] as unknown as F
        } catch { }
      }
    } else if (preferRequire && blindRequire) {
      try {
        const res = blindRequire(moduleName);
        if (res !== null && res !== undefined) return res as unknown as F;
      } catch { }
    } else if (!preferRequire && blindRequire && (state.bundler === 'bun' || state.compilers.includes('electron') || typeof process !== 'undefined') && is_require_available) {
      try {
        const res = blindRequire(moduleName);
        if (res !== null && res !== undefined) return res as unknown as F;
      } catch { }
    } else if (is_require_available && blindRequire) {
      try {
        const res = blindRequire(moduleName);
        if (res !== null && res !== undefined) return res as unknown as F;
      } catch { }
    } else {
      try {
        const res = await blindImport(moduleName);
        if (res !== null && res !== undefined) return res as unknown as F;
      } catch { }
    }
  }

  return fallback() as unknown as F;
}
```

### WHAT NOT TO DO 
```tsx
function CONJURATION_LIBS_UNCACHED<T = any, F = any>(
	options: OptionalImportOptions<T, F>,
): Promise<T | F> {
	const {
		moduleName,
		fallback: rawFallback,
		comp_name,
		module = true,
		preferRequire = false,
		importPromise,
		...userEnvImports
	} = options;
	const fallback = normalizeFallback<F>(rawFallback, createSafeProxy as () => F);
	const forceNode = userEnvImports.force !== undefined;

	if (!module || (importPromise && !moduleName)) {
		return runAsyncTail();
	}

	const state = disruptor
		? disruptor.useCell(ENV_CHANNEL, ENV_SUB_CHANNEL, ENV_STATE_DEFAULT)
		: null;
	const priorityKeys = state
		? [...state.adapters, ...state.compilers, state.moduleLevel, state.platform, state.bundler]
		: [];

	for (const key of priorityKeys) {
		if (key && userEnvImports[key]) {
			const v = userEnvImports[key];
			if (v && typeof v === 'object' && typeof (v as any).then === 'function') {
				return runAsyncTail();
			}
			if (v !== null && v !== undefined) {
				return Promise.resolve(v as unknown as F);
			}
		}
	}

	if (userEnvImports.default) {
		const v = userEnvImports.default;
		if (v && typeof v === 'object' && typeof (v as any).then === 'function') {
			return runAsyncTail();
		}
		if (v !== null && v !== undefined) {
			return Promise.resolve(v as unknown as F);
		}
	}

	if (moduleName) {
		if (forceNode) {
			try {
				const res =
					typeof forceNode === 'function'
						? (forceNode as () => F)()
						: forceNode;
				if (res !== null && res !== undefined) {
					return Promise.resolve(res as unknown as F);
				}
			} catch {
			}
		} else if (comp_name) {
			if (blindRequire && is_require_available) {
				try {
					const res = blindRequire(moduleName);
					if (res && res[comp_name] !== undefined) {
						return Promise.resolve(res[comp_name] as unknown as F);
					}
				} catch {
				}
			}
			return runAsyncTail();
		} else if (preferRequire && blindRequire) {
			try {
				const res = blindRequire(moduleName);
				if (res !== null && res !== undefined) {
					return Promise.resolve(res as unknown as F);
				}
			} catch {
			}
			return runAsyncTail();
		} else if (
			!preferRequire &&
			blindRequire &&
			state &&
			(state.bundler === 'bun' ||
				state.compilers.includes('electron') ||
				typeof process !== 'undefined') &&
			is_require_available
		) {
			try {
				const res = blindRequire(moduleName);
				if (res !== null && res !== undefined) {
					return Promise.resolve(res as unknown as F);
				}
			} catch {
			}
			return runAsyncTail();
		} else if (is_require_available && blindRequire) {
			try {
				const res = blindRequire(moduleName);
				if (res !== null && res !== undefined) {
					return Promise.resolve(res as unknown as F);
				}
			} catch {
			}
			return runAsyncTail();
		} else {
			return runAsyncTail();
		}
	}

	return Promise.resolve(fallback() as unknown as F);

	function runAsyncTail(): Promise<T | F> {
		if (!module || (importPromise && !moduleName)) {
			const chain: Promise<any> = importPromise
				? Promise.resolve(importPromise).then(
						(resolved) =>
							resolved !== null && resolved !== undefined
								? resolved
								: scanEnvThenables(),
						() => scanEnvThenables(),
					)
				: scanEnvThenables();

			return chain.then(
				(v) => (v !== null && v !== undefined ? (v as F) : (fallback() as unknown as F)),
			);
		}

		return resolveEnvThenables()
			.then((envHit) => (envHit !== null ? envHit : resolveModuleAsync()))
			.then(
				(v) => (v !== null && v !== undefined ? (v as F) : (fallback() as unknown as F)),
			);


		function scanEnvThenables(): Promise<any> {
			const values = Object.values(userEnvImports);
			const thenables = values.filter(
				(v) =>
					v && typeof v === 'object' && typeof (v as any).then === 'function',
			) as Promise<any>[];
			if (thenables.length === 0) return Promise.resolve(null);

			return thenables.reduce<Promise<any>>(
				(acc, p) =>
					acc.then((found) => {
						if (found !== null && found !== undefined) return found;
						return Promise.resolve(p).then(
							(r) => (r !== null && r !== undefined ? r : null),
							() => null,
						);
					}),
				Promise.resolve(null),
			);
		}

		function resolveEnvThenables(): Promise<any> {
			return priorityKeys
				.reduce<Promise<any>>((acc, key) => {
					return acc.then((found) => {
						if (found !== null && found !== undefined) return found;
						const v = key && userEnvImports[key];
						if (!v) return null;
						if (typeof (v as any).then !== 'function') {
							return v !== null && v !== undefined ? v : null;
						}
						return Promise.resolve(v as Promise<any>).then(
							(r) => (r !== null && r !== undefined ? r : null),
							() => null,
						);
					});
				}, Promise.resolve(null))
				.then((found) => {
					if (found !== null && found !== undefined) return found;
					const d = userEnvImports.default;
					if (!d) return null;
					if (typeof (d as any).then !== 'function') {
						return d !== null && d !== undefined ? d : null;
					}
					return Promise.resolve(d as Promise<any>).then(
						(r) => (r !== null && r !== undefined ? r : null),
						() => null,
					);
				});
		}

		function resolveModuleAsync(): Promise<any> {
			if (!moduleName) return Promise.resolve(null);

			if (comp_name && !(blindRequire && is_require_available)) {
				return Promise.resolve(blindImport(moduleName)).then(
					(res: any) =>
						res && res[comp_name] !== undefined ? res[comp_name] : null,
					() => null,
				);
			}

			if (
				(preferRequire && blindRequire) ||
				(is_require_available && blindRequire) ||
				(!preferRequire &&
					blindRequire &&
					state &&
					(state.bundler === 'bun' ||
						state.compilers.includes('electron') ||
						typeof process !== 'undefined'))
			) {
				return Promise.resolve(blindImport(moduleName)).then(
					(res: any) => (res !== null && res !== undefined ? res : null),
					() => null,
				);
			}

			return Promise.resolve(blindImport(moduleName)).then(
				(res: any) => (res !== null && res !== undefined ? res : null),
				() => null,
			);
		}
	}
}
```

### WHAT THE FINAL PRODUCT SHOULD LOOK LIKE
```tsx
function CONJURATION_LIBS_UNCACHED<T = any, F = any>(options: OptionalImportOptions<T, F>) {
	const { moduleName, fallback: rawFallback, comp_name, module = true, preferRequire = false, importPromise, ...userEnvImports } = options;
	const fallback = normalizeFallback<F>(rawFallback, createSafeProxy as () => F);
	const forceNode = userEnvImports.force !== undefined;

	const state = disruptor ? disruptor.useCell(ENV_CHANNEL, ENV_SUB_CHANNEL, ENV_STATE_DEFAULT) : null;
	const priorityKeys = state ? [...state.adapters, ...state.compilers, state.moduleLevel, state.platform, state.bundler] : [];
  
  const resolveImportCandidate = async (candidate: any) => {
    if (!candidate) return null;
    try {
      const resolved = typeof candidate.then === 'function' ? await candidate : candidate;
      return resolved ?? null;
    } catch { return null; }
  };

	let syncResult: any = undefined;
	let needsAsync = false;

	if (!module || (importPromise && !moduleName)) {
		if (importPromise && typeof (importPromise as any).then !== "function") {
			syncResult = importPromise;
		} else if (importPromise) {
			needsAsync = true;
		} else {
			for (const value of Object.values(userEnvImports)) {
				if (value && typeof value === "object" && typeof (value as any).then === "function") {
					needsAsync = true;
					break;
				}
				if (value !== null && value !== undefined) {
					syncResult = value;
					break;
				}
			}
			if (!needsAsync && syncResult === undefined) {
				syncResult = fallback();
			}
		}
	} else {
		for (const key of priorityKeys) {
			if (key && userEnvImports[key]) {
				const v = userEnvImports[key];
				if (v && typeof v === "object" && typeof (v as any).then === "function") {
					needsAsync = true;
					break;
				}
				if (v !== null && v !== undefined) {
					syncResult = v;
					break;
				}
			}
		}

		if (!needsAsync && syncResult === undefined && userEnvImports.default) {
			const v = userEnvImports.default;
			if (v && typeof v === "object" && typeof (v as any).then === "function") {
				needsAsync = true;
			} else if (v !== null && v !== undefined) {
				syncResult = v;
			}
		}

		if (!needsAsync && syncResult === undefined && moduleName) {
			if (forceNode) {
				try {
					const res = typeof forceNode === "function" ? (forceNode as () => F)() : forceNode;
					if (res !== null && res !== undefined) syncResult = res;
					else needsAsync = true;
				} catch {
					needsAsync = true;
				}
			} else if (comp_name) {
				if (blindRequire && is_require_available) {
					try {
						const res = blindRequire(moduleName);
						if (res && res[comp_name] !== undefined) syncResult = res[comp_name];
						else needsAsync = true;
					} catch {
						needsAsync = true;
					}
				} else {
					needsAsync = true;
				}
			} else if (preferRequire && blindRequire) {
				try {
					const res = blindRequire(moduleName);
					if (res !== null && res !== undefined) syncResult = res;
					else needsAsync = true;
				} catch {
					needsAsync = true;
				}
			} else if (!preferRequire && blindRequire && state && (state.bundler === "bun" || state.compilers.includes("electron") || typeof process !== "undefined") && is_require_available) {
				try {
					const res = blindRequire(moduleName);
					if (res !== null && res !== undefined) syncResult = res;
					else needsAsync = true;
				} catch {
					needsAsync = true;
				}
			} else if (is_require_available && blindRequire) {
				try {
					const res = blindRequire(moduleName);
					if (res !== null && res !== undefined) syncResult = res;
					else needsAsync = true;
				} catch {
					needsAsync = true;
				}
			} else {
				needsAsync = true;
			}
		}

		if (!needsAsync && syncResult === undefined) {
			syncResult = fallback();
		}
	}

  // AND BAM... All sync work is now complete... NOW let us throw down a logic gate so that we can meet the other req's
  // We first attempt to return the sync result... just like how it is defined in MaybePromise, followed by the promise functionality...
  // this is A HARD FUCKING REQUIREMENT... This is because javascript does not trigger async work TILL it ACTUALLY see the promised code, so it DOES NOT TRIGGER... SIMPLY WALKING OVER AWAIT at the start of the function... the same goes for async... BUT not all runtimes play nicely... so to ensure this happen everywhere without any errors whats so ever... we lock it behind a logic gate as well, because when javascript executes the code... it can see and view everything except what is behind that logic gate. Thus... allowing us to hide the async functionality, that when triggered fucks our execution right up and slows everything down...

	if (syncResult) {
		return MaybePromise(syncResult);
	} else {
		return MaybePromise(
			(() => {
				const timeoutMs = 10000;
				return new Promise<T>((resolve, reject) => {
					let timer: ReturnType<typeof setTimeout> | undefined;
					if (!module || (importPromise && !moduleName)) {
						if (importPromise) {
							const resolved = importPromise;
							if (resolved !== null && resolved !== undefined) {
								if (timer) clearTimeout(timer);
								resolve(resolved);
								return;
							}
						}

						for (const value of Object.values(userEnvImports)) {
							if (value && typeof value === "object" && typeof (value as any).then === "function") {
								try {
									const result = value;
									if (result !== null && result !== undefined) {
										if (timer) clearTimeout(timer);
										resolve(result);
										return;
									}
								} catch {
									continue;
								}
							}
						}
					}

					if (moduleName) {
						if (moduleName && comp_name) {
							const res = await blindImport(moduleName);
							if (res && res[comp_name] !== undefined) {
								resolve(res[comp_name]) as unknown as F;
								if (timer) clearTimeout(timer);
								return;
							}
						} else {
							const res2 = blindImport(moduleName);
							if (res2 !== null && res2 !== undefined) {
								resolve(res2) as unknown as F;
								if (timer) clearTimeout(timer);
								return;
							}
						}
					}
					if (userEnvImports.default) {
						const res = resolveImportCandidate(userEnvImports.default);
						if (res !== null) {
							resolve(res) as unknown as F;
							if (timer) clearTimeout(timer);
							return;
						}
					}
					if (timeoutMs) {
						timer = setTimeout(() => {
							reject(new Error(`[rift] wait() timed out after ${timeoutMs}ms`));
						}, timeoutMs);
					}
				});
			})(),
		);
	}
}
```

> [!NOTE]
>
> Can you get away with not following all the requirements?... Yes and no... but I can promise you one thing, it will not be succesfull 100% of the time... sooo I hope this makes the requirements clear when converting your code... I apoligize for the anger and frustration... but I hope you can feel for me as I had just attempted teaching 4 different ai's this method of conversion... so I'm going to give them this and hopefully, finger crossed... this attempt works, and I will report back on it because if I can teach an ai on something it literally has ZERO references to go by within its dataset... then I have truly made it so any one can follow along and understand how the process works.



## TYPESCRIPT PRANK

> [!IMPORTANT] First time round, we pulled a fast one on javascripts runtime... NOW... its typescripts turn...
>
> Because of maybe promise...
> 1. we have increased ergonomics at each of our defined call sites.
> 2. we have entirely removed the need/requirement to build and manange an entirely second api for solutions, as this places both async and sync javascript runtime contracts... and placing them with in a single function, WHILE AT THE SAME TIME... with a 100% sucess rate, no errors, no weirdness, and even increased performance as a side effect, we wil be coming back to this part shortly.
> 3. less of a mental / context load of what to use, when to use it and which piece to use in relation to where it ends up being defined
> 4. exploits a very small gap in javascripts runtime, which in effect leads to even more benefits but you can read more on this down below...
>
> This note... is related to an entirely... differently problem that this same exploit also solves. And let me tell you, it solves it in such a gratifying way...
> 
> Picture this, ya?... You don't have the most surface are to paly with in terms of code placement where you are... In addition to THAT problem, you don't have any possible way... of placing, exactly what it is that you need here due to the contract around the function body your currently coding inside of... doesn't happen often, when you get this stuck and your stumped... staring at it, if only I could use x... welllllll...
>
> [ME] 'Oh... would you look at that...' *stares at the ground over yonder real hard...*
>
> [typescript] 'Look... look at what?... I don't see anything, you know I LITEREALLY... cannot fall for that, right? My contracts are so wound up... they are tighter than... ALL the nuns assholes...'
>
> [ME] *stares at it harder... sees a twitch from typescript... slowly I lift my arm, 'over there... you don't see it... what's wrong with you old man, getting too damn old eh? It IS pretty obvious, its RIGHT there...' Points at the 'thing' even harder.*
>
> [typescript] *takes a real good look at you... staring you down..., 'As I said, don't be trying any of that funny businesss, you hear me?'*
>
> [ME] 'What are you so paranoid about old man?... you said it yourself, your asshole is to wound up to get anything past you...' *turns real hard to look at the same spot again... I just simpy don't move, finally typescript inches closer to get a better look at, whatever it is that your fucking staring at... and just... just when he inches JUST ENOUGH by you, like the flash you pivot and bolt, yeling behind ya, 'HA... YOINK BITCH!'
>
> [typescript] *starts to try to run after you, but is a feeble old man..., 'GET BACK HERE, YOU GOD DAMN SON OF A BITCH...'
>
> Literally... it is... almost entirely like that... it is so satisfying, lol...
>
> Let's take my weird bus as the example since that is where I ended up finding it. Looking at it... there is no possible way for this function... to meet the requirements of maybe promise and satisfy what it needs, in order for it to truly work. First of all... we only have... A SINGLE ASYNC FUNCTION. How the fuck are we going to feel typescript in letting us... basically... some fucking how... squeeze enough lemon out of this desert rock... to make enough juice... that is the sweetness that is, sync functionality.

```tsx
public async send(p: unknown, k: string, sl = this.sl, ms = this.ms, rt = this.rt, ttl?: number, binary = false): Promise<unknown> {
  const msgId = `[${rt}][${ms}][${sl}][${k}][${this._staffId()}]`.replace(/[.\[\]]/g, match => match === '.' ? '_' : '');
  const msg: CSE_Multiplexed_Msg = {
    id: msgId,
    rt,
    ms: ms,
    sl: sl,
    k: k,
    p: { p },
    ttl,
    ts: Date.now(),
    _ack: false,
    priority: this.defaultPriority,
    binary
  }

  if (!(await this.runBeforeSend(msg))) return { success: false, blocked: true }
  const result = await this.dispatch(msg)
  await this.runAfterSend(msg, result)
  return result
}
```
> [!IMPORTANT] 
>
> Haha... there IS NOTHING SYNC ABOUT IT... YOU COULD NOT FIND A MORE ASYNC LIKE FUNCTION THAN THAT. It literally has 100% coversage, that is entirely async. The ONLY things that AREN'T... are literally the console.logging functions that are the dev events...
>
> BUT HEY... We can NOW, define the call site... as if it were a sync function, pulling a fast, and hard one on typescript. 
>
> Because... boi is it fucking cheeky on how we pull this off. AND BTW... it passes the test suite... 100% through and through. Which means, it is rock solid in terms of what we can expect from it in terms of results, whenever we use it.
>
> What's the cheeky, immature... prank that we pulled on typescript to get what we want?

```tsx
public send<T = A>(p: U, k: S, s = this.s, m = this.m, r = this.r, chain?: CHAIN, adapter = "disruptor") {
	const msgId = this._byteid();
	const msg: SIG_BUS_Message = { id: msgId, rt: r, ms: m, sl: s, k: k, p: { p }, ts: Date.now(), _ack: false };

	let v: MaybePromise = this.DISPATCH(msg, adapter);
	if (v !== undefined && !(v instanceof Promise)) {
		return MCR_Combo(v, chain);
	} else {
		const timeoutMs = 5000 
		return MaybePromise(
			(() => {
				return new Promise<T>((resolve, reject) => {
					let timer: RET<typeof setTimeout> | UD;
					if (v) {
						if (timer) clearTimeout(timer);
							resolve(v as T);
							return;
						}
						if (timeoutMs) {
							timer = setTimeout(() => {
								reject(new Error(`[rift] wait() timed out after ${timeoutMs}ms`));
							}, timeoutMs);
						}
					});
				})(),
			);
		}
	}
```
> [!IMPORTANT] 
>
> You would be 100% correct in saying, 'but dude... it... IS an async fn... that will never work...'
>
> JUST LIKE with maybe prommise, trust me, I'm a fucking wizard... just hear me out...
>
> Yes it is 100% through and through a async fn, AND becuuse of the level of benefits we get from this singular async fn, it will never change.
>
> BUT in terms of what typescript CAN ACTUALLY SEE there is nothing wrong with this picture.
>
> The promise is locked behind a logic gate, in effect making typescript none the wiser that there is IN FACT A FUCKING PROMISE CONTRACT HIDDEN THERE.
>
> NOW, if you guessed that WE ARE LITERALLY DOING WHAT I USED IN THAT REDICULOUS EXAMPLE, you are correct. 
>
> There is 100% going to be times where, we simply only need a fire and forget... without await attached to it, so by giving typescript something to focus on, a big fat lie, but that's ok. When we use it like this, we don't really care if we get the value back, there will be times we don't even want it back so, it is as if we are sacrifcing a constant that we assigned... for the greater good.
>
> As you will notice, the logic gate changed ever so slightly... SOMETHING TO WATCH OUT FOR HERE, for all you 'any' haters out there, you HAVE TO... define that let, with any, because that logic gate, as it sits... will not let you run it without it. Actually, you could ACTUALLY stick maybe promise there too... 
>
> The gate checks to see IF it is NOT undefined... which ofcourse 100% of the time... this logic gate will fail due to the second condition since dispatch returns a promise 100% of the time... Effectively turning the gate AND the value, as a herring to succesfully and entirely distract typescript with a lie. Letting us execute the fn and take off running and the message gets to where you sent it... meanwhile, your herring is left stuck there returned with, what is most of the time, a shit fucking value to hold. But this time we welcome the returned promise... thank-you javascript, for teeing us up to fake out typescript. *gives a good ol'thumbs up* haha
>
> Removes the sync/async decision entirely. One name, one function, one return. Works as both a type and a value. Callers `await` if they want the value and don't if they don't — both work, always. Every platform that ships `readFile` *and* `readFileSync`, `getItem` *and* `getItemAsync`, `query` *and* `querySync` can ship one function instead.














</div>
<div style="font-size: 9px;  text-align: right">


## <span style="font-size: 10.5px;"> ⇦✦──⇦✦──✦──✦──←'pew pew'<span> <span style="font-size: 24px;"> 🧙 [TOC] <span>


 

<details style="font-size: 14.5px;"><summary><strong><span style="font-size: 16px; font-family: monospace">[PLATFORM]</span> </strong></summary>

- [TOC](../platform/TOC.md#TOC)
- [ATOM](../platform/ATOM.md#ATOM)
- [CELLS](../platform/CELLS.md#CELLS)
- [CONVERGENCE](../platform/CONVERGENCE.md#CONVERGENCE)
- [FORMS](../platform/FORMS.md#FORMS)
- [GLOBAL_QUAD_KEY_CONTEXT](../platform/GLOBAL_QUAD_KEY_CONTEXT.md#GLOBAL_QUAD_KEY_CONTEXT)
- [PERFORMANCE_DIVISION](../platform/PERFORMANCE_DIVISION.md#PERFORMANCE_DIVISION)
- [REACTIVITY](../platform/REACTIVITY.md#REACTIVITY)
- [ROUTE_COMPONENTS](../platform/ROUTE_COMPONENTS.md#ROUTE_COMPONENTS)
- [SAURON](../platform/SAURON.md#SAURON)
- [SIGNALS](../platform/SIGNALS.md#SIGNALS)
- [STAFF](../platform/STAFF.md#STAFF)
- [THE_WARLOCK_MODE](../platform/THE_WARLOCK_MODE.md#THE_WARLOCK_MODE)
- [THE_WIZARD_MODE](../platform/THE_WIZARD_MODE.md#THE_WIZARD_MODE)
- [WARLOCKS_NECROMANCY_OBSERVATORY](../platform/WARLOCKS_NECROMANCY_OBSERVATORY.md#WARLOCKS_NECROMANCY_OBSERVATORY)

</details>

<details style="font-size: 14.5px;"><summary><strong><span style="font-size: 16px; font-family: monospace">[MESSAGE QUEUES / BUSES]</span> </strong></summary>

- [DISRUPTOR](../platform/TOC.md#TOC)
- [STAFF](../platform/ATOM.md#ATOM)
- [CHAINS](../platform/CELLS.md#CELLS)
- [XXSR TRICKY](../platform/CONVERGENCE.md#CONVERGENCE)


</details>

<details style="font-size: 14.5px;"><summary><strong><span style="font-size: 16px; font-family: monospace">[PLATFORM PRIMTIVES]</span> </strong></summary>

- [API_WARDS](../primitives/API_WARDS.md#API_WARDS)
- [APPARATIONS_DQ](../primitives/APPARATIONS_DQ,md#APPARATIONS_DQ)
- [ARCHETYPES](../primitives/ARCHETYPES.md#ARCHETYPES)
- [BATCH](../primitives/BATCH.md#BATCH)
- [BINARY](../primitives/BINARY.md#BINARY)
- [CHAINS](../primitives/CHAINS.md#CHAINS)
- [CHRONO_SHIFT](../primitives/CHRONO_SHIFT.md#CHRONO_SHIFT)
- [CHRONOMANCER](../primitives/CHRONOMANCER.md#CHRONOMANCER)
- [CONJURE_LIBRARIES](../primitives/CONJURE_LIBRARIES.md#CONJURE_LIBRARIES)
- [CONJURE_MIMIC](../primitives/CONJURE_MIMIC.md#CONJURE_MIMIC)
- [CRON](../primitives/CRON.md#CRON)
- [DARK_PORTALS](../primitives/DARK_PORTALS.md#DARK_PORTALS)
- [DUPLEX_STREAMS](../primitives/DUPLEX_STREAMS.md#DUPLEX_STREAMS)
- [EMITTER](../primitives/EMITTER.md#EMITTER)
- [EVOCATIONS](../primitives/EVOCATIONS.md#EVOCATIONS)
- [EXECUTE_MASTER](../primitives/EXECUTE_MASTER.md#EXECUTE_MASTER)
- [GATE_MASTER](../primitives/GATE_MASTER.md#GATE_MASTER)
- [GATES](../primitives/GATES.md#GATES)
- [GLYPH_BINDER](../primitives/GLYPH_BINDER.md#GLYPH_BINDER)
- [GOLEMS](../primitives/GOLEMS.md#GOLEMS)
- [GRIMOIRE](../primitives/GRIMOIRE.md#GRIMOIRE)
- [ILLUSIONIST](../primitives/ILLUSIONIST.md#ILLUSIONIST)
- [INCANTATIONS](../primitives/INCANTATIONS.md#INCANTATIONS)
- [JOBS](../primitives/JOBS.md#JOBS)
- [MACHINES_MACHINE](../primitives/MACHINES_MACHINE.md#MACHINES_MACHINE)
- [MICROTASKS](../primitives/MICROTASKS.md#MICROTASKS)
- [MSGS](../primitives/MSGS.md#MSGS)
- [NO_NO_SQUARE_DQ](../primitives/NO_NO_SQUARE_DQ.md#NO_NO_SQUARE_DQ)
- [PERFORMANCE_TIMER](../primitives/PERFORMANCE_TIMER.md#PERFORMANCE_TIMER)
- [PLINKO_MASTER](../primitives/PLINKO_MASTER.md#PLINKO_MASTER)
- [PRIORITY](../primitives/PRIORITY.md#PRIORITY)
- [RDB](../primitives/RDB.md#RDB)
- [RENDERIVITY_DQ](../primitives/RENDERIVITY_DQ.md#RENDERIVITY_DQ)
- [RETRY_MASTER](../primitives/RETRY_MASTER.md#RETRY_MASTER)
- [RUNE_HTTP](../primitives/RUNE_HTTP.md#RUNE_HTTP)
- [S_CLASS](../primitives/S_CLASS.md#S_CLASS)
- [SCHEDULER](../primitives/SCHEDULER.md#SCHEDULER)
- [SENTINELmd](../primitives/SENTINELmd#SENTINELmd)
- [SESSION_SIGIL](../primitives/SESSION_SIGIL.md#SESSION_SIGIL)
- [SPEELBOOK](../primitives/SPEELBOOK.md#SPEELBOOK)
- [TIERED_QUEUE](../primitives/TIERED_QUEUE.md#TIERED_QUEUE)
- [TIME_MACHINE](../primitives/TIME_MACHINE.md#TIME_MACHINE)
- [TOME_OF_SECRETS](../primitives/TOME_OF_SECRETS.md#TOME_OF_SECRETS)
- [TRANSMOGRIFY](../primitives/TRANSMOGRIFY.md#TRANSMOGRIFY)
- [TYPES_MACHINE](../primitives/TYPES_MACHINE.md#TYPES_MACHINE)
- [TYR](../primitives/TYR.md#TYR)
- [VAULTS](../primitives/VAULTS.md#VAULTS)
- [VENOM](../primitives/VENOM.md#VENOM)
- [WARDS](../primitives/WARDS.md#WARDS)
- [WIZARD_KEEP](../primitives/WIZARD_KEEP.md#WIZARD_KEEP)
- [WORKERS](../primitives/WORKERS.md#WORKERS)
- [WORKFLOW](../primitives/WORKFLOW.md#WORKFLOW)

</details>

<details style="font-size: 14.5px;"><summary><strong><span style="font-size: 16px; font-family: monospace">[SOLUTIONS]</span> </strong></summary>

- [BATCH](../solutions/BATCH.md#BATCH)
- [CELLS](../solutions/CELLS.md#CELLS)
- [CHEERIO](../solutions/CHEERIO.md#CHEERIO)
- [CIRCUIT_BREAKER](../solutions/CIRCUIT_BREAKER.md#CIRCUIT_BREAKER)
- [COMPRESSION](../solutions/COMPRESSION.md#COMPRESSION)
- [CONCURRENT](../solutions/CONCURRENT.md#CONCURRENT)
- [CQRS](../solutions/CQRS.md#CQRS)
- [DEBOUNCE](../solutions/DEBOUNCE.md#DEBOUNCE)
- [DEFER](../solutions/DEFER.md#DEFER)
- [DEV_TOOLS](../solutions/DEV_TOOLS.md#DEV_TOOLS)
- [DIFFPATCH](../solutions/DIFFPATCH.md#DIFFPATCH)
- [DISTRBUTED_EXE](../solutions/DISTRBUTED_EXE.md#DISTRBUTED_EXE)
- [DISTRIBUTED_LOGIC_GATES](../solutions/DISTRIBUTED_LOGIC_GATES.md#DISTRIBUTED_LOGIC_GATES)
- [DISTRIBUTED_PORTAL](../solutions/DISTRIBUTED_PORTAL.md#DISTRIBUTED_PORTAL)
- [DISTRIBUTED_REACTIVE_STATE](../solutions/DISTRIBUTED_REACTIVE_STATE.md#DISTRIBUTED_REACTIVE_STATE)
- [DRS](../solutions/DRS.md#DRS)
- [EMPHEMRAL_STATE](../solutions/EMPHEMRAL_STATE.md#EMPHEMRAL_STATE)
- [FULL_TEXT_SEARCH](../solutions/FULL_TEXT_SEARCH.md#FULL_TEXT_SEARCH)
- [HTTP_CLIENT](../solutions/HTTP_CLIENT.md#HTTP_CLIENT)
- [LOGIC_GATES](../solutions/LOGIC_GATES.md#LOGIC_GATES)
- [LONGPOLL](../solutions/LONGPOLL.md#LONGPOLL)
- [LWW](../solutions/LWW.md#LWW)
- [MV](../solutions/MV.md#MV)
- [OPTIMISTIC](../solutions/OPTIMISTIC.md#OPTIMISTIC)
- [OR](../solutions/OR.md#OR)
- [PERFORMANCE_TIMER](../solutions/PERFORMANCE_TIMER.md#PERFORMANCE_TIMER)
- [PN](../solutions/PN.md#PN)
- [QUEUE_TIERED](../solutions/QUEUE_TIERED.md#QUEUE_TIERED)
- [RAFT](../solutions/RAFT.md#RAFT)
- [RATE_LIMIT](../solutions/RATE_LIMIT.md#RATE_LIMIT)
- [REACTIVE_CHAINS](../solutions/REACTIVE_CHAINS.md#REACTIVE_CHAINS)
- [REVERSE_HEART_BEAT_MGR](../solutions/REVERSE_HEART_BEAT_MGR.md#REVERSE_HEART_BEAT_MGR)
- [RIFTS](../solutions/RIFTS.md#RIFTS)
- [RIFT_MAELSTROM](../solutions/RIFT_MAELSTROM.md#RIFT_MAELSTROM)
- [SEMAPHORE](../solutions/SEMAPHORE.md#SEMAPHORE)
- [SEND_SUB](../solutions/SEND_SUB.md#SEND_SUB)
- [SIGNALS](../solutions/SIGNALS.md#SIGNALS)
- [SPREADSHEET](../solutions/SPREADSHEET.md#SPREADSHEET)
- [SSE](../solutions/SSE.md#SSE)
- [STAFF](../solutions/STAFF.md#STAFF)
- [STREAMS](../solutions/STREAMS.md#STREAMS)
- [SWR](../solutions/SWR.md#SWR)
- [TEMPORAL_SHIFT](../solutions/TEMPORAL_SHIFT.md#TEMPORAL_SHIFT)
- [THROTTLE](../solutions/THROTTLE.md#THROTTLE)
- [WIRE_TAPS](../solutions/WIRE_TAPS.md#WIRE_TAPS)
- [WORKSPACE_GLOBAL](../solutions/WORKSPACE_GLOBAL.md#WORKSPACE_GLOBAL)
- [WS](../solutions/WS.md#WS)
- [XXSR](../solutions/XXSR.md#XXSR)
- [YATA](../solutions/YATA.md#YATA)
- [YIMIR](../solutions/YIMIR.md#YIMIR)

</details>

<details style="font-size: 14.5px;"><summary><strong><span style="font-size: 16px; font-family: monospace">[DATABASES]</span> </strong></summary>

- [BDB](../databases/BDB.md#BDB)
- [BINARY](../databases/BINARY.md#BINARY)
- [COOKIE](../databases/COOKIE.md#COOKIE)
- [GDB](../databases/GDB.md#GDB)
- [GT](../databases/GT.md#GT)
- [HADRON_COLLIDER](../databases/HADRON_COLLIDER.md#HADRON_COLLIDER)
- [IDB_HADRON_COLLIDER](../databases/IDB_HADRON_COLLIDER.md#IDB_HADRON_COLLIDER)
- [IDB_HC_SINK](../databases/IDB_HC_SINK.md#IDB_HC_SINK)
- [IDB_KVDB](../databases/IDB_KVDB.md#IDB_KVDB)
- [IDB_RDB](../databases/IDB_RDB.md#IDB_RDB)
- [KVDB](../databases/KVDB.md#KVDB)
- [LS](../databases/LS.md#LS)
- [MEMORY](../databases/MEMORY.md#MEMORY)
- [RDB](../databases/RDB.md#RDB)
- [REGISTRIES](../databases/REGISTRIES.md#REGISTRIES)
- [SAURON](../databases/SAURON.md#SAURON)
- [SECURE_COOKIE](../databases/SECURE_COOKIE.md#SECURE_COOKIE)
- [SS](../databases/SS.md#SS)
- [TDB](../databases/TDB.md#TDB)
- [VDB](../databases/VDB.md#VDB)


</details>


<details style="font-size: 14.5px;"><summary><strong><span style="font-size: 16px; font-family: monospace">[BAG OF TRICKS]</span> </strong></summary>



- [BARRIER](../bag_of_tricks/BARRIER.md#BARRIER)
- [CALL_IF](../bag_of_tricks/CALL_IF.md#CALL_IF)
- [CHAIN_RECHAIN](../bag_of_tricks/CHAIN_RECHAIN.md#CHAIN_RECHAIN)
- [chain](../bag_of_tricks/chain.md#chain)
- [clamp](../bag_of_tricks/clamp.md#clamp)
- [deferred](../bag_of_tricks/deferred.md#deferred)
- [evaluator](../bag_of_tricks/evaluator.md#evaluator)
- [finally](../bag_of_tricks/finally.md#finally)
- [gate](../bag_of_tricks/gate.md#gate)
- [ignore_arg](../bag_of_tricks/ignore_arg.md#ignore_arg)
- [invoke](../bag_of_tricks/invoke.md#invoke)
- [is_defined](../bag_of_tricks/is_defined.md#is_defined)
- [is_not_defined](../bag_of_tricks/is_not_defined.md#is_not_defined)
- [LAZY](../bag_of_tricks/LAZY.md#LAZY)
- [MAYBE_PROMISE](../bag_of_tricks/MAYBE_PROMISE.md#MAYBE_PROMISE)
- [maybe](../bag_of_tricks/maybe.md#maybe)
- [mcr_combo](../bag_of_tricks/mcr_combo.md#mcr_combo)
- [ONCE](../bag_of_tricks/ONCE.md#ONCE)
- [or_default](../bag_of_tricks/or_default.md#or_default)
- [patch_state](../bag_of_tricks/patch_state.md#patch_state)
- [retry_with_backoff](../bag_of_tricks/retry_with_backoff.md#retry_with_backoff)
- [run_with_retry](../bag_of_tricks/run_with_retry.md#run_with_retry)
- [SERIAL_EXECUTOR](../bag_of_tricks/SERIAL_EXECUTOR.md#SERIAL_EXECUTOR)
- [set_keys](../bag_of_tricks/set_keys.md#set_keys)
- [set_prev](../bag_of_tricks/set_prev.md#set_prev)
- [sleep](../bag_of_tricks/sleep.md#sleep)
- [tap](../bag_of_tricks/tap.md#tap)
- [thenable](../bag_of_tricks/thenable.md#thenable)
- [TIMED_PROMISE](../bag_of_tricks/TIMED_PROMISE.md#TIMED_PROMISE)
- [to_promise](../bag_of_tricks/to_promise.md#to_promise)
- [try_catch](../bag_of_tricks/try_catch.md#try_catch)
- [unreachable](../bag_of_tricks/unreachable.md#unreachable)
- [WAIT_AND_PROMISE](../bag_of_tricks/WAIT_AND_PROMISE.md#WAIT_AND_PROMISE)

</details>



<details style="font-size: 14.5px;"><summary><strong><span style="font-size: 16px; font-family: monospace">[TODO & IDEAS]</span> </strong></summary>


* [TODO & IDEAS](TO_DO_AND_IDEAS.md#todo--ideas)
* [[THE_WIZARD]](TO_DO_AND_IDEAS.md#the_wizard)    
* [[PRIMITIVES]](TO_DO_AND_IDEAS.md#primitives)   
* [[NEXT_LEVEL_IDEAS]](TO_DO_AND_IDEAS.md#next_level_ideas)    
* [KVDB](TO_DO_AND_IDEAS.md#kvdb)   
* [PRxCDB](TO_DO_AND_IDEAS.md#prxcdb)    
* [STAFF](TO_DO_AND_IDEAS.md#staff)  
* [E = mc^2](TO_DO_AND_IDEAS.md#--e--mc2--) 
* [NATIVE, CUSTOM BUILT SOLUTIONS](TO_DO_AND_IDEAS.md#native-custom-built-solutions)  
* [STORAGE CONTEXT](TO_DO_AND_IDEAS.md#storage-context)   
* [OTHER](TO_DO_AND_IDEAS.md#other)

</details>

<br/>

```
                          🗨️           ☁️
                       🌴🌵                             🧙            
┌──────────┐          ┌──────────────────────────┐
└──────────┘          └──────────────────────────┘
              ☁️      
  🔮        🏜️🌵🏜️🌴🌵                         🏜️
┌─────────────────────────────┐        ┌─────────┐
└─────────────────────────────┘        └─────────┘

                                         🏜️🌴🌵
           ┌──────────────────────────────────────┐
           └──────────────────────────────────────┘
         ☁️                  
           🌴🌴                🏜️🌴                          
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🏜️🌴🏜️🌵      🌪️                    🧙     🏝️🏜️
┌─────────────────────────────────────────────────┐
└─────────────────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️       ☁️                              
    🌴🌵                                     🌵🏜️
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                            🌵🌴🌴       
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌵🌴                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

         🌵🌴                      🌵          🌴
┌────────────────┐        ┌───────────────────────┐
└────────────────┘        └───────────────────────┘
         ☁️                  ☁️        
  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                     🌴🌵          🌵🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵          🌵🌵                         
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
            ☁️          ☁️                     
                    🌵🌴                    🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘

  🌵🌴               🌴🌵          🌵🌴
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴          🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘
            ☁️          ☁️                     
  🌴🌵                         🌵🌵          🏜️🌴
┌──────────┐       ┌───────────────────────────────┐
└──────────┘       └───────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘
         ☁️                  ☁️        
  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

            🌵🌴                  🌵          🌴
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵                         🌵🌵          🧙🌴
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️       ☁️                              
  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                                          🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵      🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

             🌵🌴                                             🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                                🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                    🌵🌴                              🌵          🌴
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🌵                          🌴                     
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                             

  🌴                            🌵 
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🌵🌴                                       
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                               🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️                  
                                         
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                                 🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                          
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                                           🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                         🌵                🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌴                          
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴🌵                            🌵             🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️                  
  🌵           🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                             🌵
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                   ☁️                     
  🌵           🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵   🌴🌴                                          
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                           🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
  🌵                           
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴🌵                  🌵           🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵           🌴                    
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

   🌵        🌵🌴                             
┌──────────────────┐        ┌───────────────┐
└──────────────────┘        └───────────────┘
                   ☁️          ☁️                     
🌴                                      🌵        🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵            🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

        🌵🌴                                   🌵
┌────────────────┐       ┌────────────────────────┐
└────────────────┘       └────────────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
                           🌵                           
       ┌────────────────────────────────────┐
       └────────────────────────────────────┘

  🌴🌵                            🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
┌────────────────┐       ┌────────────────────────┐
└────────────────┘       └────────────────────────┘
                   ☁️          ☁️                     
  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
                    🌵🌴                    🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                              🌵🌵
┌───────────────────┐       ┌────────┐       ┌────┐
└───────────────────┘       └────────┘       └────┘

                                              🌵🌴                      
                   ┌──────────────────────────────┐
                   └──────────────────────────────┘
                   ☁️          ☁️                     
  🌴                             🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵                   🌴                    
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴              🌵
       ┌────────────────────────────────────┐
       └────────────────────────────────────┘

  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                        ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                               🌵🌴                          
                       ┌──────────────────────────┐
                       └──────────────────────────┘
         ☁️                  
  🌴🌵                             🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵        🌴                                🌵
┌────────────────────────┐       ┌────────────────┐
└────────────────────────┘       └────────────────┘

  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
      ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
              ☁️      
  🔮        🏜️🌵🏜️🌴🌵                         🏜️
┌─────────────────────────────┐        ┌─────────┐
└─────────────────────────────┘        └─────────┘

                                         🏜️🌴🌵
           ┌──────────────────────────────────────┐
           └──────────────────────────────────────┘
         ☁️                  
           🌴🌴                🏜️🌴                          
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🏜️🌴🏜️🌵      🌪️                    🧙     🏝️🏜️
┌─────────────────────────────────────────────────┐
└─────────────────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️       ☁️                              
    🌴🌵                                     🌵🏜️
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                            🌵🌴🌴       
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌵🌴                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

         🌵🌴                      🌵          🌴
┌────────────────┐        ┌───────────────────────┐
└────────────────┘        └───────────────────────┘
         ☁️                  ☁️        
  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                     🌴🌵          🌵🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵          🌵🌵                         
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
            ☁️          ☁️                     
                    🌵🌴                    🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘

  🌵🌴               🌴🌵          🌵🌴
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴          🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘
            ☁️          ☁️                     
  🌴🌵                         🌵🌵          🏜️🌴
┌──────────┐       ┌───────────────────────────────┐
└──────────┘       └───────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘
         ☁️                  ☁️        
  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

            🌵🌴                  🌵          🌴
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵                         🌵🌵          🧙🌴
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️       ☁️                              
  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                                          🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵      🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

             🌵🌴                                             🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                                🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                    🌵🌴                              🌵          🌴
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🌵                          🌴                     
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                             

  🌴                            🌵 
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🌵🌴                                       
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                               🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️                  
                                         
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                                 🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                          
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                                           🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                         🌵                🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌴                          
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴🌵                            🌵             🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️                  
  🌵           🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                             🌵
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                   ☁️                     
  🌵           🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵   🌴🌴                                          
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                           🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
  🌵                           
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴🌵                  🌵           🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵           🌴                    
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

   🌵        🌵🌴                             
┌──────────────────┐        ┌───────────────┐
└──────────────────┘        └───────────────┘
                   ☁️          ☁️                     
🌴                                      🌵        🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵            🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

        🌵🌴                                   🌵
┌────────────────┐       ┌────────────────────────┐
└────────────────┘       └────────────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
                           🌵                           
       ┌────────────────────────────────────┐
       └────────────────────────────────────┘

  🌴🌵                            🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
┌────────────────┐       ┌────────────────────────┐
└────────────────┘       └────────────────────────┘
                   ☁️          ☁️                     
  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
                    🌵🌴                    🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                              🌵🌵
┌───────────────────┐       ┌────────┐       ┌────┐
└───────────────────┘       └────────┘       └────┘

                                              🌵🌴                      
                   ┌──────────────────────────────┐
                   └──────────────────────────────┘
                   ☁️          ☁️                     
  🌴                             🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵                   🌴                    
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴              🌵
       ┌────────────────────────────────────┐
       └────────────────────────────────────┘

  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                        ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                               🌵🌴                          
                       ┌──────────────────────────┐
                       └──────────────────────────┘
         ☁️                  
  🌴🌵                             🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵        🌴                                🌵
┌────────────────────────┐       ┌────────────────┐
└────────────────────────┘       └────────────────┘

  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
      ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

              ☁️      
  🔮        🏜️🌵🏜️🌴🌵                         🏜️
┌─────────────────────────────┐        ┌─────────┐
└─────────────────────────────┘        └─────────┘

                                         🏜️🌴🌵
           ┌──────────────────────────────────────┐
           └──────────────────────────────────────┘
         ☁️                  
           🌴🌴                🏜️🌴                          
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🏜️🌴🏜️🌵      🌪️                    🧙     🏝️🏜️
┌─────────────────────────────────────────────────┐
└─────────────────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️       ☁️                              
    🌴🌵                                     🌵🏜️
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                            🌵🌴🌴       
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌵🌴                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

         🌵🌴                      🌵          🌴
┌────────────────┐        ┌───────────────────────┐
└────────────────┘        └───────────────────────┘
         ☁️                  ☁️        
  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                     🌴🌵          🌵🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵          🌵🌵                         
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
            ☁️          ☁️                     
                    🌵🌴                    🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘

  🌵🌴               🌴🌵          🌵🌴
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴          🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘
            ☁️          ☁️                     
  🌴🌵                         🌵🌵          🏜️🌴
┌──────────┐       ┌───────────────────────────────┐
└──────────┘       └───────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
       ┌───────────────────────────────────────────┐
       └───────────────────────────────────────────┘
         ☁️                  ☁️        
  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

            🌵🌴                  🌵          🌴
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵                         🌵🌵          🧙🌴
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️       ☁️                              
  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                                          🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵      🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

             🌵🌴                                             🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                                🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌵🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                    🌵🌴                              🌵          🌴
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🌵                          🌴                     
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                             

  🌴                            🌵 
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

  🌵🌴                                       
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                               🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️                  
                                         
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                                 🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                          
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                                           🌵
┌─────────────────────┐        ┌──────────────────┐
└─────────────────────┘        └──────────────────┘

  🌴🌵                         🌵                🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
                   ☁️          ☁️                     
  🌴                          
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴🌵                            🌵             🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
         ☁️                  
  🌵           🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                             🌵
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                          
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                   ☁️                     
  🌵           🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵   🌴🌴                                          
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴                           🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
  🌵                           
┌───────────────────────┐        ┌────────────────┐
└───────────────────────┘        └────────────────┘

  🌴🌵                  🌵           🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵           🌴                    
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

   🌵        🌵🌴                             
┌──────────────────┐        ┌───────────────┐
└──────────────────┘        └───────────────┘
                   ☁️          ☁️                     
🌴                                      🌵        🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵            🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

        🌵🌴                                   🌵
┌────────────────┐       ┌────────────────────────┐
└────────────────┘       └────────────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
                           🌵                           
       ┌────────────────────────────────────┐
       └────────────────────────────────────┘

  🌴🌵                            🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
┌────────────────┐       ┌────────────────────────┐
└────────────────┘       └────────────────────────┘
                   ☁️          ☁️                     
  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘
         ☁️                  
                    🌵🌴                    🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

                              🌵🌵
┌───────────────────┐       ┌────────┐       ┌────┐
└───────────────────┘       └────────┘       └────┘

                                              🌵🌴                      
                   ┌──────────────────────────────┐
                   └──────────────────────────────┘
                   ☁️          ☁️                     
  🌴                             🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵                   🌴                    
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴              🌵
       ┌────────────────────────────────────┐
       └────────────────────────────────────┘

  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
                   ☁️                        ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵🌴                    🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌴🌵                         🌵🌵
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                                               🌵🌴                          
                       ┌──────────────────────────┐
                       └──────────────────────────┘
         ☁️                  
  🌴🌵                             🌵🌵          🧙🌴
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘

  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                    🌵        🌴                                🌵
┌────────────────────────┐       ┌────────────────┐
└────────────────────────┘       └────────────────┘

  🌴🌵                         🌵🌵
┌────┐       ┌────────────────────────────────────┐
└────┘       └────────────────────────────────────┘
      ☁️          ☁️                     
  🌵🌴          🌴🌵                   
┌────────────────────────────────────┐       ┌────┐
└────────────────────────────────────┘       └────┘

                  🌵             🌴                         🌵
┌─────────────────────────────────────────────────┐
└─────────────────────────────────────────────────┘
```
</div>
</div>
