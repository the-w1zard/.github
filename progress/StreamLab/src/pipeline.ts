import type { PipelineEvent, PipelineStage } from "./types.ts";

/**
 * pipeline — a typed stage graph for streaming transformations.
 *
 * Stages run in (re)ordered sequence over each datum; each stage may be
 * async, and an `errorHandler` on a stage can recover (return a replacement
 * value) without killing the pipeline. Observers can subscribe to
 * stage-enter / stage-exit / error events.
 */
export class Pipeline<T = unknown> {
  private stages: PipelineStage<T>[] = [];
  private observers = new Set<(e: PipelineEvent<T>) => void>();

  add(stage: PipelineStage<T>): this {
    this.stages.push(stage);
    return this;
  }

  addMany(stages: PipelineStage<T>[]): this {
    this.stages.push(...stages);
    return this;
  }

  /** Insert a stage before the named stage. */
  insertBefore(name: string, stage: PipelineStage<T>): this {
    const i = this.stages.findIndex((s) => s.name === name);
    if (i < 0) throw new Error(`pipeline: unknown stage ${name}`);
    this.stages.splice(i, 0, stage);
    return this;
  }

  observe(fn: (e: PipelineEvent<T>) => void): () => void {
    this.observers.add(fn);
    return () => this.observers.delete(fn);
  }

  async run(input: T): Promise<T> {
    let data = input;
    for (const stage of this.stages) {
      this.emit({ type: "stage:enter", stage: stage.name, data });
      try {
        data = await stage.handler(data);
        this.emit({ type: "stage:exit", stage: stage.name, data });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (stage.errorHandler) {
          data = await stage.errorHandler(error, data);
          this.emit({ type: "stage:exit", stage: stage.name, data });
        } else {
          this.emit({ type: "error", stage: stage.name, data, error: error.message });
          throw error;
        }
      }
    }
    return data;
  }

  runMany(inputs: T[]): Promise<T[]> {
    return Promise.all(inputs.map((i) => this.run(i)));
  }

  stagesNames(): string[] { return this.stages.map((s) => s.name); }

  private emit(e: PipelineEvent<T>): void {
    for (const fn of [...this.observers]) {
      try { fn(e); } catch { /* observers are isolated */ }
    }
  }
}
