module.exports = {
  reserved: true,
  setup: () => {
    const emitter = this.emitter
    emitter.default('log', (level, message) => {
      console.log(level, message)
    })

    return (level, message) => {
      emitter.emit('log', level, message)
    }
  }
}
