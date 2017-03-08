module.exports = (options) => {
  return new Kails(options)
}


const Context = require('./context')
const Router = require('./router')
const Koa = require('koa')
const {fail} = require('./util')
const path = require('path')
const fs = require('fs')
const clone = require('clone')

class Kails {
  constructor ({
    root,

    config,
    routes,
    events,

    template_root,
    default_template_data = {},
    get_template,
    action_root,
    model_root,
    service_root,
    middleware_root
  }) {

    this._root = root = path.resolve(root)

    this._config = config = clone(this._get_config(config))
    this._events = events = this._get_events(events)
    this._routes = routes = this._get_routes(routes)

    this._get_template = get_template
    this._default_template_data = default_template_data

    model_root = this._ensure_root(model_root, 'model')
    service_root = this._ensure_root(service_root, 'service')
    action_root = this._ensure_root(action_root, 'action')
    template_root = this._ensure_root(template_root, 'template')
    middleware_root = this._ensure_root(middleware_root, 'middleware')

    this._context = new Context({
      config,
      model_root,
      service_root
    })

    this._app = new Koa
    this._uses = []

    this._processing = null
  }

  _path (type) {
    return path.join(this._root, type)
  }

  _ensure_root (value, type) {
    return this[`_${type}_root`] = value || this._path(type)
  }

  _ensure (value, type, allow_not_found) {
    if (value) {
      if (Object(value) !== value) {
        fail(`${type} must be an object, but ${value} encountered.`)
      }

      return value
    }

    const file = this._path(type)

    try {
      return require(file)
    } catch (e) {
      if (allow_not_found && e.code === 'MODULE_NOT_FOUND') {
        return {}
      }

      throw e
    }
  }

  _get_config (config) {
    try {
      return this._ensure(config, 'config')
    } catch (e) {
      e.message = `fails to read config: ${e.message}`
      fail(e)
    }
  }

  _get_routes (routes) {
    try {
      return this._ensure(routes, 'routes')
    } catch (e) {
      e.message = `no routes found: ${e.message}`
      fail(e)
    }
  }

  _get_events (events) {
    try {
      return this._ensure(events, 'events', true)
    } catch (e) {
      e.message = `fails to read events: ${e.message}`
      fail(e)
    }
  }

  // TODO
  plugin (name, plugin) {
    this._context.plugin(name, plugin)
    return this
  }

  use (...args) {
    this._uses.push(args)
    return this
  }

  _apply_uses () {
    this._uses.forEach(args => {
      this._app.use(...args)
    })
  }

  _create_events () {
    const events = this._events

    for (let key in events) {
      this._context.on(key, events[key])
    }
  }

  _create_router () {
    return this._context.create()
    .then((context) => {
      new Router({
        routes: this._routes,
        template_root: this._template_root,
        get_template: this._get_template,
        default_template_data: this._default_template_data,
        action_root: this._action_root,
        middleware_root: this._middleware_root,
        context
      })
      .apply_routes()
      .apply(this._app)

      this._apply_uses()
    })
  }

  _create () {
    if (this._processing) {
      return this._processing
    }

    this._create_events()
    return this._processing = this._create_router()
  }

  listen (port) {
    return this._create()
    .then(() => {
      return new Promise((resolve) => {
        this._app.listen(port || this._config.port, () => {
          resolve()
        })
      })
    })
  }
}
