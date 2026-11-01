import { EMITTERS } from "../protocols/signals";

type HCChannels = {
  k?: A;
  s?: S;
  m?: S;
  r?: S;
};

type HCStream<T> = RET<EMITTERS["hc"]> & {
  send(value: T): V;
  onData(handler: (value: T, seq: N) => V): () => V;
};

type HCSetter<T> = (value: T | ((previous: T) => T)) => V;

type HCContext<T> = {
  value: T;
  setValue: HCSetter<T>;
  stream: HCStream<T>;
  close(): V;
};

const contexts = new Map<S, HCContext<U>>();

export function useHC<T=A>(
  iv: T,
  k?: A,
  s?: S,
  m?: S,
  r?: S
): readonly [T, HCSetter<T>] {
  const existing = contexts.get(k) as HCContext<T> | UD;

  if (existing) {
    return [existing.value, existing.setValue] as const;
  }

  const hc = getHadronCollider();

  const stream = hc.hc(
    k ?? hc.quad_channel_key,
    s ?? hc.CH_3,
    m ?? hc.CH_2,
    r ?? hc.CH_1
  ) as HCStream<T>;

  const context: HCContext<T> = {
    value: iv,

    setValue(next) {
      const value = typeof next === "function" ? (next as (previous: T) => T)(context.value) : next;
      stream.send(value);
    },

    stream,

    close() {
      stream.close();
      contexts.delete(k);
    }
  };

  stream.onData((value: any) => { context.value = value;  });

  contexts.set(k, context);

  return [context.value, context.setValue] as const;
}
