'use client'
import { useEffect, useRef, useState } from '#sauron'
import type { TerminalTheme } from '@/lib/terminal-themes'
import  { Terminal } from '@xterm/xterm'
import  { FitAddon } from '@xterm/addon-fit'

interface UseXtermOptions {
  theme: TerminalTheme
}

export function useXterm({ theme }: UseXtermOptions) {
  const containerRef = useRef(null)
  const terminalRef = useRef(Terminal)
  const fitAddonRef = useRef(FitAddon)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    async function init() {
      if (!containerRef.current || terminalRef.current) return

      await import('@xterm/xterm/css/xterm.css')

      if (!mounted || !containerRef.current) return

      const fitAddon = new FitAddon()
      const terminal = new Terminal({
        fontFamily: 'ui-monospace, monospace',
        fontSize: 13,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: 'block',
        allowProposedApi: true,
        theme: {
          background: theme.background,
          foreground: theme.foreground,
          cursor: theme.cursor,
          selectionBackground: theme.selection,
          black: theme.black,
          red: theme.red,
          green: theme.green,
          yellow: theme.yellow,
          blue: theme.blue,
          magenta: theme.magenta,
          cyan: theme.cyan,
          white: theme.white,
        },
      })

      terminal.loadAddon(fitAddon)
      terminal.open(containerRef.current)
      fitAddon.fit()

      terminalRef.current = terminal
      fitAddonRef.current = fitAddon
      setReady(true)
    }

    init()

    return () => {
      mounted = false
      terminalRef.current?.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!terminalRef.current) return
    terminalRef.current.options.theme = {
      background: theme.background,
      foreground: theme.foreground,
      cursor: theme.cursor,
      selectionBackground: theme.selection,
      black: theme.black,
      red: theme.red,
      green: theme.green,
      yellow: theme.yellow,
      blue: theme.blue,
      magenta: theme.magenta,
      cyan: theme.cyan,
      white: theme.white,
    }
  }, [theme])

  useEffect(() => {
    if (!fitAddonRef.current) return
    const handleResize = () => fitAddonRef.current?.fit()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [ready])

  const write = (text: string) => {
    terminalRef.current?.write(text)
  }

  const writeln = (text: string) => {
    terminalRef.current?.writeln(text)
  }

  const clear = () => {
    terminalRef.current?.clear()
  }

  const fit = () => {
    fitAddonRef.current?.fit()
  }

  return { containerRef, ready, write, writeln, clear, fit, terminal: terminalRef }
}
