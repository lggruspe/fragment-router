import {
  matches,
  DomWriter,
  Plugin,
  Request,
  Router
} from '@lggruspe/fragment-router'

class ColorChanger implements Plugin {
  router: Router
  constructor (router: Router) {
    this.router = router
  }

  get req () {
    return this.router.currentRequest()
  }

  enter () {}

  exit () {
    const color = this.req?.color
    if (color) {
      document.body.style.backgroundColor = color
    }
  }
}

class FontChanger implements Plugin {
  router: Router
  constructor (router: Router) {
    this.router = router
  }

  get req () {
    return this.router.currentRequest()
  }

  enter () {}

  exit () {
    const font = this.req?.font
    if (font) {
      document.body.style.fontFamily = font
    }
  }
}

const router = new Router()
const colorChanger = new ColorChanger(router)
const writer = new DomWriter(router)
const fontChanger = new FontChanger(router)
router.stack.plugins.push(writer, colorChanger, fontChanger)

function setResult (req: Request) {
  req.result = '#' + req.id
}

router

  .route(
    req => {
      if (!matches(/^color\/(?<color>[a-z]+)$/)(req)) {
        throw req.control.next
      }
    },
    req => {
      const color = req.matched?.groups?.color
      if (color) {
        req.color = color
      }
    },
    setResult
  )

  .route(
    req => {
      req.font = req.id
    },
    setResult
  )

router.listen()
