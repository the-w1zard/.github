/**
 * #sauron/use-alpine
 * 
 * Alpine.js-like reactivity without JSX
 * Declarative DOM binding with x-data, x-show, x-for
 * 
 * ```tsx
 * function Counter() {
 *   const alpine = useAlpine({
 *     count: 0,
 *     increment() { this.count++ }
 *   });
 * 
 *   return alpine.html`
 *     <div x-data>
 *       <button @click="increment">Count: <span x-text="count"></span></button>
 *     </div>
 *   `;
 * }
 * ```
 */
import { createHook, HookState } from '#the-cloud'
import { _sid } from '../_sid'

interface AlpineData {
  [key: string]: any
}

interface AlpineOptions {
  prefix?: string
  debug?: boolean
  interceptors?: Record<string, Function>
}

class AlpineInstance {
  private data: AlpineData
  private elements: Map<Element, AlpineData> = new Map()
  private observers: Map<Element, MutationObserver> = new Map()
  private watches: Map<string, Set<Function>> = new Map()

  constructor(private options: AlpineOptions = {}) {
    this.data = {}
  }

  init(root: Element, data: AlpineData) {
    this.data = data
    this.elements.set(root, data)
    this.processNode(root, data)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node instanceof Element) this.processNode(node, data)
        })
      })
    })
    observer.observe(root, { childList: true, subtree: true })
    this.observers.set(root, observer)
    return this
  }

  private processNode(node: Element, data: AlpineData) {
    const prefix = this.options.prefix || 'x-'
    Array.from(node.attributes).forEach(attr => {
      if (attr.name.startsWith(prefix)) {
        this.processDirective(node, attr.name.slice(prefix.length), attr.value, data)
      } else if (attr.name.startsWith('@')) {
        this.processEvent(node, attr.name.slice(1), attr.value, data)
      } else if (attr.name.startsWith(':')) {
        this.processBinding(node, attr.name.slice(1), attr.value, data)
      }
    })
    node.childNodes.forEach(child => {
      if (child instanceof Element) this.processNode(child, data)
    })
  }

  private processDirective(node: Element, directive: string, expression: string, data: AlpineData) {
    switch (directive) {
      case 'data':    break
      case 'show':    this.setupShow(node, expression, data);   break
      case 'bind':    this.setupBind(node, expression, data);   break
      case 'text':    this.setupText(node, expression, data);   break
      case 'html':    this.setupHTML(node, expression, data);   break
      case 'model':   this.setupModel(node, expression, data);  break
      case 'for':     this.setupFor(node, expression, data);    break
      case 'if':      this.setupIf(node, expression, data);     break
      case 'effect':  this.setupEffect(node, expression, data); break
      case 'ignore':  node.setAttribute('data-alpine-ignore', 'true'); break
      case 'cloak':
        (node as HTMLElement).style.display = 'none'
        setTimeout(() => { (node as HTMLElement).style.display = '' }, 0)
        break
      default:
        if (directive.startsWith('on:')) this.processEvent(node, directive.slice(3), expression, data)
    }
  }

  private setupShow(node: Element, expression: string, data: AlpineData) {
    const evaluate = this.createEvaluator(expression, data)
    const update = () => { (node as HTMLElement).style.display = evaluate(data) ? '' : 'none' }
    this.watch(expression, update)
    update()
  }

  private setupBind(node: Element, expression: string, data: AlpineData) {
    const parts = expression.split(':')
    if (parts.length !== 2) return
    const [attr, expr] = parts
    const evaluate = this.createEvaluator(expr, data)
    const update = () => {
      const result = evaluate(data)
      if (result === false || result === null || result === undefined) node.removeAttribute(attr)
      else node.setAttribute(attr, String(result))
    }
    this.watch(expr, update)
    update()
  }

  private setupText(node: Element, expression: string, data: AlpineData) {
    const evaluate = this.createEvaluator(expression, data)
    const update = () => { node.textContent = evaluate(data) ?? '' }
    this.watch(expression, update)
    update()
  }

  private setupHTML(node: Element, expression: string, data: AlpineData) {
    const evaluate = this.createEvaluator(expression, data)
    const update = () => { node.innerHTML = evaluate(data) ?? '' }
    this.watch(expression, update)
    update()
  }

  private setupModel(node: Element, expression: string, data: AlpineData) {
    if (!(node instanceof HTMLInputElement) && !(node instanceof HTMLTextAreaElement) && !(node instanceof HTMLSelectElement)) return
    const evaluate = this.createEvaluator(expression, data)
    const updateInput = () => { node.value = evaluate(data) ?? '' }
    const handleInput = (e: Event) => { this.setValue(expression, (e.target as HTMLInputElement).value, data) }
    this.watch(expression, updateInput)
    node.addEventListener('input', handleInput)
    updateInput()
    ;(node as any).__alpineCleanup = () => node.removeEventListener('input', handleInput)
  }

  private setupFor(node: Element, expression: string, data: AlpineData) {
const match = expression.match(/^(?:\(([^,)]+)(?:,\s*([^)]+))?\)|([^,\s]+))\s+in\s+(.+)$/)
    if (!match) return
    const [, itemName, indexName = 'index', itemsExpr] = match
    const evaluate = this.createEvaluator(itemsExpr, data)
    const parent = node.parentNode
    const template = node.cloneNode(true) as Element
    node.remove()
    const update = () => {
      const items = evaluate(data) || []
      while (parent?.firstChild) parent.removeChild(parent.firstChild)
      items.forEach((item: any, idx: number) => {
        const clone = template.cloneNode(true) as Element
        const scope = { ...data, [itemName]: item, [indexName]: idx }
        ;(clone as any).__alpineScope = scope
        this.processNode(clone, scope)
        parent?.appendChild(clone)
      })
    }
    this.watch(itemsExpr, update)
    update()
  }

  private setupIf(node: Element, expression: string, data: AlpineData) {
    const evaluate = this.createEvaluator(expression, data)
    const parent = node.parentNode
    const comment = document.createComment(' alpine:if ')
    node.remove()
    parent?.insertBefore(comment, null)
    const update = () => {
      const result = evaluate(data)
      if (result && !comment.nextSibling) parent?.insertBefore(node.cloneNode(true), comment.nextSibling)
      else if (!result && comment.nextSibling) parent?.removeChild(comment.nextSibling)
    }
    this.watch(expression, update)
    update()
  }

  private setupEffect(node: Element, expression: string, data: AlpineData) {
    const evaluate = this.createEvaluator(expression, data)
    const update = () => { evaluate(data) }
    this.watch(expression, update)
    update()
  }

  private processEvent(node: Element, event: string, handler: string, data: AlpineData) {
    const fn = new Function('$event', `with(this) { ${handler} }`).bind(data)
    node.addEventListener(event, (e) => fn(e))
  }

  private processBinding(node: Element, prop: string, expression: string, data: AlpineData) {
    const evaluate = this.createEvaluator(expression, data)
    const update = () => {
      const result = evaluate(data)
      if (prop === 'class') {
        if (typeof result === 'object') {
          node.setAttribute('class', Object.entries(result).filter(([, v]) => v).map(([k]) => k).join(' '))
        } else {
          node.setAttribute('class', String(result))
        }
      } else if (prop === 'style') {
        if (typeof result === 'object') {
          node.setAttribute('style', Object.entries(result).map(([k, v]) => `${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}: ${v}`).join('; '))
        } else {
          node.setAttribute('style', String(result))
        }
      } else {
        node.setAttribute(prop, String(result))
      }
    }
    this.watch(expression, update)
    update()
  }

  private createEvaluator(expression: string, data: AlpineData): Function {
    const keys = Object.keys(data)
    const values = keys.map(k => data[k])
    try {
      return new Function(...keys, `return (${expression})`).bind(null, ...values)
    } catch {
      return () => null
    }
  }

  private setValue(path: string, value: any, data: AlpineData) {
    const parts = path.split('.')
    let current = data
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {}
      current = current[parts[i]]
    }
    current[parts[parts.length - 1]] = value
    this.notifyWatches(path, value)
  }

  private watch(path: string, callback: Function) {
    if (!this.watches.has(path)) this.watches.set(path, new Set())
    this.watches.get(path)!.add(callback)
  }

  private notifyWatches(path: string, value: any) {
    this.watches.get(path)?.forEach(cb => cb(value))
  }

  $watch(path: string, callback: Function) { this.watch(path, callback) }

  $dispatch(event: string, detail?: any) {
    if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent(event, { detail }))
  }

  $nextTick(callback: Function) { queueMicrotask(() => callback()) }

  $refs = {}

  destroy() {
    this.observers.forEach(o => o.disconnect())
    this.observers.clear()
    this.elements.clear()
    this.watches.clear()
  }
}
  
interface AlpineHookState extends HookState {
  instance: AlpineInstance
  data: AlpineData
  elements: Set<Element>
}

export function useAlpine(data: AlpineData, options: AlpineOptions = {}, __sauron_id__ = _sid()) {
  return createHook(
    'useAlpine',
    __sauron_id__,
    (): AlpineHookState => {
      const s: AlpineHookState = {
        value:    undefined,
        instance: new AlpineInstance(options),
        data,
        elements: new Set()
      }
      s.cleanup = () => {
        s.instance.destroy()
        s.elements.clear()
      }
      return s
    },
    (s: AlpineHookState) => {
      const html = (strings: TemplateStringsArray, ...values: any[]) => {
        const template = strings.reduce((r, str, i) => r + str + (values[i] ?? ''), '')
        const container = document.createElement('div')
        container.innerHTML = template
        const root = container.firstElementChild as Element
        s.instance.init(root, s.data)
        s.elements.add(container)
        return root
      }

      const $watch    = (path: string, cb: Function)    => s.instance.$watch(path, cb)
      const $dispatch = (event: string, detail?: any)   => s.instance.$dispatch(event, detail)
      const $nextTick = (cb: Function)                  => s.instance.$nextTick(cb)
      const getData   = ()                              => s.data
      const setData   = (newData: Partial<AlpineData>) => Object.assign(s.data, newData)

      return { html, $watch, $dispatch, $nextTick, getData, setData, instance: s.instance }
    }
  )
}

export function xData(component: Function) {
  return (props: any) => useAlpine(component(props))
}
