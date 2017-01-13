// Load configurations by root dir
module.exports = {
  setup
}

const path = require('path')
const {fail} = require('./util')
const clone = require('clone')


async function setup (root) {
  let config
  const config_path = path.join(root, 'config')

  try {
    config = require(config_path)
  } catch (e) {
    const error = new Error(`fails to read config: ${e.message}`)
    error.stack = e.stack
    return Promise.reject(error)
  }

  return clone(config)
}
