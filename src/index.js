module.exports = (options) => {
  return new Kails(options)
}

// const Koa = require('koa')
// const prepare = require('./prepare')
// const create_router = require('./router')
// const {middlewares, routes} = require('./routes')
// const {port} = require('../config')
// const {apply_middlewares} = require('./middleware')

// prepare(app)
// .then(() => {
//   const router = create_router({middlewares, routes})

//   app
//   .use(router.routes())
//   .use(router.allowedMethods())

//   app.listen(port, () => {
//     console.log(`\nServer started at http://localhost:${port}`)
//   })
// })
// .catch((e) => {
//   console.error(`Fails to initialize: ${e.stack || e}`)
//   process.exit(1)
// })


const Context = require('./context')
const Router = require('./router')
const Koa = require('koa')

class Kails {
  constructor ({
    root,
    // preset,
    // plugins
  }) {

    this._root = root
    this._context = new Context(root)
    this._router = null
    this._app = new Koa
  }

  // TODO
  // preset () {

  // }

  // TODO
  plugin (name, plugin) {
    this._context.plugin(name, plugin)
    return this
  }

  launch () {
    return this._create()
  }

  _create () {
    return this._context.create()
    .then((context) => {
      new Router(this._root, context)
      .apply_routes()
      .apply(this._app)

      return new Promise((resolve) => {
        this._app.listen(this._context.config.port, () => {
          resolve()
        })
      })
    })
  }
}
