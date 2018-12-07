const express = require('express')
const debug = require('debug')('mbaasy')

const webhookRouter = express.Router()

// webhook docs: https://docs.mbaasy.com/integrations/webhooks/

/**
 * Middlware for receiving webhook requests from mbaasy
 * @param {Object} middlewareOptions
 * @param {webhookHandler} middlewareOptions.webhookHandler
 * @returns {Function} the middleware function
 */
function webhookMiddleware(middlewareOptions) {
  webhookRouter.post('/', webhookRequest(middlewareOptions.webhookHandler))
  return webhookRouter
}

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
 * The callback that is called for processing the Mbaasy event (e.g. update the user in the database)
 * @callback webhookHandler
 * @param {Object} mbaasyEvent - the content of the `data` property of the webhook request from Mbaasy. For its content see {@link https://docs.mbaasy.com/integrations/event_payloads/ Mbaasy event payload docs}.
 */

module.exports = webhookMiddleware
