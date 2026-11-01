import { _sid, createHook, HookState } from '#the-cloud'

interface BoostOptions {
  url: string
  method?: string
  replace?: boolean
  target?: string
  swap?: 'innerHTML' | 'outerHTML' | 'beforebegin' | 'afterbegin' | 'beforeend' | 'afterend'
  trigger?: 'submit' | 'click' | 'change' | 'load'
  headers?: Record<string, string>
  csrf?: boolean
  indicator?: string | boolean
  transition?: boolean
}

class BoostInstance {
  private csrfToken: string | null = null

  constructor(private options: BoostOptions) {
    if (options.csrf) {
      const meta = typeof document !== 'undefined'
        ? document.querySelector('meta[name="csrf-token"]')
        : null
      this.csrfToken = meta?.getAttribute('content') || null
    }
  }

  async handleFormSubmit(form: HTMLFormElement, options: BoostOptions) {
    const url = options.url || form.action
    const method = options.method || form.method
    const formData = new FormData(form)

    if (options.csrf && this.csrfToken) {
      formData.append('_csrf', this.csrfToken)
    }

    if (options.indicator) this.showIndicator(options.indicator)

    try {
      const response = await fetch(url, {
        method,
        body: method.toLowerCase() === 'get' ? null : formData,
        headers: {
          ...options.headers,
          'X-Requested-With': 'XMLHttpRequest'
        }
      })

      if (!response.ok) throw new Error(`HTTP error ${response.status}`)

      const html = await response.text()

      if (options.target) {
        this.swapContent(options.target, html, options.swap || 'innerHTML')
      }

      if (options.replace) history.replaceState({}, '', url)
      else history.pushState({}, '', url)

      const redirect = response.headers.get('X-Redirect')
      if (redirect) {
        if (options.replace) location.replace(redirect)
        else location.href = redirect
      }
    } catch (err) {
      console.error('Boost form submission failed:', err)
    } finally {
      if (options.indicator) this.hideIndicator(options.indicator)
    }
  }

async handleLinkClick(
  link: HTMLAnchorElement,
  options: BoostOptions,
  e: MouseEvent
) {
  if (e.ctrlKey || e.metaKey || e.shiftKey) return
  e.preventDefault()
    const url = options.url || link.href

    event?.preventDefault()

    if (options.indicator) this.showIndicator(options.indicator)

    try {
      const response = await fetch(url, {
        headers: {
          ...options.headers,
          'X-Requested-With': 'XMLHttpRequest'
        }
      })

      if (!response.ok) throw new Error(`HTTP error ${response.status}`)

      const html = await response.text()

      if (options.target) {
        this.swapContent(options.target, html, options.swap || 'innerHTML')
      }

      if (options.replace) history.replaceState({}, '', url)
      else history.pushState({}, '', url)

      const title = html.match(/<title>(.*?)<\/title>/)
      if (title) document.title = title[1]

      if (options.transition) {
        document.documentElement.classList.add('page-transition')
        setTimeout(() => {
          document.documentElement.classList.remove('page-transition')
        }, 300)
      }
    } catch (err) {
      console.error('Boost link navigation failed:', err)
    } finally {
      if (options.indicator) this.hideIndicator(options.indicator)
    }
  }

  private swapContent(target: string, html: string, strategy: string) {
    const targetEl = document.querySelector(target)
    if (!targetEl) return

    const temp = document.createElement('template')
    temp.innerHTML = html
    const newContent = temp.content.querySelector(target)
    if (!newContent) return

    switch (strategy) {
      case 'innerHTML':
        targetEl.innerHTML = newContent.innerHTML
        break
      case 'outerHTML':
        targetEl.outerHTML = newContent.outerHTML
        break
      case 'beforebegin':
        targetEl.insertAdjacentHTML('beforebegin', newContent.outerHTML)
        break
      case 'afterbegin':
        targetEl.insertAdjacentHTML('afterbegin', newContent.outerHTML)
        break
      case 'beforeend':
        targetEl.insertAdjacentHTML('beforeend', newContent.outerHTML)
        break
      case 'afterend':
        targetEl.insertAdjacentHTML('afterend', newContent.outerHTML)
        break
    }

    this.reinitScripts(targetEl)
  }

  private reinitScripts(container: Element) {
    const scripts = container.querySelectorAll('script')
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script')
      Array.from(oldScript.attributes).forEach(attr => {
        newScript.setAttribute(attr.name, attr.value)
      })
      newScript.textContent = oldScript.textContent
      oldScript.parentNode?.replaceChild(newScript, oldScript)
    })
  }

  private showIndicator(indicator: string | boolean) {
    if (typeof indicator === 'string') {
      const el = document.querySelector(indicator)
      if (el instanceof HTMLElement) el.style.display = 'block'
      return
    }

    let el = document.getElementById('boost-indicator')
    if (!el) {
      el = document.createElement('div')
      el.id = 'boost-indicator'
      el.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: linear-gradient(90deg,#0070f3,#00ff00);
        animation: boost-progress 2s infinite;
        z-index: 9999;
      `
      document.body.appendChild(el)
    }
    el.style.display = 'block'
  }

  private hideIndicator(indicator: string | boolean) {
    if (typeof indicator === 'string') {
      const el = document.querySelector(indicator)
      if (el instanceof HTMLElement) el.style.display = 'none'
      return
    }

    const el = document.getElementById('boost-indicator')
    if (el) el.style.display = 'none'
  }
}

export function useBoost(options: BoostOptions, __sauron_id__ = _sid()) {
  return createHook(
    'useBoost',
    __sauron_id__,

    // ───────────────────────────────────────── initializer
    (): HookState => ({
      value: {
        instance: new BoostInstance(options),
        options
      }
    }),

    // ───────────────────────────────────────── updater
    (hook) => {
      const { instance, options } = hook.value

      const form = (props: any, children: string) => {
        const el = document.createElement('form')
        Object.entries(props).forEach(([k, v]) => {
          if (k === 'ref') {
          if (typeof v === 'function') v(el)
else if (v && typeof v === 'object' && 'current' in v) v.current = el

          } else {
            el.setAttribute(k, String(v))
          }
        })
        el.innerHTML = children
        el.addEventListener('submit', e => {
          e.preventDefault()
          instance.handleFormSubmit(el, options)
        })
        return el
      }

      const link = (props: any, children: string) => {
        const el = document.createElement('a')
        Object.entries(props).forEach(([k, v]) => el.setAttribute(k, String(v)))
        el.innerHTML = children
      el.addEventListener('click', e => {
  instance.handleLinkClick(el, options, e)
})

        return el
      }

      const button = (props: any, children: string) => {
        const el = document.createElement('button')
        Object.entries(props).forEach(([k, v]) => el.setAttribute(k, String(v)))
        el.innerHTML = children
        el.addEventListener('click', e => {
          if (el.form) {
            e.preventDefault()
            instance.handleFormSubmit(el.form, options)
          }
        })
        return el
      }

      const navigate = async (url: string, replace?: boolean) => {
        await instance.handleLinkClick(
          { href: url } as HTMLAnchorElement,
          { ...options, replace: replace ?? options.replace }
        )
      }

      return { form, link, button, navigate }
    }
  )
}

export const boostStyles = `
  @keyframes boost-progress {
    0% { transform: translateX(-100%) }
    100% { transform: translateX(100%) }
  }
  .page-transition {
    opacity: 0;
    transition: opacity .3s ease;
  }
  [data-boost-indicator] {
    transition: opacity .2s ease;
  }
`
