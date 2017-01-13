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


const load_config = require('./config')

class Kails {
  constructor ({
    root,
    // preset,
    // plugins
  }) {

    this._root = root
  }

  config (config) {
    return this._config = config
  }


  // TODO
  // preset () {

  // }

  // TODO
  // plugin () {

  // }

  launch () {
    return this._create()
    .then(app => {

    })
  }

  async _create () {
    const config = this._config || await load_config(this._root)

  }


}



const ontology = {}
function NOOP () {}

// Model
///////////////////////////////////////////////////

function model (name) {
  const model = ontology.collections[name]

  return model
}

model.set_connection = ({
  collections
}) => {
  ontology.collections = collections
  exports.set_connection = NOOP
}
