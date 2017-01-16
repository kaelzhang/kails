const Router = require('koa-router')
const Middleware = require('./middleware')
const path = require('path')
const {fail} = require('./util')


module.exports = class {
  constructor (root, context) {
    this._router = new Router()
    this._root = root
    this._context = context
    this._middleware = new Middleware(root, context)
  }

  apply_routes () {
    const common_middlewares = this._context.config.middlewares || []
    const routes_file = path.join(this._root, 'routes')

    let routes
    try {
      routes = require(routes_file)
    } catch (e) {
      fail(e)
    }

    Object.keys(routes).forEach((location) => {
      let [
        method,
        pathname
      ] = location.split(' ')

      const config = routes[location]
      const {
        action,
        auth = true,
        middlewares = []

      } = typeof config === 'string'
        ? {
          action: config
        }
        : config

      if (auth) {
        middlewares.unshift('need-auth')
      }

      method = method.toLowerCase()

      ;[].concat(common_middlewares, middlewares).forEach((middleware) => {
        this._middleware.apply_middleware(
          this._router, middleware, method, pathname)
      })

      this._middleware.apply_action(
        this._router, action, method, pathname)
    })

    return this
  }

  apply (app) {
    app.use(this._router.routes())
  }
}
