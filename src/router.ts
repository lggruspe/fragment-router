import { check, hasPrefix } from './filters'

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

export function createRequest (id: string): Request {
  return {
    id,
    control: {
      next: new AbortRoute(),
      abort: new AbortAll()
    }
  }
}

export class Router {
  routes: Array<Route>
  subrouters: Array<[string, Router]>
  private deferred: Route
  private request: Request | null
  private exitHandlers: Array<() => void>
  constructor () {
    this.routes = []
    this.subrouters = []
    this.request = null
    this.deferred = []
    this.exitHandlers = []
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

  defer (filter: Filter) {
    this.deferred.push(filter)
  }

  onExit (...handlers: Array<() => void>) {
    this.exitHandlers.push(...handlers)
  }

  private runDeferred () {
    // Converts all exceptions into AbortAll
    const req = this.currentRequest()!
    try {
      for (const filter of this.deferred) {
        filter(req)
      }
    } catch (e) {
      throw req.control.abort
    } finally {
      this.deferred = []
    }
  }

  private runExitHandlers () {
    for (const subrouter of this.subrouters) {
      subrouter[1].runExitHandlers()
    }
    for (const handler of this.exitHandlers) {
      handler()
    }
    this.exitHandlers = []
  }

  private runRoutes (...filters: Filter[]): boolean {
    for (const [infix, subrouter] of this.subrouters) {
      const ok = subrouter.runRoutes(...filters, check(hasPrefix(infix)))
      if (ok) return true
    }

    let ok = false
    for (const route of this.routes) {
      const req = createRequest(window.location.hash.slice(1))
      this.request = req
      try {
        for (const filter of filters) {
          filter(req)
        }
      } catch (e) {
        break
      }
      try {
        if (this.runRoute(route)) {
          this.runDeferred()
          ok = true
          break
        }
      } catch (e) {
        if (e instanceof AbortAll) {
          break
        }
      }
    }
    this.request = null
    return ok
  }

  run (...filters: Filter[]): boolean {
    this.runExitHandlers()
    return this.runRoutes(...filters)
  }

  listen (...filters: Filter[]) {
    const listener = () => this.run(...filters)
    window.addEventListener('load', listener)
    window.addEventListener('hashchange', listener)
    window.addEventListener('fragment-router', listener)
    return this
  }
}
