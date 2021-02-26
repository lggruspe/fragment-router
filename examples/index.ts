import { check, matches, DomWriter, Router } from '@lggruspe/fragment-router'
const router = new Router()
const writer = new DomWriter(router)

router.route(
  check(matches(/^color\/(?<color>[a-z]+)$/)),
  req => {
    const color = req.params?.color
    if (color) {
      router.defer(() => {
        document.body.style.backgroundColor = color
      })
    }
  },
  req => {
    router.defer(() => {
      writer.renderHtml(`<p>#${req.id}</p>`)
    })
  }
)

router.route(
  req => {
    router.defer(() => {
      document.body.style.fontFamily = req.id
      writer.renderHtml(`<p>#${req.id}</p>`)
    })
  }
)

router.listen()
