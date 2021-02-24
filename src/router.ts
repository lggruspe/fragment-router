import { PluginStack } from './plugin'
import { withPrefix } from './filters'

class AbortRoute {}
class AbortAll {}

export interface Request {
  id: string
  control: {
    next: AbortRoute,
    abort: AbortAll
  }
  [key: string]: any
}

type Filter = (req: Request) => void
type Route = Filter[]

function currentRequest (): Request {
  return {
    id: window.location.hash.slice(1),
    control: {
      next: new AbortRoute(),
      abort: new AbortAll()
    }
  }
}

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

  runRoute (route: Route): boolean {
    const req = this.request!
    for (const filter of route) {
      try {
        filter(req)
      } catch (e) {
        if (e instanceof AbortRoute) {
          return false
        } else {
          throw e
        }
      }
    }
    return true
  }

  listen (prefix = '') {
    const prefixFilter = withPrefix(prefix)
    window.addEventListener('hashchange', () => {
      for (const route of this.routes) {
        const req = currentRequest()
        this.request = req
        if (!prefixFilter(req)) {
          break
        }
        try {
          this.stack.enter()
          if (this.runRoute(route)) {
            this.stack.exit()
            break
          }
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
