const redis = require('redis')
const redis_config = require('../config').redis

const client = redis.createClient(redis_config).on('error', e => {
  console.error(`Fails to connect to redis server.\n\n${e.stack || e}`)
  process.exit(1)
})


class PromiseRedis {
  constructor (client, methods) {
    this._client = client

    methods.forEach((method) => {
      this._promisify(method)
    })
  }

  jset (key, value) {
    return this.set(key, JSON.stringify(value))
  }

  jget (key) {
    return this.get(key).then(value => JSON.parse(value))
  }

  _promisify (method) {
    this[method] = (...args) => {
      return new Promise((resolve, reject) => {
        args.push((err, result) => {
          if (err) {
            return reject(err)
          }

          resolve(result)
        })

        this._client[method](...args)
      })
    }
  }
}


const promise_redis = new PromiseRedis(
  client,
  'get set hget hset mget mset hmget hmset hgetall'.split(' ')
)


// TODO
// function memoize (config) {
//   if (typeof config === 'function') {
//     return _memoize(config, default_hasher)
//   }

//   return (fn) => {
//     return _memoize(fn, config)
//   }
// }

// function default_hasher (...args) {
//   return args.join(',')
// }

// function _memoize (fn, hasher) {
//   function decorator (...args) {
//     const key = hasher(...args)
//   }
// }


module.exports = {
  redis: promise_redis,

  // TODO
  // memoize
}
