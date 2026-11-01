import { createHook } from '#the-cloud'
import { _sid } from '#sauron'

export type ShellResult = {
  stdout: string
  stderr: string
  code: number
  ok: boolean
  signal: string | null
  duration: number
}

export type ShellOptions = {
  cwd?: string
  env?: Record<string, string>
  timeout?: number
  shell?: string | boolean
  stdin?: string
  encoding?: BufferEncoding
}

export type ShellState = {
  result: ShellResult | null
  running: boolean
  error: Error | null
}

const runtimes = {
  bun: {
    available: () =>
      typeof process !== "undefined" && !!process.versions?.bun,

    exec: async (cmd: string, args: string[], opts: ShellOptions): Promise<ShellResult> => {
      const start = Date.now()

      const proc = Bun.spawn([cmd, ...args], {
        cwd: opts.cwd,
        env: opts.env ? { ...process.env, ...opts.env } : process.env,
        stdin: opts.stdin ? Buffer.from(opts.stdin) : "ignore",
        stdout: "pipe",
        stderr: "pipe"
      })

      const [stdout, stderr] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text()
      ])

      const code = await proc.exited

      return {
        stdout,
        stderr,
        code,
        ok: code === 0,
        signal: null,
        duration: Date.now() - start
      }
    }
  },
  

  deno: {
    available: () => typeof Deno !== "undefined",

    exec: async (cmd: string, args: string[], opts: ShellOptions): Promise<ShellResult> => {
      const start = Date.now()

      const proc = new Deno.Command(cmd, {
        args,
        cwd: opts.cwd,
        env: opts.env,
        stdin: opts.stdin ? "piped" : "null",
        stdout: "piped",
        stderr: "piped"
      })

      const output = await proc.output()
      const dec = new TextDecoder()

      return {
        stdout: dec.decode(output.stdout),
        stderr: dec.decode(output.stderr),
        code: output.code,
        ok: output.success,
        signal: output.signal ?? null,
        duration: Date.now() - start
      }
    }
  },

  node: {
    available: () =>
      typeof process !== "undefined" && !!process.versions?.node,

    exec: async (cmd: string, args: string[], opts: ShellOptions): Promise<ShellResult> => {
      const start = Date.now()
      const { spawn } = await import("child_process")

      return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, {
          cwd: opts.cwd,
          env: opts.env ? { ...process.env, ...opts.env } : process.env,
          shell: opts.shell ?? false,
          timeout: opts.timeout
        })

        let stdout = ""
        let stderr = ""

        if (opts.stdin) {
          proc.stdin?.write(opts.stdin)
          proc.stdin?.end()
        }

        proc.stdout?.on("data", d => {
          stdout += d.toString(opts.encoding ?? "utf8")
        })

        proc.stderr?.on("data", d => {
          stderr += d.toString(opts.encoding ?? "utf8")
        })

        proc.on("close", (code, signal) => {
          resolve({
            stdout,
            stderr,
            code: code ?? 1,
            ok: code === 0,
            signal,
            duration: Date.now() - start
          })
        })

        proc.on("error", reject)
      })
    }
  }
}

function getRuntime() {
  if (runtimes.bun.available()) return runtimes.bun
  if (runtimes.deno.available()) return runtimes.deno
  if (runtimes.node.available()) return runtimes.node
  return null
}

function parse(cmd: string): [string, string[]] {
  const parts =
    cmd.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? []

  const clean = parts.map(p =>
    p.replace(/^["']|["']$/g, "")
  )

  return [clean[0], clean.slice(1)]
}

export function useShell(
  cmd: string,
  opts: ShellOptions = {},
  __sauron_id__ = _sid()
) {
  return createHook(
    "useShell",
    __sauron_id__,

    () => ({
      value: {
        result: null as ShellResult | null,
        running: false,
        error: null as Error | null
      }
    }),

    (state, key, notify) => {
      const s = state.value

      const run = async (
        overrideCmd?: string,
        overrideOpts?: ShellOptions
      ): Promise<ShellResult> => {
        const runtime = getRuntime()
        if (!runtime) throw new Error("useShell: no supported runtime detected")

        const target = overrideCmd ?? cmd
        const options = { ...opts, ...overrideOpts }
        const [bin, args] = parse(target)

        s.running = true
        s.error = null
        notify(key)

        try {
          const result = await runtime.exec(bin, args, options)
          s.result = result
          s.running = false
          notify(key)
          return result
        } catch (e) {
          s.error = e as Error
          s.running = false
          notify(key)
          throw e
        }
      }

      const pipe = async (...cmds: string[]): Promise<ShellResult> => {
        let input = opts.stdin ?? ""
        let last: ShellResult = {
          stdout: "",
          stderr: "",
          code: 0,
          ok: true,
          signal: null,
          duration: 0
        }

        for (const c of cmds) {
          last = await run(c, { ...opts, stdin: input })
          if (!last.ok) return last
          input = last.stdout
        }

        return last
      }

      return {
        run,
        pipe,
        result: s.result,
        running: s.running,
        error: s.error
      }
    }
  )
}

export async function $(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<ShellResult> {
  const cmd = strings.reduce(
    (acc, str, i) => acc + str + (values[i] ?? ""),
    ""
  )

  const runtime = getRuntime()
  if (!runtime) throw new Error("$: no supported runtime detected")

  const [bin, args] = parse(cmd.trim())
  return runtime.exec(bin, args, {})
}

export async function exec(
  cmd: string,
  opts: ShellOptions = {}
): Promise<ShellResult> {
  const runtime = getRuntime()
  if (!runtime) throw new Error("exec: no supported runtime detected")

  const [bin, args] = parse(cmd)
  return runtime.exec(bin, args, opts)
}
