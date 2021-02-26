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
import { check, matches, DomAppender, Router } from '@lggruspe/fragment-router'

const router = new Router()
const appender = new DomAppender(router)

router.route(
  check(matches(/^hello\/(?<name>[a-z]+)$/)),
  req => {
    // print hello/<name> in console
    console.log(req.id)
    router.defer(() => {
      // append p element after processing request
      appender.renderHtml(`<p>Hello, ${req.params.name}!</p>`)
    })
  }
)

router.listen()
```

See `examples/`.

License
-------

MIT
