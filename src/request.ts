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
