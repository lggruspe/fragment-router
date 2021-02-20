export interface Request {
  id: string
  fragment: HTMLElement | null,
  prefix: string
  [key: string]: any
}

export function currentRequest (prefix?: string) {
  prefix ||= ''
  const id = window.location.hash.slice(1)
  return {
    id: id.slice(prefix.length),
    fragment: id ? document.getElementById(id) : null,
    valid: id.startsWith(prefix),
    prefix
  }
}

type RequestHandler = (req: Request) => any
type Route = Array<RequestHandler>

export class Router {
  routes: Array<Route>
  subrouters: Array<[string, Router]>
  constructor () {
    this.routes = []
    this.subrouters = []
  }

  route (...fns: Route) {
    if (fns.length > 0) {
      this.routes.push(fns)
    }
    return this
  }

  mount (prefix: string, subrouter: Router) {
    this.subrouters.push([prefix, subrouter])
  }

  // Control flow: router tries each route/pipeline.
  // If a route breaks (i.e. a filter fails to return a Request object),
  // then it tries another route.
  // The router stops if a filter returns an HTMLElement.
  listen (prefix = '') {
    window.addEventListener('hashchange', () => {
      for (const route of this.routes) {
        const req = currentRequest(prefix)
        if (!req.valid) {
          return
        }
        for (const filter of route) {
          const res = filter(req)
          if (res instanceof window.HTMLElement) {
            /// TODO render result
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

// Utils

export function guard (fn: (req: Request) => boolean) {
  return (req: Request): Request | undefined => {
    if (fn(req)) {
      return req
    } else {
      return undefined
    }
  }
}

export function isHome (req: Request): boolean {
  return req.id === ''
}

export function isNotNull (req: Request): boolean {
  return Boolean(req.fragment)
}

export function equals (str: string) {
  return (req: Request) => {
    return req.id === str
  }
}

export function matches (pattern: RegExp) {
  return (req: Request) => {
    const result = pattern.exec(req.id)
    if (result) {
      req.matched = result
      return true
    }
    return false
  }
}

export function withPrefix (prefix: string) {
  return (req: Request) => {
    if (!prefix) return req
    if (req.id.startsWith(prefix)) {
      req.id = req.id.slice(prefix.length)
      req.prefix += prefix
      return req
    } else {
      return undefined
    }
  }
}
