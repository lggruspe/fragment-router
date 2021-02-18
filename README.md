fragment-router
===============

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/lggruspe/fragment-router/Node.js%20CI)
![GitHub](https://img.shields.io/github/license/lggruspe/fragment-router)

Fragment router for Typescript/Javascript.

Installation
------------

```bash
npm install @lggruspe/fragment-router
```

Example
-------

```typescript
import { matches, Request, Router } from '@lggruspe/fragment-router'

function changeBackgroundColor (req: Request) {
  const color = req.matched?.groups?.color
  if (color) {
    document.body.style.backgroundColor = color
  }
}

new Router()
  .route(matches(/^(?<color>[a-z]+)$/), changeBackgroundColor)
  .listen('color/')
```

See `examples/`.

License
-------

MIT
