import { Router } from './router'

function defaultOptions () {
  return {
    container: document.body
  }
}

export class Renderer {
  router: Router
  options: { [key: string]: any }
  temporary: HTMLElement[]
  replaced: {
    original: HTMLElement,
    replacement: HTMLElement
  }[]

  constructor (router: Router, options = defaultOptions()) {
    this.router = router
    this.options = options
    this.temporary = []
    this.replaced = []
  }

  currentId (): string {
    const exception = new Error('null request')
    const req = this.router.currentRequest(exception)!
    return (req.prefix || '') + (req.id || '')
  }

  currentFragment (): HTMLElement | null {
    const id = this.currentId()
    return document.getElementById(id)
  }

  restore () {
    while (this.temporary.length) {
      this.temporary.pop()!.remove()
    }
    while (this.replaced.length) {
      const { original, replacement } = this.replaced.pop()!
      replacement.replaceWith(original)
    }
  }

  write (element: HTMLElement) {
    this.restore()
    element.id = this.currentId()

    const fragment = this.currentFragment()
    if (fragment) {
      fragment.replaceWith(element)
      this.replaced.push({
        original: fragment,
        replacement: element
      })
    } else {
      this.options.container.push(element)
    }
  }

  append (element: HTMLElement) {
    this.restore()
    element.id = this.currentId()
    this.options.container.appendChild(element)
  }
}
