const express = require('express')
const debug = require('debug')('mbaasy')

const webhookRouter = express.Router()

function webhookMiddleware(middlewareOptions) {
  webhookRouter.post('/', webhookRequest(middlewareOptions.webhookHandler))
  return webhookRouter
}

// webhook docs: https://docs.mbaasy.com/integrations/webhooks/

/**
 * Request handler for receiving webhook requests from mbaasy
 * @param {webhookHandler} webhookHandler
 * @returns {Function} the middleware function
 */
function webhookRequest(webhookHandler) {
  return function(req, res, next) {
    debug('incoming webhook', req.body)
    webhookHandler(req.body.data)
      .then(() => {
        res.status(200).send()
      })
      .catch(next)
  }
}
/**
 * The callback that is called with the request from Mbaasy to e.g. update the user in the database
 * @callback webhookHandler
 * @param {Object} mbaasyEvent - the content of the `data` property of the webhook request from Mbaasy. For its content see: https://docs.mbaasy.com/integrations/event_payloads/
 */

module.exports = webhookMiddleware
