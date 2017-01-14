module.exports = (options) => {
  return new Kails(options)
}

// const Koa = require('koa')
// const prepare = require('./prepare')
// const create_router = require('./router')
// const {middlewares, routes} = require('./routes')
// const {port} = require('../config')
// const {apply_middlewares} = require('./middleware')

// const app = new Koa()

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

class Kails {
  constructor ({
    root,
    // preset,
    // plugins
  }) {

    this._root = root
    this._context = new Context(root)
  }

  // TODO
  // preset () {

  // }

  // TODO
  // plugin () {

  // }

  launch () {
    return this._create()
  }

  _create () {
    return this._context.create()
    .then((context) => {

    })
  }
}
