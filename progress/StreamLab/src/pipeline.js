/**
 * pipeline — a typed stage graph for streaming transformations.
 *
 * Stages run in (re)ordered sequence over each datum; each stage may be
 * async, and an `errorHandler` on a stage can recover (return a replacement
 * value) without killing the pipeline. Observers can subscribe to
 * stage-enter / stage-exit / error events.
 */
export class Pipeline {
    stages = [];
    observers = new Set();
    add(stage) {
        this.stages.push(stage);
        return this;
    }
    addMany(stages) {
        this.stages.push(...stages);
        return this;
    }
    /** Insert a stage before the named stage. */
    insertBefore(name, stage) {
        const i = this.stages.findIndex((s) => s.name === name);
        if (i < 0)
            throw new Error(`pipeline: unknown stage ${name}`);
        this.stages.splice(i, 0, stage);
        return this;
    }
    observe(fn) {
        this.observers.add(fn);
        return () => this.observers.delete(fn);
    }
    async run(input) {
        let data = input;
        for (const stage of this.stages) {
            this.emit({ type: "stage:enter", stage: stage.name, data });
            try {
                data = await stage.handler(data);
                this.emit({ type: "stage:exit", stage: stage.name, data });
            }
            catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                if (stage.errorHandler) {
                    data = await stage.errorHandler(error, data);
                    this.emit({ type: "stage:exit", stage: stage.name, data });
                }
                else {
                    this.emit({ type: "error", stage: stage.name, data, error: error.message });
                    throw error;
                }
            }
        }
        return data;
    }
    runMany(inputs) {
        return Promise.all(inputs.map((i) => this.run(i)));
    }
    stagesNames() { return this.stages.map((s) => s.name); }
    emit(e) {
        for (const fn of [...this.observers]) {
            try {
                fn(e);
            }
            catch { /* observers are isolated */ }
        }
    }
}
