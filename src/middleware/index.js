const path = require('path')
const fs = require('fs')
const util = require('util')
const {fail} = require('../util')
const built_in = {
  'body-parser': require('./body-parser')
}

const BUILT_INS = Object.keys(built_in)

// TODO
// 1. root configuration for middleware, action, or template
// 2. template engine settings
class Middleware {
  constructor ({
    template_root,
    get_template,
    action_root,
    middleware_root,
    context
  }) {

    this._template_root = template_root
    this._get_template = get_template
    this._action_root = action_root
    this._middleware_root = middleware_root

    this._context = context
    this._cache = {}
    this._built_in = built_in
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

  apply_template (router, id, pathname) {
    router.get(pathname, this._template(id))
  }

  _template (id) {
    const filepath = path.join(this._template_root, id)
    const get = this._get_template

    async function template (ctx, next) {
      ctx.type = 'text/html'

      try {
        const body = await get(filepath)
        ctx.body = body.toString()

      } catch (e) {
        e.message = `Fails to read template "${id}": ${e.message}`
        this.error(ctx, e.code === 'ENOENT'
          ? 404
          : 500,
          e)
      }
    }

    return (ctx, next) => {
      return template.call(this._context, ctx, next)
    }
  }

  apply_action (router, id, method, pathname) {
    const action = this._action(id)
    router[method](pathname, action)
  }

  _get (id) {
    if (id in this._cache) {
      return this._cache[id]
    }

    const filename = path.join(this._middleware_root, id)
    let middleware

    try {
      middleware = require(filename)
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND' || !~BUILT_INS.indexOf(id)) {
        fail(`Fails to load middleware "${id}": ${e.stack || e}`)
      }

      middleware = this._built_in[id]
    }

    if (typeof middleware !== 'function') {
      fail(`Middleware "${id}" is should be a function.`)
    }

    return this._cache[id] = this._wrap_middleware(middleware)
  }

  _wrap_middleware (middleware) {
    const context = this._context

    return (ctx, next) => {
      return middleware.call(context, ctx, next)
    }
  }

  _action (id) {
    const [paths, m] = id.split('.')
    const filename = path.join(
      this._action_root,
      ...paths.split('/'))

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

    return this._wrap_action(handler)
  }

  _wrap_action (action) {
    const context = this._context

    return async ctx => {
      let data
      try {
        data = await action.call(context, ctx)

      } catch (e) {
        console.log(e)
        context.error(ctx, e.status, e)
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
