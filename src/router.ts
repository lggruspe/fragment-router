import { Request, currentRequest } from './request'

type RequestHandler = (req: Request) => any
type Route = Array<RequestHandler>

export class Router {
  routes: Array<Route>
  subrouters: Array<[string, Router]>
  options: { [key: string]: any }
  constructor (options = {}) {
    this.routes = []
    this.subrouters = []
    this.options = options
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
        if (!req.valid) {
          return
        }
        for (const filter of route) {
          const res = filter(req)
          if (res instanceof window.HTMLElement) {
            res.id = req.prefix + req.id
            virtualFragments.push(res)
            const container = this.options.container || document.body
            container.appendChild(res)
            return
          }
          if (res !== req || !req.valid) {
            break
          }
        }
      }
    })
    for (const [infix, subrouter] of this.subrouters) {
      subrouter.listen(prefix + infix)
    }
    return this
  }
}
