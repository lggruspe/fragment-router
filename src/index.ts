export interface Request {
  id: string
  fragment: HTMLElement | null,
  done: boolean
  prefix: string
  [key: string]: any
}

function createRequest (prefix?: string) {
  prefix ||= ''
  const id = window.location.hash.slice(1)
  return {
    id: id.slice(prefix.length),
    fragment: id ? document.getElementById(id) : null,
    done: !id.startsWith(prefix),
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

  /// Control flow: callback function stops processing request when
  /// req.done becomes truthy.
  /// Each route is a sequence of functions passed to this.route in
  /// the same call.
  /// The callback function will call the next function in the route
  /// if the previous function in the route returns the req object
  /// back.
  /// Otherwise, it will skip to the next route.
  listen (prefix = '') {
    window.addEventListener('hashchange', () => {
      const req = createRequest(prefix)
      for (const route of this.routes) {
        if (req.done) {
          break
        }
        for (const fn of route) {
          if (req.done) {
            break
          }
          if (fn(req) !== req) {
            break
          }
        }
      }
    })
    return this
  }
}

// Utils

export function guard (fn: (req: Request) => boolean, done: boolean = false) {
  return (req: Request): Request | undefined => {
    if (fn(req)) {
      return req
    } else {
      req.done ||= done
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
