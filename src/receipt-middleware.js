const express = require('express')
const request = require('request-promise')
const debug = require('debug')('mbaasy')

const mbaasyRouter = express.Router()

function receiptMiddleware(middlewareOptions) {
  if (!process.env.MBAASY_CLIENT_API_ACCESS_TOKEN) {
    throw new Error('MBAASY_CLIENT_API_ACCESS_TOKEN env var is missing')
  }

  if (middlewareOptions.ios) {
    mbaasyRouter.post('/ios', receiptRequestHandler('ios', middlewareOptions))
  }

  if (middlewareOptions.android) {
    mbaasyRouter.post(
      '/android',
      receiptRequestHandler('android', middlewareOptions)
    )
  }

  return mbaasyRouter
}

// docs:  https://mbaasy.com/docs/client_api/

const MBAASY_BASE_URL = 'https://api.mbaasy.com'
const MBAASY_ENDPOINTS = {
  android: `${MBAASY_BASE_URL}/client/google_play/purchase_orders`,
  ios: `${MBAASY_BASE_URL}/client/itunes_connect/receipts`
}

/**
 * Middleware for receiving IAP receipts from your clients and proxying them to Mbaasy's Client API
 * @param {String} platform - either 'ios' or 'android'
 * @param {Object} middlewareOptions
 * @param {Function} [middlewareOptions.userIdentifier] - function that receives the current `req` returns the user identifier based on that
 * @param {Function} [middlewareOptions.metadta] - function that receives the current `req` returns additional metadata based on that
 * @param {Function} [errorHandler] - function that is called in case of an error with `(err, res)`
 * @returns {Function} the middleware function
 */
function receiptRequestHandler(platform, middlewareOptions = {}) {
  return function(req, res, next) {
    debug('incoming request', platform, req.body)
    const mbaasyRequestBody = _mbaasyRequestBodyFor(req, platform)
    mbaasyRequestBody.ip_address = req.connection.remoteAddress
    if (middlewareOptions.userIdentifier) {
      mbaasyRequestBody.user_identifier = middlewareOptions.userIdentifier(req)
    }
    if (middlewareOptions.metadata) {
      mbaasyRequestBody.metadata = middlewareOptions.metadata(req)
    }

    const requestOptions = {
      method: 'POST',
      uri: MBAASY_ENDPOINTS[platform],
      body: mbaasyRequestBody,
      json: true,
      headers: {
        Authorization: `Bearer ${process.env.MBAASY_CLIENT_API_ACCESS_TOKEN}`
      }
    }

    debug('outgoing request', platform, mbaasyRequestBody)
    request(requestOptions)
      .then(parsedResponseBody => {
        debug('response', parsedResponseBody)
        res.status(200).json(parsedResponseBody)
      })
      .catch(next)
  }
}

/**
 * Function that builds the dynamic part of the request body for Mbaasy
 * @param  {Object} req - request object
 * @param  {String} platform - 'android' or 'ios'
 * @param  {String} inputFormat - the format of the receipt data in the request body
 * @returns {Object}
 */
const _mbaasyRequestBodyFor = function(
  req,
  platform,
  inputFormat = 'react-native-iap-snake-case'
) {
  if (platform === 'android' && inputFormat === 'react-native-iap-snake-case') {
    const reactNativeIapPurchase = reactNativeIapPurchaseFrom(req)
    return {
      purchase_data: reactNativeIapPurchase.data_android,
      purchase_signature: reactNativeIapPurchase.signature_android
    }
  } else if (
    platform === 'ios' &&
    inputFormat === 'react-native-iap-snake-case'
  ) {
    const reactNativeIapPurchase = reactNativeIapPurchaseFrom(req)
    const mbaasyRequestBody = {
      receipt: reactNativeIapPurchase.transaction_receipt
    }
    if (req.body.country_code) {
      mbaasyRequestBody.country_code = req.body.country_code
    }
    if (req.body.identifier_for_vendor) {
      mbaasyRequestBody.identifier_for_vendor = req.body.identifier_for_vendor
    }
    return mbaasyRequestBody
  }
}

function reactNativeIapPurchaseFrom(req) {
  const { purchase } = req.body
  if (purchase) {
    return purchase
  } else {
    throw Error('Could not find purchase information in request body', {
      body: req.body
    })
  }
}

module.exports = receiptMiddleware
