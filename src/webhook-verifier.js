const crypto = require('crypto')
const debug = require('debug')('mbaasy')

/**
 * Creates verifier function that can verify if a webhook request was actually made by Mbaasy and is unaltered
 * based on comparing the X-SHA256-Digest in the header of the request
 * with a locally computed HMAC digest of the request body, with the same secret (MBAASY_WEBHOOK_HMAC_KEY)
 * @param  {String} webhookPath - the path under which the webhook is mounted so only requests to this path are validated
 * @return {Function} - returns the actual verification function
 */
function webhookVerifier(webhookPath) {
  return function(req, _res, buf, encoding) {
    if (req.path === webhookPath) {
      if (!process.env.MBAASY_WEBHOOK_HMAC_KEY) {
        debug(
          'not validateing the request because MBAASY_WEBHOOK_HMAC_KEY is not set'
        )
        return true
      }

      const headerDigest = req.header('X-SHA256-Digest')
      if (!headerDigest) {
        throw new Error('X-SHA256-Digest header missing')
      }

      const hmac = crypto.createHmac(
        'sha256',
        process.env.MBAASY_WEBHOOK_HMAC_KEY
      )
      hmac.update(buf, encoding)
      const computedDigest = hmac.digest('hex')

      if (computedDigest !== headerDigest) {
        throw new Error('X-SHA256-Digest and computed digest do not match')
      }

      debug(
        'successfully validated request body: X-SHA256-Digest matched with computed digest'
      )
    }
  }
}

module.exports = webhookVerifier
