// Create database connections
module.exports = {
  setup
}


const Waterline = require('waterline')

function setup (connections, models) {
  const ontology = {}
  function NOOP () {}

  // Model
  ///////////////////////////////////////////////////

  function model (name) {
    const model = ontology.collections[name]

    return model
  }

  return new Promise((resolve, reject) => {
    const waterline = new Waterline()

    Object.keys(models).forEach((name) => {
      load(waterline, models[name])
    })

    waterline.initialize(
      create_waterline_config(connections),
      (err, ontology) => {
        if (err) {
          console.error(`Fails to connect to database: ${err}`)
          process.exit()
        }

        resolve(ontology)
      }
    )
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

