const path = require('path')
const {fail} = require('../util')
const { EventEmitter } = require('events')
const util = require('util')

const DEFAULT_CONTEXT = {
  error: require('./error'),
  log: require('./log'),
  service: require('./service')
}


//
class EE extends EventEmitter {
  constructor (context) {
    super()
    this._defaults = {}
    this._context = context
  }

  default (name, handler) {
    if (!util.isFunction(handler)) {
      throw new TypeError(`default handler must be a function.`)
    }

    this._defaults[name] = this._wrap(handler)
    return this
  }

  _wrap (fn) {
    const context = this._context
    return (...args) => {
      return fn.apply(context, args)
    }
  }

  on (name, handler) {
    return super.on(name, this._wrap(handler))
  }

  emit (name, ...args) {
    if (this.listenerCount(name) > 0) {
      super.emit(name, ...args)
      return
    }

    const handler = this._defaults[name]
    if (handler) {
      handler(...args)
    }
  }
}


module.exports = class Context {
  constructor ({
    config,
    model_root,
    service_root
  }) {

    this._plugins = {}
    this._plugins.__proto__ = DEFAULT_CONTEXT
    this._config = config
    this._context = {}
    this._emitter = new EE(this._context)

    const _setup_context = {
      model_root,
      service_root,
      config: this._config,
      emitter: this._emitter,
      context: this._context
    }

    this._setup_context = Object.freeze(_setup_context)
  }

  plugin (name, plugin) {
    if (arguments.length === 1) {
      plugin = name
      name = plugin.name
    }

    // Do not allow 3rd plugins to use property 'reserved'
    if ('reserved' in plugin) {
      fail(`property "reserved" of plugin is not allowed.`)
    }

    if (name === 'config') {
      fail(`plugin "${name}" is reserved.`)
    }

    if (this._plugins.hasOwnProperty(name)) {
      fail(`plugin "${name}" already exists.`)
    }

    const defaults = DEFAULT_CONTEXT[name]
    if (defaults && defaults.reserved) {
      fail(`plugin "${name}" is reserved.`)
    }

    this._plugins[name] = plugin

    return this
  }

  on (type, handler) {
    this._emitter.on(type, handler)
  }

  create () {
    this._context.config = this._config
    const tasks = []

    for (let name in this._plugins) {
      const {
        setup
      } = this._plugins[name]

      // TODO: setup arguments
      const task = Promise.resolve(setup.call(this._setup_context))
      .then((plugin) => {
        this._context[name] = plugin
      })

      tasks.push(task)
    }

    return Promise.all(tasks)
    .then(() => {
      return Object.freeze(this._context)
    })
  }
}
