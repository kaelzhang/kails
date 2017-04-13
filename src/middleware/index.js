const path = require('path')
const fs = require('fs')
const util = require('util')
const {fail, r} = require('../util')
const built_in = {
  'body-parser': require('./body-parser')
}

const KEY_MIDDLEWARE_NAME = Symbol('kails:middleware-name')
const STR_UNSPECIFIED_PATHNAME = '[unspecified]'
const BUILT_INS = Object.keys(built_in)
const debug = require('debug')('kails')


// TODO
// 1. root configuration for middleware, action, or template
// 2. template engine settings
class Middleware {
  constructor ({
    template_root,

    // The customized method to get the template content
    get_template,
    default_template_data,
    action_root,
    middleware_root,
    context
  }) {

    this._template_root = template_root
    this._get_template = get_template
    this._default_template_data = default_template_data

    this._action_root = action_root
    this._middleware_root = middleware_root

    this._context = context
    this._cache = {}
    this._built_in = built_in
  }

  _middleware (id, method, pathname = STR_UNSPECIFIED_PATHNAME) {
    const middleware = util.isFunction(id)
      ? id
      : this._get_raw_middleware(id)

    const context = this._context

    return async (ctx, next) => {
      debug('%s %s: middleware %s', method, pathname,
        middleware[KEY_MIDDLEWARE_NAME] || middleware.name || 'middleware')

      try {
        return await middleware.call(context, ctx, next)

      } catch (e) {
        context.error(ctx, e.status, e)
      }
    }
  }

  // Get the middleware function
  _get_raw_middleware (id) {
    if (id in this._cache) {
      return this._cache[id]
    }

    const filename = path.join(this._middleware_root, id)
    let middleware

    try {
      middleware = r(filename)
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND' || !~BUILT_INS.indexOf(id)) {
        fail(`fails to load middleware "${id}": ${e.stack || e}`)
      }

      middleware = this._built_in[id]
    }

    if (typeof middleware !== 'function') {
      fail(`middleware "${id}" is should be a function.`)
    }

    // Record the middleware name
    middleware[KEY_MIDDLEWARE_NAME] = id

    return this._cache[id] = middleware
  }

  // Get and generate the koa middleware for template
  // @param {url::pathname} pathname only for debugging
  _template (id, pathname) {
    const filepath = path.join(this._template_root, id)
    const context = this._context

    return async ctx => {
      debug('GET %s: template %s', pathname, id)

      ctx.type = 'text/html'

      try {
        const template = await this._get_template(filepath)
        ctx.body = this._render_template(template)

      } catch (e) {
        context.error(ctx, e.code === 'ENOENT'
          // Template not found
          ? 404
          : 500,
          e)
      }
    }
  }

  _template_with_action (template_id, action_id, pathname) {
    const action = this._get_raw_action(action_id)
    const filepath = path.join(this._template_root, template_id)
    const context = this._context

    return async ctx => {
      debug('GET %s: action %s, template %s',
        pathname,
        action[KEY_MIDDLEWARE_NAME] || action.name || 'action',
        template_id)

      let template
      try {
        template = await this._get_template(filepath)
      } catch (e) {
        context.error(ctx, e.status, e)
        return
      }

      if (typeof template !== 'function') {
        return template
      }

      let data
      try {
        data = await action.call(context, ctx)
      } catch (e) {
        context.error(ctx, e.status, e)
        return
      }

      ctx.body = this._render_template(template, data)
    }
  }

  _render_template (template, data) {
    if (typeof template === 'function') {
      return template(data
        ? Object.assign({}, this._default_template_data, data)
        : this._default_template_data)
    }

    return template
  }

  _action (id, method, pathname = STR_UNSPECIFIED_PATHNAME) {
    const action = this._get_raw_action(id)
    const context = this._context

    return async ctx => {
      debug('%s %s: action %s', method, pathname,
        action[KEY_MIDDLEWARE_NAME] || middleware.name || 'action')

      let data
      try {
        data = await action.call(context, ctx)

      } catch (e) {
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

  _get_raw_action (id) {
    const [paths, m] = id.split('.')
    const filename = path.join(
      this._action_root,
      ...paths.split('/'))

    let action

    try {
      action = r(filename)
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

    handler[KEY_MIDDLEWARE_NAME] = id

    return handler
  }

  apply_middleware (router, id, method = 'use', pathname) {
    const middleware = this._middleware(id, method, pathname)

    if (pathname) {
      router[method](pathname, middleware)
    } else {
      router[method](middleware)
    }
  }

  apply_template (router, id, pathname) {
    router.get(pathname, this._template(id, pathname))
  }

  apply_template_with_action (router, template_id, action_id, pathname) {
    router.get(pathname,
      this._template_with_action(template_id, action_id, pathname))
  }

  apply_action (router, id, method, pathname) {
    const action = this._action(id, method, pathname)
    router[method](pathname, action)
  }
}


module.exports = Middleware
