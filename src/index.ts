export interface Request {
  id: string
  fragment: HTMLElement | null,
  params: Array<[string, string]>
  done: boolean
  prefix: string
  [key: string]: any
}

function createRequest (prefix = '') {
  const id = window.location.hash.slice(1)
  const query = window.location.search.slice(1)
  const params: Array<[string, string]> = []
  new URLSearchParams(query).forEach((v, k) => {
    params.push([k, v])
  })
  const req = {
    id,
    fragment: id ? document.getElementById(id) : null,
    params,
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
    this.routes.push(fns)
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
  }
}

// Utils

export function isHome (req: Request) {
  return req.id === '' ? req : null
}

export function isNotNull (req: Request) {
  return req.fragment ? req : null
}

export function equals (str: string) {
  return (req: Request) => req.id === str ? req : null
}

export function matches (pattern: RegExp) {
  return (req: Request) => {
    const result = pattern.exec(req.id)
    if (result) {
      req.matched = result
      return req
    }
  }
}
