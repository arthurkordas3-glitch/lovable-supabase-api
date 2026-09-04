import fs from 'node:fs'

const file = 'server.js'
let s = fs.readFileSync(file, 'utf8')

const marker = `      /*
       * DRAGON entitlement handling will be added here
       * after webhook event/idempotency rules are configured.
       */`

const replacement = `      /*
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
      })`

if (!s.includes(marker)) {
  throw new Error('Webhook placeholder not found; no changes made')
}

s = s.replace(marker, replacement)
fs.writeFileSync(file, s)

console.log('PATCH APPLIED: Paddle -> DRAGON -> Supabase')
