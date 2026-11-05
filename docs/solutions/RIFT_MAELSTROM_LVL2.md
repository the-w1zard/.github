# RIFT MAELSTROM LVL2


> [!NOTE]
>
> Honestly, there wasn't much to change and I had felt that only a single thing was lacking with the original, which is staying as it currently is.
>
> - They all solve different problems, but despite coming to the same returned value... none of them share a registry.
>
> To accomplish this, I simply banded them all together as a single solution. Pooling their resources together so that when functions like, quickly checking and using or skipping if not, now actually dip into a much larger resource pool.
>
>    1. Rift        — the local shape.  A named slot holding a value that may not have
>                      landed yet. In-process. Gate promise, claim semantics, listeners.
> 
>    2. CloudRift   — the cloud shape.  Same contract, but the slot is shared through a
>                      reactive store: writes broadcast, every reader sees the same record,
>                      subscriptions fire across all holders of the same label.
>    3. MAELSTROM   — the everything machine. Owns the registry, owns the shared results
>                      surface, and carries every solver that ever existed in this lineage —
>                      each one solving a DIFFERENT problem, all funneling into the SAME
>                      results registry, all returning through the SAME value contract.
> 
>  Every solver, and the problem it alone goes about solving:
> 
>    - get()                  
>       - the plain registry read. What is in the slot right now.
>    - place()                
>       - the plain registry write. Put a value in, tag the outcome.
>    - smash_n_grab()         
>       - the bandit. Check the rift, return current; no module but a wait → wait for it; label + module → open the rift with it;  all else fails → nuke it, import, open anyway. Never throws.
>    - create_rift()         
>       - the founder. Open a rift with a module in one move.
>    - use_rift()         
>       - the traveler. Open rift → claimed rift → wait → module import
>                             → apparation fallback. The full resolution ladder.
>    - resolve_global_rift()         
>       - the diplomat. Global-slot resolution with a timeout and a
>                             dignified fallback instead of a rejection.
>    - resolve_rift_initial()         
>       - the bootstrap. First paint value for a rift that may never open.
>    - has()         
>       - the scout. Rift? Loaded module? Blind require? Blind import? Four probes, one boolean.
>    - probe()         
>       - the locally sourced named import. Sync-first named export from
>                             a local file: cold path returns the fallback with ZERO await,
>                             one probe per label ever (claim-gated), background import
>                             fire-and-forget, hot path is a bare property read.
>    - conjure()         
>       - the conjurer. Optional module: import if present, fallback if
>                             not, cached forever. The cached/uncached pair, safe proxy
>                             fallback, preferRequire, importPromise, comp_name extraction,
>                             env-priority selection — all of it.
>    - check()         
>       - the verifier. Does this module exist? One probe, cached in a
>                             rift, boolean out, no repeated imports ever.
>    - load_module()         
>       - the porter. Async load with inflight dedupe, keyed by resolved
>                             URL, indexed exports, retry-on-failure.
>    - require_module()         
>       - the porter's sync twin. Blind require, cached, indexed.
>    - export_of()         
>       - the index clerk. Find a named export across every loaded
>                             module; ambiguous finds throw, never silently guess.
>    - wait_and_promise()         
>       - the patient one. Subscribe FIRST, then re-check isOpen —
>                             closes the gap where a record opens mid-subscribe.
>    - wait_for()         
>       - the signal waiter. Block until named signals fire.
>    - defer()         
>       - the scheduler. Run a task only when every dependency resolves.
>                             Drain loop, versioned deps, stats, cancellation.
>    - detect_environment()         
>       - the cartographer. Module level, platform, compilers, bundler,
>                             adapters — candidate lists scanned through check().
> 
>  ...and every one of them lands its outcome in the SAME shared results registry:
> 
>    { label, solver, store, value, ok, openedAt }
> 
>  addressable by the same label across every solver, subscribable from one place, and
>  wired into the defer engine so any recorded result releases dependent deferred tasks.





