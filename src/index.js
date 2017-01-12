const Koa = require('koa')
const prepare = require('./prepare')
const create_router = require('./router')
const {middlewares, routes} = require('./routes')
const {port} = require('../config')
const {apply_middlewares} = require('./middleware')

const app = new Koa()

prepare(app)
.then(() => {
  const router = create_router({middlewares, routes})

  app
  .use(router.routes())
  .use(router.allowedMethods())

  app.listen(port, () => {
    console.log(`\nServer started at http://localhost:${port}`)
  })
})
.catch((e) => {
  console.error(`Fails to initialize: ${e.stack || e}`)
  process.exit(1)
})


class Kails {
  constructor ({
    root
  }) {

  }

  create () {

  }

  _create () {

  }
}