import { Request } from './index'

export function check (fn: (req: Request) => boolean) {
  return (req: Request) => {
    if (!fn(req)) {
      throw req.control.next
    }
  }
}

export function isHome (req: Request): boolean {
  return req.id === ''
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
      if (req.matched.groups) {
        req.params = req.matched.groups
      }
      return true
    }
    return false
  }
}

export function hasPrefix (prefix: string) {
  return (req: Request) => {
    if (!prefix) return true
    if (req.id.startsWith(prefix)) {
      req.id = req.id.slice(prefix.length)
      req.prefix = req.prefix || '' + prefix
      return true
    }
    return false
  }
}
