const express = require('express');
const cors = requconst express = require('express');
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
    const { ammoCount } = req.body;
    console.log(`[STRIPE] Požadavek na nákup: ${ammoCount} broků`);

    if (!stripeKey || stripeKey.startsWith('sk_test_placeholder')) {
      console.error('[STRIPE CHYBA] Chybí platný STRIPE_SECRET_KEY v Renderu!');
      return res.status(500).json({ error: 'Není nastaven platný STRIPE_SECRET_KEY v Renderu!' });
    }

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
            unit_amount: selectedPack.priceCzk * 100, // částka v haléřích
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${domain}/?admin=strelnice2026&payment=success&ammo=${selectedPack.amount}&spent=${selectedPack.priceCzk}`,
      cancel_url: `${domain}/?admin=strelnice2026&payment=cancelled`,
    });

    console.log('[STRIPE] Session úspěšně vytvořena:', session.url);
    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('[STRIPE CHYBA]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`==============================================`);
  console.log(`Střelnice běží na portu ${PORT} se Stripe bránou`);
  console.log(`==============================================`);
});ire('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/payment/create-checkout', (req, res) => {
  const { ammoCount, priceCzk } = req.body;
  console.log(`\n>>> [SIMULACE PLATBY] Hráč kupuje ${ammoCount} broků za ${priceCzk} Kč! <<<`);
  
  res.json({
    simulated: true,
    newAmmo: ammoCount,
    newSpent: priceCzk
  });
});

app.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`Střelnice běží na: http://localhost:${PORT}`);
  console.log(`==============================================\n`);
});
