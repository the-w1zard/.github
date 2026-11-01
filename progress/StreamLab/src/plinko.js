/**
 * plinko — deep-match routing, plinko-machine style.
 *
 * A p is dropped at the top of a tree and falls through branches;
 * *every* node on the path is a matcher, so routing decisions are deep
 * predicate chains rather than a single shallow key. Each node may
 * transform/emit before descending. Sessions keep a running state + path
 * so a multi-hop conversation can walk the same tree with memory.
 */
export class Plinko {
    tree;
    options;
    state;
    path = [];
    metadata = new Map();
    constructor(tree, initial, options = {}) {
        this.tree = tree;
        this.options = options;
        this.state = initial;
    }
    getState() { return this.state; }
    getPath() { return [...this.path]; }
    reset() {
        this.path = [];
        this.metadata.clear();
    }
    async evaluate(p, replyFn) {
        const ctx = {
            state: this.state,
            p,
            path: [...this.path],
            metadata: this.metadata,
            reply: async (data, targetSc) => {
                if (replyFn)
                    return replyFn(data, targetSc);
                return undefined;
            },
            abort: (reason) => { throw new Error(`plinko abort: ${reason ?? "no reason"}`); },
        };
        const entered = [...this.path];
        try {
            const { success, path, result, terminal } = await this.walk(this.tree, ctx, p);
            if (this.options.onTransition)
                this.options.onTransition(entered, path, p);
            return { success, path, result, terminal };
        }
        catch (err) {
            if (this.options.onError)
                this.options.onError(err instanceof Error ? err : new Error(String(err)), [...this.path], p);
            return { success: false, path: [...this.path], terminal: false, result: undefined };
        }
    }
    async walk(tree, ctx, p) {
        for (const [key, node] of Object.entries(tree)) {
            let matched;
            try {
                matched = await node.matcher(p, ctx);
            }
            catch (err) {
                if (this.options.onError)
                    this.options.onError(err instanceof Error ? err : new Error(String(err)), [...ctx.path, key], p);
                continue;
            }
            if (!matched)
                continue;
            this.path.push(key);
            ctx.path = [...this.path];
            if (node.hooks?.beforeEnter) {
                await node.hooks.beforeEnter(p, ctx);
            }
            const result = node.execute ? await node.execute(p, ctx) : undefined;
            const terminal = !node.branches || Object.keys(node.branches).length === 0;
            let childResult;
            if (node.branches && !terminal) {
                childResult = await this.walk(node.branches, ctx, p);
            }
            if (node.hooks?.afterExit) {
                await node.hooks.afterExit(childResult?.result ?? result, ctx);
            }
            if (this.options.autoResetOnTerminal && terminal) {
                this.path = [];
            }
            // First match wins — a matched branch must not fall through to siblings.
            return childResult ?? { success: true, path: [...this.path], result, terminal };
        }
        // No matcher matched at this level.
        return { success: false, path: [...this.path], terminal: false, result: undefined };
    }
}
/** Build a single-node tree sugar. */
export function leaf(matcher, execute) {
    return { leaf: { matcher, execute } };
}
