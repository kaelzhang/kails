function status_error (ctx, status, error) {
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

    return (ctx, status, error) => {
      emitter.emit('error', ctx, status, error)
    }
  }
}
