import { Plugin } from './plugin'
import { Router } from './router'

function defaultDiv (id: string, content: string): HTMLElement {
  const div = document.createElement('div')
  div.id = id
  div.textContent = content
  return div
}

export class Renderer {
  router: Router
  options: { [key: string]: any }
  private temporary: HTMLElement[]
  private replaced: {
    original: HTMLElement,
    replacement: HTMLElement
  }[]

  constructor (router: Router, options = {}) {
    this.router = router
    this.options = {
      container: document.body,
      ...options
    }
    this.temporary = []
    this.replaced = []
  }

  private currentId (): string {
    const exception = new Error('null request')
    const req = this.router.currentRequest(exception)!
    return req.prefix + req.id
  }

  private currentFragment (): HTMLElement | null {
    const id = this.currentId()
    return document.getElementById(id)
  }

  protected restore () {
    while (this.temporary.length) {
      this.temporary.pop()!.remove()
    }
    while (this.replaced.length) {
      const { original, replacement } = this.replaced.pop()!
      replacement.replaceWith(original)
    }
  }

  write (element: HTMLElement) {
    element.id = this.currentId()
    const fragment = this.currentFragment()
    if (fragment) {
      fragment.replaceWith(element)
      this.replaced.push({
        original: fragment,
        replacement: element
      })
    } else {
      this.options.container.appendChild(element)
      this.temporary.push(element)
    }
  }

  append (element: HTMLElement) {
    element.id = this.currentId()
    this.options.container.appendChild(element)
  }
}

export class DomAppender extends Renderer implements Plugin {
  enter () {
    this.restore()
  }

  exit () {
    const req = this.router.currentRequest()!
    if (req.result instanceof window.HTMLElement) {
      this.append(req.result)
    } else {
      this.append(defaultDiv(req.id, req.result.toString()))
    }
  }
}

export class DomWriter extends Renderer implements Plugin {
  enter () {
    this.restore()
  }

  exit () {
    const req = this.router.currentRequest()!
    if (req.result instanceof window.HTMLElement) {
      this.write(req.result)
    } else {
      this.write(defaultDiv(req.id, req.result.toString()))
    }
  }
}
