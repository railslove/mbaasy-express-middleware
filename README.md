This provides multipe express middleware to help you integrate the [Mbaasy](https://mbaasy.com/) In-App-Purchase validation server into your express app.

## Prerequisites

The middleware expect already parsed request bodies, which means that you will need to have the [body-parser](https://github.com/expressjs/body-parser) middleware in your express stack somwher **before** the Mbaasy middleware.

```
var bodyParser = require('body-parser')
app.use(bodyParser.json())
```

If you want webhook request validation you might also want to configure `verify` for the `body-parser` middleware, see [Request validation](#request-validation).

## Receipt uploading

Since you don't want to put your Mbaasy Client API Access Token directly into your mobile app, this is a "proxy middleware" to receive receipts from your mobile clients, add some additional metadata, and upload it to Mbaasy's Client API endpoints for [iOS](https://docs.mbaasy.com/client_api/apple_app_store/) and [Android](
https://docs.mbaasy.com/client_api/google_play/)

You will need to provide the Mbaasy Client API Access Token (from the Mbaasy App Publisher Console) to the middleware as an environment variable:

`process.env.MBAASY_CLIENT_API_ACCESS_TOKEN = 'xxx'`

This is how you integrate the middleware:

```js
const { mbaasyReceiptMiddleware } = require('mbaasy-express-middleware')

app.use(
  '/api/iap_purchases',
  mbaasyReceiptMiddleware({
    android: true,
    ios: true,
    userIdentifier: (req) => { ... }, // function that returns the user identfier for the current request/user
    metdata: (req) => { ... } // function that returns custom metada for the current request
  })
)
```

## Webhooks receving

The second middleware let's you mount an API endoint into your express app to receive [Mbaasy webhook requests](https://docs.mbaasy.com/integrations/webhooks/). You will need to supply a `webhookHandler` function that receives and processes the [Mbaasy event payload](https://docs.mbaasy.com/integrations/event_payloads/) (e.g. updates the user record in your backend's database). 

```js
const { mbaasyWebhookMiddleware } = require('mbaasy-express-middleware')

app.use(
    '/mbaasy/webhook/path',
    mbaasyWebhookMiddleware({
      webhookHandler: (mbaasyEventData) => { ... }
    })
  )
```

You will need to add the API endpoint (e.g. https://api.mycompany.com/mbaasy/webhook/path) as a webhook integration into the Mbaasy Developer Console. 

### Request validation

If you want to verify that incomming webhook requests are actually originating from Mbaasy and have not been altered, we provide a verifiction method that can be used in conjunction with the [bodyParser](https://github.com/expressjs/body-parser) middleware. You need to copy your webhook integration's HMAC secret key from the Mbaasy Developer Console and store it in an environment variable (`process.env.MBAASY_WEBHOOK_HMAC_KEY = 'xxx'`) and then add the following code to your express config:

```js
const { mbaasyWebhookVerifier } = require('mbaasy-express-middleware')

app.use(bodyParser.json({ verify: mbaasyWebhookVerifier('/mbaasy/webhook/path') }))
```

## License

MIT © [Railslove GmbH](https://railslove.com)

If you need support with your In App Purchase/node/React/React Native/Rails app, you might want to consider [hiring us](https://www.railslove.com/contact-us)

<p align="center">
  <img src="logo_rl.svg" width="500px" >
</p>
<p align="center">
  Made with 💚 in Cologne
</p>
