module.exports = {
  fail
}


function fail (message = 'fatal error.', code = 1) {
  const error = message instanceof Error
    ? message
    : new Error(message)

  console.error(error.stack)
  process.exit(code)
}
