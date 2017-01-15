const path = require('path')
const util = require('util')
const fail = require('../util/fail')
const error = require('../util/server-error')

const PROJECT_SRC = path.join(__dirname, '..')
const middlewares = {}


class Middleware {
  constructor (root, context) {
    this._root = root
    this._cache = {}
  }

  apply_middleware (router, id, method = 'use', pathname) {
    const middleware = util.isFunction(id)
      ? id
      : this._get(id)

    if (pathname) {
      router[method](pathname, middleware)
    } else {
      router[method](middleware)
    }
  }

  apply_action (router, action, method, pathname) {
    action = get_action_handler(action)
    router[method](pathname, wrap_action(action))
  }

  _get (id) {
    if (id in this._cache) {
      return this._cache[id]
    }

    const filename = path.join(PROJECT_SRC, 'middleware', id)
    let middleware

    try {
      middleware = require(filename)
    } catch (e) {
      fail(`Fails to load middleware "${id}": ${e.stack || e}`)
    }

    if (typeof middleware !== 'function') {
      fail(`Middleware "${id}" is should be a function.`)
    }

    return middlewares[id] = middleware
  }

  _action (id) {
    const [paths, m] = id.split('.')
    const filename = path.join(PROJECT_SRC, 'action', ...paths.split('/'))
    let action

    try {
      action = require(filename)
    } catch (e) {
      fail(e)
    }

    const handler = action
      ? m
        ? action[m]
        : action
      : null

    if (typeof handler !== 'function') {
      fail(`Action "${id}" is should be a function.`)
    }

    return handler
  }

  _wrap_action (action) {
    return async ctx => {

      let data
      try {
        data = await action(ctx)

      } catch (e) {
        error(ctx, e.status, e)
        return
      }

      if (ctx.body) {
        return
      }

      const body = {
        code: 200
      }

      if (data) {
        body.data = data
      }

      ctx.body = body
    }
  }
}


module.exports = Middleware
