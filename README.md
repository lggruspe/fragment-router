fragment-router
===============

Fragment router for Typescript/Javascript.

Installation
------------

```bash
npm install @lggruspe/fragment-router
```

Example
-------

```typescript
import { matches, Router } from '@lggruspe/fragment-router'

function changeColor (color: string) {
    return (req: Request) => {
        document.body.style.backgroundColor = color
        req.done = true
    }
}
```

License
-------

MIT
