module.exports = (options) => {
  return new Kails(options)
}


const Context = require('./context')
const Router = require('./router')
const Koa = require('koa')
const {fail} = require('./util')

class Kails {
  constructor ({
    root
  }) {

    this._root = root
    this._context = new Context(root)
    this._router = null
    this._app = new Koa
  }

  // TODO
  plugin (name, plugin) {
    this._context.plugin(name, plugin)
    return this
  }

  launch () {
    return this._create()
  }

  _apply_events () {
    const events_file = path.join(this._root, 'event.js')

    return new Promise((resolve, reject) => {
      fs.access(events_file, fs.constants.R_OK, err => {
        err ? reject(err) : resolve()
      })

    }).then(
      () => {
        try {
          return require(events_file)
        } catch (e) {
          fail('fails to read events.js')
        }
      },
      err => {
        // If file not found, then skip applying events.
        return null
      }

    ).then((events) => {
      for (let key in events) {
        this._context.on(key, events[key])
      }
    })
  }

  _create () {
    const create_router = this._context.create()
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

    const create_events = this._apply_events()
    return Promise.all([
      create_router,
      create_events
    ]).then(() => {

    })
  }
}
