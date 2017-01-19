// Create database connections
module.exports = {
  setup
}


const Waterline = require('waterline')
const {
  find_models
} = require('../util')
const path = require('path')


function setup () {
  const connections = this.config.connection
  const waterline = new Waterline()

  return find_models(path.join(this.root, 'model'))
  .then((models_list) => {

    models_list.forEach(models => {
      load_model(waterline, models)
    })

    return new Promise((resolve, reject) => {
      waterline.initialize(
        create_waterline_config(connections),
        (err, ontology) => {
          if (err) {
            console.error(`Fails to connect to database: ${err}`)
            process.exit()
          }

          const collections = ontology.collections
          resolve(name => collections[name])
        }
      )
    })
  })

}


// We have to load all schemas
// TODO
// Load connections dynamically.
// const user = require('../schema/db/user')
// const chat = require('../schema/db/chat')

// load(user)
// load(chat)


function create_waterline_config (connection_config) {
  const connections = {}
  const adapters = {}
  const adapter_list = []

  Object.keys(connection_config).forEach((name) => {
    const {
      adapter,
      config
    } = connection_config[name]

    // Automatically give adapter a name
    let adapter_index = adapter_list.indexOf(adapter)
    if (!~adapter_index) {
      adapter_index = adapter_list.length
      adapter_list.push(adapter)
    }

    const adapter_name = `adapter_${adapter_index}`

    adapters[adapter_name] = adapter
    connections[name] = config
      ? {
        ...config,
        adapter: adapter_name
      }

      : {
        adapter: adapter_name
      }
  })

  return {
    adapters,
    connections
  }
}


function load_model (waterline, {
  connection = 'default',
  models
}) {

  if (!models) {
    return
  }

  Object.keys(models).forEach((identity) => {
    const attributes = models[identity]
    const collection = Waterline.Collection.extend({
      identity,
      connection,
      attributes
    })

    waterline.loadCollection(collection)
  })
}

