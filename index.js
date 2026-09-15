const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const stripeKey = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.trim() : '';
const stripe = require('stripe')(stripeKey);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Statické soubory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

const PACKAGES = {
  10: { amount: 10, priceCzk: 10, name: '10 broků do vzduchovky' },
  25: { amount: 25, priceCzk: 20, name: '25 broků do vzduchovky' },
  50: { amount: 50, priceCzk: 40, name: '50 broků do vzduchovky' }
};

app.post('/api/payment/create-checkout', async (req, res) => {
  try {
    if (!stripeKey || stripeKey.startsWith('sk_test_placeholder')) {
      return res.status(500).json({ error: 'Není nastaven platný STRIPE_SECRET_KEY v Renderu!' });
    }

    const { ammoCount } = req.body;
    const selectedPack = PACKAGES[ammoCount];

    if (!selectedPack) {
      return res.status(400).json({ error: 'Neplatný balíček broků' });
    }

    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const domain = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'czk',
            product_data: {
              name: selectedPack.name,
              description: 'Pouťová střelnice - střelivo',
            },
            unit_amount: selectedPack.priceCzk * 100, // haléře
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${domain}/?admin=strelnice2026&payment=success&ammo=${selectedPack.amount}&spent=${selectedPack.priceCzk}`,
      cancel_url: `${domain}/?admin=strelnice2026&payment=cancelled`,
    });

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Chyba Stripe:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Střelnice běží na portu ${PORT}`);
});
