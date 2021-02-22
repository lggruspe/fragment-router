fragment-router
===============

![GitHub Workflow Status](https://img.shields.io/github/workflow/status/lggruspe/fragment-router/Node.js%20CI)
[![codecov](https://codecov.io/gh/lggruspe/fragment-router/branch/main/graph/badge.svg?token=PB8FIEUHRE)](https://codecov.io/gh/lggruspe/fragment-router)
![npm (scoped)](https://img.shields.io/npm/v/@lggruspe/fragment-router)
![GitHub](https://img.shields.io/github/license/lggruspe/fragment-router)

Router for dynamically-generated HTML fragments.

Installation
------------

```bash
npm install @lggruspe/fragment-router
```

Example
-------

```typescript
import { guard, matches, Request, Router } from '@lggruspe/fragment-router'

function changeBackgroundColor (req: Request) {
  const color = req.matched?.groups?.color
  if (color) {
    document.body.style.backgroundColor = color
  }
}

new Router()
  .route(guard(matches(/^(?<color>[a-z]+)$/)), changeBackgroundColor)
  .listen('color/')
```

See `examples/`.

License
-------

MIT
