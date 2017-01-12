module.exports = {
  apply_middlewares,
  apply_action
}

const path = require('path')
const fail = require('../util/fail')
const error = require('../util/server-error')

const PROJECT_SRC = path.join(__dirname, '..')
const middlewares = {}
const debug = require('debug')('qieqie')

function get_middleware (id) {
  if (id in middlewares) {
    return middlewares[id]
  }

  const filename = path.join(PROJECT_SRC, 'middleware', id)
  let middleware

  try {
    middleware = require(filename)
  } catch (e) {
    fail(`Fails to load middleware "${id}": ${e.stack || e}`)
  }

  if (typeof middleware !== 'function') {
    fail(`Middleware "${id}" is should be a function.`)
  }

  return middlewares[id] = middleware
}


// @param {Array} middlewares
function apply_middleware (router, id, method = 'use', pathname) {
  const middleware = typeof id === 'function'
    ? id
    : get_middleware(id)

  if (pathname) {
    router[method](pathname, middleware)
  } else {
    router[method](middleware)
  }
}


function apply_middlewares (router, ids, method, pathname) {
  ids.forEach((id) => {
    apply_middleware(router, id, method, pathname)
  })
}


function get_action_handler (id) {
  const [paths, m] = id.split('.')
  const filename = path.join(PROJECT_SRC, 'action', ...paths.split('/'))
  let action

  try {
    action = require(filename)
  } catch (e) {
    fail(e)
  }

  const handler = action
    ? m
      ? action[m]
      : action
    : null

  if (typeof handler !== 'function') {
    fail(`Action "${id}" is should be a function.`)
  }

  return handler
}


function wrap_action (action) {
  return async ctx => {
    debug('action: %s %s', ctx.method, ctx.path)

    let data
    try {
      data = await action(ctx)

    } catch (e) {
      error(ctx, e.status, e)
      return
    }

    if (ctx.body) {
      return
    }

    const body = {
      code: 200
    }

    if (data) {
      body.data = data
    }

    ctx.body = body
  }
}


function apply_action (router, action, method, pathname) {
  debug('adds action: %s %s', method, pathname)

  action = get_action_handler(action)
  router[method](pathname, wrap_action(action))
}
