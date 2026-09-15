const express = require('express');
const cors = require('cors');
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