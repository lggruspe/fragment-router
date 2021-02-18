export interface Request {
  id: string
  fragment: HTMLElement | null,
  done: boolean
  prefix: string
  [key: string]: any
}

function createRequest (prefix?: string) {
  const id = window.location.hash.slice(1)
  const req = {
    id,
    fragment: id ? document.getElementById(id) : null,
    done: false,
    prefix: prefix || ''
  }
  if (!prefix) {
    return req
  }
  if (!id.startsWith(prefix)) {
    req.done = true
    return req
  }
  req.id = id.slice(prefix.length)
  return req
}

type Route = Array<(req: Request) => any>

export class Router {
  routes: Array<Route>
  constructor () {
    this.routes = []
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

export function isHome (done: boolean = false) {
  return (req: Request) => {
    if (req.id === '') {
      return req
    }
    req.done ||= done
  }
}

export function isNotNull (done: boolean = false) {
  return (req: Request) => {
    if (req.fragment) {
      return req
    }
    req.done ||= done
  }
}

export function equals (str: string, done: boolean = false) {
  return (req: Request) => {
    if (req.id === str) {
      return req
    }
    req.done ||= done
  }
}

export function matches (pattern: RegExp, done: boolean = false) {
  return (req: Request) => {
    const result = pattern.exec(req.id)
    if (result) {
      req.matched = result
      return req
    }
    req.done ||= done
  }
}
