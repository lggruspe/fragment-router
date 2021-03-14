import { Router } from './router'

function defaultDiv (id: string, content: string): HTMLElement {
  const div = document.createElement('div')
  div.id = id
  div.textContent = content
  return div
}

abstract class Renderer {
  router: Router
  options: { [key: string]: any }
  protected temporary: HTMLElement[]
  protected replaced: {
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

  protected currentId (): string {
    const exception = new Error('null request')
    const req = this.router.currentRequest(exception)!
    return req.prefix || '' + req.id
  }

  protected currentFragment (): HTMLElement | null {
    const id = this.currentId()
    return id ? this.options.container.querySelector(`[id="${id}"]`) : null
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

  abstract render (element: HTMLElement): void;

  renderContent (content: any) {
    this.render(defaultDiv(this.currentId(), content.toString()))
  }

  renderHtml (html: string) {
    // Note: only inserts first element
    const template = document.createElement('template')
    template.innerHTML = html
    const fragment = template.content
    this.render(fragment.firstElementChild as HTMLElement)
  }
}

export class DomAppender extends Renderer {
  render (element: HTMLElement) {
    this.restore()
    element.id = this.currentId()
    this.options.container.appendChild(element)
  }
}

export class DomWriter extends Renderer {
  render (element: HTMLElement) {
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
      this.options.container.appendChild(element)
      this.temporary.push(element)
    }
  }
}
