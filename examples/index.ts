import {
  guard,
  equals,
  matches,
  Request,
  Router
} from '@lggruspe/fragment-router'

function changeBackgroundColor (req: Request) {
  const color = req.matched?.groups?.color
  if (color) {
    document.body.style.backgroundColor = color
  }
}

function hello () {
  const p = document.createElement('p')
  p.textContent = 'Hello, world!'
  return p
}

new Router()
  .route(guard(matches(/^(?<color>[a-z]+)$/)), changeBackgroundColor)
  .listen('color/')

new Router()
  .route(guard(equals('serif')), () => {
    document.body.style.fontFamily = 'serif'
    return hello()
  })
  .route(guard(equals('sans-serif')), () => {
    document.body.style.fontFamily = 'sans-serif'
    return hello()
  })
  .route(guard(equals('cursive')), () => {
    document.body.style.fontFamily = 'cursive'
    return hello()
  })
  .route(() => {
    // default
    return hello()
  })
  .listen()
