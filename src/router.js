const Router = require('koa-router')
const Middleware = require('./middleware')
const path = require('path')
const {fail} = require('./util')


module.exports = class {
  constructor ({
    routes,
    template_root,
    get_template,
    action_root,
    middleware_root,
    context
  }) {

    this._router = new Router()
    this._routes = routes
    this._context = context

    this._middleware = new Middleware({
      template_root,
      get_template,
      action_root,
      middleware_root,
      context
    })
  }

  apply_routes () {
    const common_middlewares = this._context.config.middlewares || []
    const routes = this._routes

    Object.keys(routes).forEach((location) => {
      let [
        method,
        pathname
      ] = location.split(' ')

      const config = routes[location]
      const {
        action,
        template,
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

      if (template) {
        this._middleware.apply_template(this._router, template, pathname)
        return
      }

      this._middleware.apply_action(
        this._router, action, method, pathname)
    })

    return this
  }

  apply (app) {
    app.use(this._router.routes())
  }
}
