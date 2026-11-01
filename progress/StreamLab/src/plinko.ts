import type {
  PlinkoContext, PlinkoEvaluation, PlinkoHandle, PlinkoNode, PlinkoOptions,
  PlinkoTree,
} from "./types.ts";

/**
 * plinko — deep-match routing, plinko-machine style.
 *
 * A p is dropped at the top of a tree and falls through branches;
 * *every* node on the path is a matcher, so routing decisions are deep
 * predicate chains rather than a single shallow key. Each node may
 * transform/emit before descending. Sessions keep a running state + path
 * so a multi-hop conversation can walk the same tree with memory.
 */
export class Plinko<TState = any, TPayload = any> implements PlinkoHandle<TState, TPayload> {
  private tree: PlinkoTree<TState, TPayload>;
  private options: PlinkoOptions<TState, TPayload>;
  private state: TState;
  private path: string[] = [];
  private metadata = new Map<string, any>();

  constructor(tree: PlinkoTree<TState, TPayload>, initial: TState, options: PlinkoOptions<TState, TPayload> = {}) {
    this.tree = tree;
    this.options = options;
    this.state = initial;
  }

  getState(): TState { return this.state; }
  getPath(): string[] { return [...this.path]; }

  reset(): void {
    this.path = [];
    this.metadata.clear();
  }

  async evaluate(
    p: TPayload,
    replyFn?: (data: unknown, targetSc?: string) => Promise<unknown>,
  ): Promise<PlinkoEvaluation<TState, TPayload>> {
    const ctx: PlinkoContext<TState, TPayload> = {
      state: this.state,
      p,
      path: [...this.path],
      metadata: this.metadata,
      reply: async (data: unknown, targetSc?: string) => {
        if (replyFn) return replyFn(data, targetSc);
        return undefined;
      },
      abort: (reason?: string): never => { throw new Error(`plinko abort: ${reason ?? "no reason"}`); },
    };

    const entered = [...this.path];
    try {
      const { success, path, result, terminal } = await this.walk(this.tree, ctx, p);
      if (this.options.onTransition) this.options.onTransition(entered, path, p);
      return { success, path, result, terminal };
    } catch (err) {
      if (this.options.onError) this.options.onError(err instanceof Error ? err : new Error(String(err)), [...this.path], p);
      return { success: false, path: [...this.path], terminal: false, result: undefined };
    }
  }

  private async walk(
    tree: PlinkoTree<TState, TPayload>,
    ctx: PlinkoContext<TState, TPayload>,
    p: TPayload,
  ): Promise<{ success: boolean; path: string[]; result: any; terminal: boolean }> {
    for (const [key, node] of Object.entries(tree)) {
      let matched: boolean;
      try {
        matched = await node.matcher(p, ctx);
      } catch (err) {
        if (this.options.onError) this.options.onError(err instanceof Error ? err : new Error(String(err)), [...ctx.path, key], p);
        continue;
      }
      if (!matched) continue;

      this.path.push(key);
      ctx.path = [...this.path];
      if (node.hooks?.beforeEnter) {
        await node.hooks.beforeEnter(p, ctx);
      }

      const result = node.execute ? await node.execute(p, ctx) : undefined;
      const terminal = !node.branches || Object.keys(node.branches).length === 0;

      let childResult: { success: boolean; path: string[]; result: any; terminal: boolean } | undefined;
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
export function leaf<TState = any, TPayload = any>(
  matcher: PlinkoNode<TState, TPayload>["matcher"],
  execute?: PlinkoNode<TState, TPayload>["execute"],
): PlinkoTree<TState, TPayload> {
  return { leaf: { matcher, execute } };
}
