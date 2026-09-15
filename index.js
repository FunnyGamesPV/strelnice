const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Obsloužení statických souborů ze složky public (nebo kořene)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Konfigurace balíčků broků
const PACKAGES = {
  10: { amount: 10, priceCzk: 10, name: '10 broků do vzduchovky' },
  25: { amount: 25, priceCzk: 20, name: '25 broků do vzduchovky' },
  50: { amount: 50, priceCzk: 40, name: '50 broků do vzduchovky' }
};

// API Endpoint pro vytvoření Stripe Checkout platby
app.post('/api/payment/create-checkout', async (req, res) => {
  try {
    const { ammoCount } = req.body;
    const selectedPack = PACKAGES[ammoCount];

    if (!selectedPack) {
      return res.status(400).json({ error: 'Neplatný balíček broků' });
    }

    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
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
      success_url: `${domain}/?payment=success&ammo=${selectedPack.amount}&spent=${selectedPack.priceCzk}`,
      cancel_url: `${domain}/?payment=cancelled`,
    });

    res.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('Chyba při vytváření Stripe relace:', error.message);
    res.status(500).json({ error: 'Chyba serveru při inicializaci platby' });
  }
});

app.listen(PORT, () => {
  console.log(`Střelnice běží na portu ${PORT}`);
});
