import 'dotenv/config'
import express from 'express'
import { Paddle } from '@paddle/paddle-node-sdk'

const app = express()

const PORT = Number(process.env.PADDLE_PORT || 3001)

const API_KEY = process.env.PADDLE_API_KEY
const WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET
const PRO_PRICE_ID = process.env.PADDLE_PRICE_ID_PRO
const ULTIMATE_PRICE_ID = process.env.PADDLE_PRICE_ID_ULTIMATE
const ENVIRONMENT = process.env.PADDLE_ENVIRONMENT || 'unknown'

if (!API_KEY) {
  console.error('Missing PADDLE_API_KEY')
  process.exit(1)
}

if (!WEBHOOK_SECRET) {
  console.error('Missing PADDLE_WEBHOOK_SECRET')
  process.exit(1)
}

if (!PRO_PRICE_ID) {
  console.error('Missing PADDLE_PRICE_ID_PRO')
  process.exit(1)
}

if (!ULTIMATE_PRICE_ID) {
  console.error('Missing PADDLE_PRICE_ID_ULTIMATE')
  process.exit(1)
}

/*
 * Paddle SDK retained for webhook signature verification.
 */
const paddle = new Paddle(API_KEY)

const PLANS = {
  pro: {
    name: 'ALCHARMY Pro',
    priceId: PRO_PRICE_ID
  },
  ultimate: {
    name: 'ALCHARMY Ultimate',
    priceId: ULTIMATE_PRICE_ID
  }
}

/*
 * Paddle webhook.
 * Raw body MUST be preserved for signature verification.
 */
app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['paddle-signature']

    try {
      if (!signature) {
        return res.status(400).json({
          ok: false,
          error: 'Missing Paddle signature'
        })
      }

      const rawBody = req.body.toString()

      const eventData = await paddle.webhooks.unmarshal(
        rawBody,
        WEBHOOK_SECRET,
        signature
      )

      console.log(
        'PADDLE WEBHOOK VERIFIED:',
        eventData.eventType
      )

      /*
       * DRAGON + SUPABASE
       * Only verified Paddle webhooks reach this block.
       */

      const SUPABASE_URL = process.env.SUPABASE_URL
      const SUPABASE_SERVICE_ROLE_KEY =
        process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Supabase server configuration missing')
      }

      const supabaseRequest = async (path, options = {}) => {
        const response = await fetch(
          SUPABASE_URL + '/rest/v1/' + path,
          {
            ...options,
            headers: {
              apikey: SUPABASE_SERVICE_ROLE_KEY,
              Authorization:
                'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
              'Content-Type': 'application/json',
              ...(options.headers || {})
            }
          }
        )

        const text = await response.text()

        let data = null
        try {
          data = text ? JSON.parse(text) : null
        } catch {
          data = text
        }

        if (!response.ok) {
          throw new Error(
            'Supabase HTTP ' +
            response.status +
            ': ' +
            JSON.stringify(data)
          )
        }

        return data
      }

      const eventId = eventData.eventId
      const eventType = eventData.eventType
      const transaction = eventData.data || {}
      const transactionId = transaction.id || null
      const paddleCustomerId = transaction.customerId || null

      if (!eventId) {
        throw new Error('Paddle event ID missing')
      }

      /*
       * Idempotency check.
       */
      const existingEvents = await supabaseRequest(
        'paddle_webhook_events?paddle_event_id=eq.' +
        encodeURIComponent(eventId) +
        '&select=id,processing_status'
      )

      if (Array.isArray(existingEvents) && existingEvents.length > 0) {
        console.log(
          'DRAGON WEBHOOK DUPLICATE:',
          eventId
        )

        return res.status(200).json({
          ok: true,
          service: 'ALCHARMY_PADDLE',
          webhook: 'DUPLICATE',
          event_id: eventId,
          processing_status:
            existingEvents[0].processing_status
        })
      }

      /*
       * Record verified event.
       */
      await supabaseRequest(
        'paddle_webhook_events',
        {
          method: 'POST',
          headers: {
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({
            paddle_event_id: eventId,
            event_type: eventType,
            transaction_id: transactionId,
            paddle_customer_id: paddleCustomerId,
            signature_present: true,
            signature_verified: true,
            payload: eventData,
            processing_status: 'received'
          })
        }
      )

      /*
       * Only completed transactions can grant access.
       */
      if (eventType !== 'transaction.completed') {
        return res.status(200).json({
          ok: true,
          service: 'ALCHARMY_PADDLE',
          webhook: 'VERIFIED_RECORDED',
          event_id: eventId,
          event_type: eventType,
          fulfillment: 'NOT_REQUIRED'
        })
      }

      /*
       * Resolve internal user through the existing
       * Paddle customer mapping.
       */
      let userId = null

      if (paddleCustomerId) {
        const customers = await supabaseRequest(
          'paddle_customers?paddle_customer_id=eq.' +
          encodeURIComponent(paddleCustomerId) +
          '&select=user_id&limit=1'
        )

        if (Array.isArray(customers) && customers.length > 0) {
          userId = customers[0].user_id
        }
      }

      if (!userId) {
        await supabaseRequest(
          'paddle_webhook_events?paddle_event_id=eq.' +
          encodeURIComponent(eventId),
          {
            method: 'PATCH',
            headers: {
              Prefer: 'return=minimal'
            },
            body: JSON.stringify({
              processing_status: 'awaiting_user_mapping',
              processing_error:
                'No internal user mapping for Paddle customer'
            })
          }
        )

        return res.status(200).json({
          ok: true,
          service: 'ALCHARMY_PADDLE',
          webhook: 'VERIFIED',
          event_id: eventId,
          transaction_id: transactionId,
          fulfillment:
            'BLOCKED_USER_MAPPING_REQUIRED'
        })
      }

      /*
       * Determine entitlement from the transaction price.
       */
      const firstItem = Array.isArray(transaction.items)
        ? transaction.items[0]
        : null

      const priceId = firstItem?.price?.id || null
      const productId = firstItem?.price?.productId || null

      let entitlementKey = null

      if (priceId === PRO_PRICE_ID) {
        entitlementKey = 'alcharmy_pro'
      } else if (priceId === ULTIMATE_PRICE_ID) {
        entitlementKey = 'alcharmy_ultimate'
      }

      if (!entitlementKey) {
        await supabaseRequest(
          'paddle_webhook_events?paddle_event_id=eq.' +
          encodeURIComponent(eventId),
          {
            method: 'PATCH',
            headers: {
              Prefer: 'return=minimal'
            },
            body: JSON.stringify({
              processing_status: 'unknown_price',
              processing_error:
                'Transaction price is not mapped to an ALCHARMY entitlement'
            })
          }
        )

        return res.status(200).json({
          ok: true,
          service: 'ALCHARMY_PADDLE',
          webhook: 'VERIFIED',
          event_id: eventId,
          transaction_id: transactionId,
          fulfillment: 'BLOCKED_UNKNOWN_PRICE',
          price_id: priceId
        })
      }

      /*
       * Grant DRAGON entitlement.
       */
      await supabaseRequest(
        'dragon_entitlements',
        {
          method: 'POST',
          headers: {
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({
            user_id: userId,
            paddle_transaction_id: transactionId,
            paddle_event_id: eventId,
            product_id: productId,
            entitlement_key: entitlementKey,
            status: 'active',
            starts_at: new Date().toISOString(),
            source: 'paddle'
          })
        }
      )

      /*
       * Mark event processed.
       */
      await supabaseRequest(
        'paddle_webhook_events?paddle_event_id=eq.' +
        encodeURIComponent(eventId),
        {
          method: 'PATCH',
          headers: {
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({
            processing_status: 'processed',
            processed_at: new Date().toISOString()
          })
        }
      )

      return res.status(200).json({
        ok: true,
        service: 'ALCHARMY_PADDLE',
        webhook: 'VERIFIED',
        event_id: eventId,
        event_type: eventType,
        transaction_id: transactionId,
        entitlement: entitlementKey,
        fulfillment: 'DRAGON_GRANTED'
      })

    } catch (error) {
      console.error(
        'Paddle webhook verification failed:',
        error.message
      )

      return res.status(403).json({
        ok: false,
        error: 'Webhook verification failed'
      })
    }
  }
)

/*
 * JSON parser must come AFTER the raw webhook route.
 */
app.use(express.json())

/*
 * POST /checkout
 *
 * Body:
 * {
 *   "plan": "pro"
 * }
 *
 * or:
 *
 * {
 *   "plan": "ultimate"
 * }
 */
app.post('/checkout', async (req, res) => {
  try {
    const plan = String(req.body?.plan || '').toLowerCase()
    const selectedPlan = PLANS[plan]

    if (!selectedPlan) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid plan',
        allowed_plans: ['pro', 'ultimate']
      })
    }

    /*
     * Direct Paddle API request.
     *
     * This path is intentionally used instead of
     * paddle.transactions.create() because direct
     * Node fetch authentication has been verified
     * successfully in this environment.
     */
    const response = await fetch(
      'https://api.paddle.com/transactions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              price_id: selectedPlan.priceId,
              quantity: 1
            }
          ],
          custom_data: {
            source: 'ALCHARMY',
            plan,
            product: selectedPlan.name
          }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error(
        'Paddle transaction creation failed:',
        data?.error?.detail || data
      )

      return res.status(response.status).json({
        ok: false,
        error: 'Unable to create Paddle checkout',
        details:
          data?.error?.detail ||
          data?.error?.code ||
          'Paddle API error'
      })
    }

    const transaction = data.data

    return res.status(200).json({
      ok: true,
      service: 'ALCHARMY_PADDLE',
      environment: ENVIRONMENT,
      plan,
      transaction_id: transaction.id,
      checkout_url: transaction.checkout?.url || null
    })
  } catch (error) {
    console.error(
      'Checkout error:',
      error.message
    )

    return res.status(500).json({
      ok: false,
      error: 'Unable to create Paddle checkout',
      details: error.message
    })
  }
})

/*
 * GET /checkout/pro
 */
app.get('/checkout/pro', async (req, res) => {
  try {
    const response = await fetch(
      'https://api.paddle.com/transactions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              price_id: PRO_PRICE_ID,
              quantity: 1
            }
          ],
          custom_data: {
            source: 'ALCHARMY',
            plan: 'pro',
            product: 'ALCHARMY Pro'
          }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: 'Unable to create Paddle checkout',
        details: data?.error?.detail || 'Paddle API error'
      })
    }

    const checkoutUrl = data.data?.checkout?.url

    if (!checkoutUrl) {
      return res.status(502).json({
        ok: false,
        error: 'Paddle checkout URL was not returned',
        transaction_id: data.data?.id || null
      })
    }

    return res.redirect(303, checkoutUrl)
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'Unable to create Paddle checkout',
      details: error.message
    })
  }
})

/*
 * GET /checkout/ultimate
 */
app.get('/checkout/ultimate', async (req, res) => {
  try {
    const response = await fetch(
      'https://api.paddle.com/transactions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              price_id: ULTIMATE_PRICE_ID,
              quantity: 1
            }
          ],
          custom_data: {
            source: 'ALCHARMY',
            plan: 'ultimate',
            product: 'ALCHARMY Ultimate'
          }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: 'Unable to create Paddle checkout',
        details: data?.error?.detail || 'Paddle API error'
      })
    }

    const checkoutUrl = data.data?.checkout?.url

    if (!checkoutUrl) {
      return res.status(502).json({
        ok: false,
        error: 'Paddle checkout URL was not returned',
        transaction_id: data.data?.id || null
      })
    }

    return res.redirect(303, checkoutUrl)
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'Unable to create Paddle checkout',
      details: error.message
    })
  }
})

/*
 * Health
 */
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'ALCHARMY_PADDLE',
    status: 'ONLINE',
    environment: ENVIRONMENT,
    port: PORT,
    checkout: 'ENABLED',
    webhook: 'ENABLED'
  })
})

/*
 * Configuration status.
 * Never returns secrets.
 */
app.get('/config/status', (req, res) => {
  res.json({
    ok: true,
    service: 'ALCHARMY_PADDLE',
    environment: ENVIRONMENT,
    api_key: Boolean(API_KEY),
    webhook_secret: Boolean(WEBHOOK_SECRET),
    pro_price_id: Boolean(PRO_PRICE_ID),
    ultimate_price_id: Boolean(ULTIMATE_PRICE_ID),
    checkout_enabled: true
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log('======================================')
  console.log(' ALCHARMY PADDLE WEBHOOK')
  console.log('======================================')
  console.log(`Port: ${PORT}`)
  console.log(`Environment: ${ENVIRONMENT}`)
  console.log('')
  console.log('GET  /health')
  console.log('GET  /config/status')
  console.log('POST /checkout')
  console.log('GET  /checkout/pro')
  console.log('GET  /checkout/ultimate')
  console.log('POST /webhook')
  console.log('')
  console.log('Paddle API key: SET')
  console.log('Webhook secret: SET')
  console.log('======================================')
})
