import { Request, currentRequest } from './request'
import { Renderer } from './renderer'

type Filter = (req: Request) => void
type Route = Filter[]

export class Router {
  routes: Array<Route>
  subrouters: Array<[string, Router]>
  options: { [key: string]: any }
  private request: Request | null
  constructor (options = {}) {
    this.routes = []
    this.subrouters = []
    this.options = options
    this.request = null
  }

  currentRequest (exception?: any): Request | null {
    if (this.request) {
      return this.request
    }
    if (!exception) {
      return null
    }
    throw exception
  }

  route (...fns: Route) {
    if (fns.length > 0) {
      this.routes.push(fns)
    }
    return this
  }

  mount (prefix: string, subrouter: Router) {
    if (subrouter !== this) {
      this.subrouters.push([prefix, subrouter])
    }
  }

  listen (prefix = '') {
    const renderer = new Renderer(this, this.options)
    window.addEventListener('hashchange', () => {
      for (const route of this.routes) {
        const req = currentRequest(prefix)
        this.request = req
        if (req.control === 'abort') {
          this.request = null
          return
        }
        for (const filter of route) {
          filter(req)
          if (req.control === 'next') {
            this.request = null
            break
          } else if (req.control === 'abort') {
            this.request = null
            return
          }
          if (req.result instanceof window.HTMLElement) {
            renderer.write(req.result)
            this.request = null
            return
          }
        }
      }
      this.request = null
    })
    for (const [infix, subrouter] of this.subrouters) {
      subrouter.listen(prefix + infix)
    }
    return this
  }
}
