module.exports = async (app) => {
  const ontology = await connect()
  model.set_connection(ontology)

  app.use(async (ctx, next) => {
    ctx.model = model
    ctx.redis = redis

    return next()
  })
}

// Basic preparation:
// - database connection
// - redis connection

const connect = require('./connection')
const model = require('./model')
// const {
//   redis
// } = require('./redis')
const redis = null
