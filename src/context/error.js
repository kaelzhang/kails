function status_error (ctx, status = 500, error = {}) {
  ctx.status = status
  const body = {
    ...error
  }

  delete body.status
  ctx.body = body
}


module.exports = {
  reserved: true,
  setup () {
    const emitter = this.emitter
    emitter.default('error', status_error)

    return (ctx, status = 500, error = {}) => {
      emitter.emit('error', ctx, status, error)
    }
  }
}
