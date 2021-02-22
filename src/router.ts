import { Request, currentRequest } from './request'

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

  // Control flow: router tries each route/pipeline.
  // If a route breaks (i.e. a filter fails to return a Request object),
  // then it tries another route.
  // The router stops if a filter returns an HTMLElement.
  listen (prefix = '') {
    const virtualFragments: Array<HTMLElement> = []
    window.addEventListener('hashchange', () => {
      while (virtualFragments.length) {
        virtualFragments.pop()!.remove()
      }
      for (const route of this.routes) {
        const req = currentRequest(prefix)
        this.request = req
        if (req.control === 'abort') {
          this.request = null
          return
        }
        for (const filter of route) {
          filter(req)
          const res = req.result
          if (res instanceof window.HTMLElement) {
            res.id = req.prefix + req.id
            virtualFragments.push(res)
            const container = this.options.container || document.body
            container.appendChild(res)
            this.request = null
            return
          }
          if (req.control === 'next') {
            this.request = null
            break
          } else if (req.control === 'abort') {
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
