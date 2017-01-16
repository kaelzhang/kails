module.exports = {
  fail,
  find_models,
  ls
}

const globby = require('globby')
const path = require('path')


function fail (message = 'fatal error.', code = 1) {
  const error = message instanceof Error
    ? message
    : new Error(message)

  console.error(error.stack)
  process.exit(code)
}


function ls (dir) {
  return globby('*.js', {
    cwd: dir
  })
}


function find_models (model_dir) {
  return ls(model_dir).then((files) => {
    const tasks = files.map((file) => {
      file = path.join(model_dir, file)

      try {
        return Promise.resolve(require(file))
      } catch (e) {
        const error = new Error(
          `fails to get model from "${file}": ${e.message}`)
        error.stack = e.stack
        return Promise.reject(error)
      }
    })

    return Promise.all(tasks)
  })
}
