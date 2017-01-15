module.exports = {
  reserved: true,
  setup
}


const {
  ls
} = require('../util')
const path = require('path')


function setup () {
  const services = {}
  const service_dir = path.join(this.root, 'service')

  return ls(service_dir)
  .then(files => {
    const tasks = files.map((file) => {
      const name = path.basename(file, '.js')
      file = path.join(service_dir, file)

      try {
        services[name] = require(file)
      } catch (e) {
        return Promise.reject(e)
      }
    })

    return Promise.all(tasks)
  })
  .then(() => {
    return (name) => {
      return services[name]
    }
  })
}
