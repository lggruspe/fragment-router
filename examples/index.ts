import {
  equals,
  isHome,
  matches,
  Request,
  Router
} from '@lggruspe/fragment-router'

function change (color: string) {
  return (req: Request) => {
    document.body.style.backgroundColor = color
    req.done = true
  }
}

new Router()
  .route(isHome, change('pink'))
  .route(equals('green'), change('green'))
  .route(matches(/^blue$/), change('blue'))
  .route(change('yellow'))
  .listen('color/')

new Router()
  .route(matches(/^user\/(?<user>[a-zA-Z]+)\/post\/(?<post>\d+)$/),
    (req: Request) => {
      console.log(req.matched.groups)
      req.done = true
    })
  .listen()
