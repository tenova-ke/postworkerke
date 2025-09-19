const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');
const stripe = require('stripe');

require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const stripeClient = stripe(STRIPE_SECRET);

/**
 * Google OAuth callback to capture refresh token and store in Supabase
 * Redirect URI must match Google console setting: YOUTUBE_REDIRECT_URI
 */
app.get('/google/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('No code');

  const oAuth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );

  try {
    const { tokens } = await oAuth2Client.getToken(code);
    // tokens.refresh_token is needed to upload later
    // You should know mapping from user -> state param; for simplicity, pass user_id in state.
    // Expected: state = user_id
    const userId = req.query.state;
    if (!userId) return res.status(400).send('No user id in state');

    await supabase.from('users').update({
      youtube_refresh_token: tokens.refresh_token,
      youtube_access_token: tokens.access_token,
      youtube_token_expires_at: new Date(Date.now() + (tokens.expiry_date || 0))
    }).eq('id', userId);

    res.send('YouTube connected! You may close this window.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Token exchange failed');
  }
});

/**
 * Stripe webhook endpoint
 */
app.post('/stripe/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripeClient.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // session.client_reference_id could be user id
    const userId = session.client_reference_id;
    // Update supabase record
    supabase.from('users').update({ subscription_status: 'active', stripe_customer_id: session.customer }).eq('id', userId)
      .then(() => console.log('User subscription activated:', userId))
      .catch(console.error);
  }

  res.json({ received: true });
});

const PORT = process.env.WEBHOOK_PORT || 3000;
app.listen(PORT, () => console.log(`Webhooks running on ${PORT}`));
