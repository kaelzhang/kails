const parse = require('co-body')

module.exports = async (ctx, next) => {
  if (ctx.request.method === 'GET') {
    return next()
  }

  try {
    ctx.request.body = await parse(ctx)

  } catch (e) {
    this.error(ctx, e.status, e)
    return
  }

  return next()
}
