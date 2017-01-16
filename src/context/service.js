module.exports = {
  reserved: true,
  setup
}


const {
  ls
} = require('../util')
const path = require('path')


function setup () {
  const service_factories = {}
  const services = {}
  const service_dir = path.join(this.root, 'service')

  return ls(service_dir)
  .then(files => {
    const tasks = files.map((file) => {
      const name = path.basename(file, '.js')
      file = path.join(service_dir, file)

      try {
        service_factories[name] = require(file)
      } catch (e) {
        return Promise.reject(e)
      }
    })

    return Promise.all(tasks)
  })
  .then(() => {
    return (name) => {
      const service = services[name]
      if (service) {
        return service
      }

      const factory = service_factories[name]
      if (!factory) {
        return
      }

      return services[name] = factory(this.context)
    }
  })
}
