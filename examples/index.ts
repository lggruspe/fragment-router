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
  req.done = true
}

new Router()
  .route(guard(matches(/^(?<color>[a-z]+)$/)), changeBackgroundColor)
  .listen('color/')

new Router()
  .route(guard(equals('serif')), req => {
    document.body.style.fontFamily = 'serif'
    req.done = true
  })
  .route(guard(equals('sans-serif')), req => {
    document.body.style.fontFamily = 'sans-serif'
    req.done = true
  })
  .route(guard(equals('cursive')), req => {
    document.body.style.fontFamily = 'cursive'
    req.done = true
  })
  .route(() => {
    // default
    document.body.style.fontFamily = 'sans-serif'
  })
  .listen()
