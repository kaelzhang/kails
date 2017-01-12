module.exports = function ({middlewares = [], routes}) {
  const router = new Router()
  // apply_middlewares(router, middlewares)
  apply_routes(router, routes, middlewares)
  return router
}

const Router = require('koa-router')
const {apply_middlewares, apply_action} = require('./middleware')
const path = require('path')

function apply_routes (router, routes, common_middlewares) {
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

    const m = [].concat(common_middlewares, middlewares)

    apply_middlewares(router, m, method, pathname)
    apply_action(router, action, method, pathname)
  })
}
