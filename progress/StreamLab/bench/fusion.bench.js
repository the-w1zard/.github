"use strict";
/**
 * import { Subject as RxSubject, map as rxMap, filter as rxFilter, tap as rxTap } from "rxjs";
import { Observable, pipeFused, fmap, ffilter, ftap, fpairwise, fevery, ffind, fcount, fdistinctKey, fskipWhile, partition, shareLatest, delayWhen } from "../src/hydra/index.ts";

function run(name: string, fn: (N: number) => void, N: number, iters: number) {
  fn(100); // warmup
  const t0 = performance.now()*1e6;
  for (let k = 0; k < iters; k++) fn(N);
  const dt = (performance.now()*1e6 - t0) / 1e6;
  console.log(`${name}: ${dt.toFixed(1)}ms total, ${(dt / iters / N * 1e6).toFixed(0)} ns/value`);
}

const N = 100_000, ITERS = 20;

run("fused (map,map,filter,tap)", (n) => {
  let sink = 0;
  pipeFused(
    new Observable<number>((sub) => { for (let i = 0; i < n; i++) sub.next(i); sub.complete(); }),
    fmap((v: number) => v * 2),
    fmap((v: number) => v + 1),
    ffilter((v: number) => v % 2 === 0),
    ftap((v: number) => { sink = v; })
  ).subscribe({ next: () => {}, complete: () => {} });
}, N, ITERS);

run("rxjs (map,map,filter,tap)", (n) => {
  let sink = 0;
  const src = new RxSubject<number>();
  src.pipe(
    rxMap((v: number) => v * 2),
    rxMap((v: number) => v + 1),
    rxFilter((v: number) => v % 2 === 0),
    rxTap((v: number) => { sink = v; })
  ).subscribe((v) => { sink = v; });
  for (let i = 0; i < n; i++) src.next(i);
}, N, ITERS);

// ─── correctness ───
{
  const out: number[] = [];
  pipeFused(
    new Observable<number>((sub) => { sub.next(1); sub.next(2); sub.next(2); sub.next(3); sub.complete(); }),
    fmap((v: number) => v * 10),
    ffilter((v: number) => v !== 20),
    ffilter((v: number) => v >= 10)
  ).subscribe({ next: (v) => out.push(v), complete: () => {} });
  const pass = out[0] === 10 && out[1] === 30 && out.length === 2;
  console.log("correctness:", JSON.stringify(out), pass ? "PASS" : "FAIL");
}

// ─── batch #4 operator tests ───
{
  // pluck + pairwise fused
  const out: any[] = [];
  pipeFused(
    new Observable<number>((sub) => { sub.next(1); sub.next(2); sub.next(3); sub.complete(); }),
    fpairwise()
  ).subscribe({ next: (v) => out.push(v), complete: () => {} });
  console.log("pairwise:", JSON.stringify(out), out.toString() === [[1,2],[2,3]].toString() ? "PASS" : "FAIL");

  // every
  const ev: boolean[] = [];
  pipeFused(
    new Observable<number>((sub) => { sub.next(2); sub.next(4); sub.complete(); }),
    fevery((v) => v % 2 === 0)
  ).subscribe({ next: (v) => ev.push(v) });
  console.log("every:", ev[0] === true ? "PASS" : "FAIL", ev);

  // find fused
  const fd: any[] = [];
  pipeFused(
    new Observable<number>((sub) => { sub.next(1); sub.next(7); sub.next(9); sub.complete(); }),
    ffind((v) => v > 5)
  ).subscribe({ next: (v) => fd.push(v), complete: () => {} });
  console.log("find:", fd[0] === 7 && fd.length === 1 ? "PASS" : "FAIL", fd);

  // count fused (via complete sink)
  const cn: number[] = [];
  pipeFused(
    new Observable<number>((sub) => { sub.next(1); sub.next(2); sub.next(3); sub.complete(); }),
    fcount((v) => v % 2 === 1)
  ).subscribe({ next: (v) => cn.push(v) });
  console.log("count:", cn[0] === 2 ? "PASS" : "FAIL", cn);

  // distinctKey
  const dk: any[] = [];
  pipeFused(
    new Observable<any>((sub) => { sub.next({id:1}); sub.next({id:1}); sub.next({id:2}); sub.complete(); }),
    fdistinctKey((v) => v.id)
  ).subscribe({ next: (v) => dk.push(v.id) });
  console.log("distinctKey:", JSON.stringify(dk) === "[1,2]" ? "PASS" : "FAIL", dk);

  // skipWhile
  const sw: number[] = [];
  pipeFused(
    new Observable<number>((sub) => { sub.next(1); sub.next(2); sub.next(3); sub.next(4); sub.complete(); }),
    fskipWhile((v) => v < 3)
  ).subscribe({ next: (v) => sw.push(v) });
  console.log("skipWhile:", JSON.stringify(sw) === "[3,4]" ? "PASS" : "FAIL", sw);

  // partition
  const [evens, odds] = partition(new Observable<number>((sub) => { sub.next(1); sub.next(2); sub.next(3); sub.complete(); }), (v) => v % 2 === 0);
  const e: number[] = [], o: number[] = [];
  evens.subscribe({ next: (v) => e.push(v) });
  odds.subscribe({ next: (v) => o.push(v) });
  console.log("partition:", JSON.stringify(e) === "[2]" && JSON.stringify(o) === "[1,3]" ? "PASS" : "FAIL", e, o);

  // shareLatest: second subscriber gets replay
  let emitted = 0;
  const src$ = new Observable<number>((sub) => { emitted++; sub.next(42); });
  const shared = shareLatest(src$);
  let a: number[] = [], b: number[] = [];
  shared.subscribe({ next: (v) => a.push(v) });
  shared.subscribe({ next: (v) => b.push(v) });
  console.log("shareLatest (single up-sub, both got 42):", emitted === 1 && a[0] === 42 && b[0] === 42 ? "PASS" : "FAIL", emitted, a, b);

  // delayWhen + timer-less immediate
  const dw: number[] = [];
  pipeFused(
    new Observable<number>((sub) => { sub.next(5); sub.complete(); }),
    delayWhen(() => new Observable<any>((s) => s.complete()))
  ).subscribe({ next: (v) => dw.push(v), complete: () => {} });
  console.log("delayWhen:", dw[0] === 5 ? "PASS" : "FAIL", dw);
}

 */
