import { PluginStack } from './plugin'
import { Request, currentRequest } from './request'

type Filter = (req: Request) => void
type Route = Filter[]

class AbortRoute {}
class AbortAll {}

export class Router {
  routes: Array<Route>
  subrouters: Array<[string, Router]>
  stack: PluginStack
  private request: Request | null
  constructor () {
    this.routes = []
    this.subrouters = []
    this.request = null
    this.stack = new PluginStack()
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

  check (control: string) {
    switch (control) {
      case 'next': {
        throw new AbortRoute()
      }
      case 'abort':
        throw new AbortAll()
      default:
        break
    }
  }

  runRoute (route: Route) {
    const req = this.request!
    for (const filter of route) {
      try {
        filter(req)
        this.check(req.control)
      } catch (e) {
        if (e instanceof AbortRoute) {
          return
        } else {
          throw e
        }
      }
    }
  }

  listen (prefix = '') {
    window.addEventListener('hashchange', () => {
      for (const route of this.routes) {
        const req = currentRequest(prefix)
        this.request = req
        try {
          this.check(req.control)
          this.stack.enter()
          this.check(req.control)
          this.runRoute(route)
          this.check(req.control)
          this.stack.exit()
          this.check(req.control)
        } catch (e) {
          if (e instanceof AbortAll) {
            break
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
