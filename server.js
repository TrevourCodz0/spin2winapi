const express = require('express');
const supabase = require('./supabaseClient');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Weighted prize pool
const PRIZES = [
  { value: 20, currency: 'AQCNX', type: 'Common', chance: 45, angle: 60 },
  { value: 0.5, currency: 'TON', type: 'Rare', chance: 20, angle: 120 },
  { value: 100, currency: '$', type: 'Voucher', chance: 5, angle: 180 },
  { value: 30, currency: 'AQCNX', type: 'Common', chance: 20, angle: 240 },
  { value: 50, currency: 'AQCNX', type: 'Uncommon', chance: 8, angle: 300 },
  { value: 0.3, currency: 'TON', type: 'Epic', chance: 2, angle: 0 }, 
];


function getWeightedPrize(prizes) {
  const total = prizes.reduce((sum, p) => sum + p.chance, 0);
  let rand = Math.random() * total;
  for (const prize of prizes) {
    if (rand < prize.chance) return prize;
    rand -= prize.chance;
  }
  return prizes[0]; // fallback
}


// === Spin route using EMAIL ===
app.post('/spin', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const { data: user, error } = await supabase
    .from('users')
    .select('id, spin_attempts, cooldown_until, total_spins')
    .eq('email', email)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const now = new Date();
  const cooldownUntil = user.cooldown_until ? new Date(user.cooldown_until) : null;

  // Check if user is still on cooldown
  if (cooldownUntil && now < cooldownUntil) {
    const hoursLeft = ((cooldownUntil - now) / (1000 * 60 * 60)).toFixed(1);
    return res.status(403).json({ error: `Wait ${hoursLeft}h before next spin.` });
  }

  const prize = getWeightedPrize(PRIZES);
  let spinAttempts = user.spin_attempts || 0;
  let newCooldown = null;

  // "Try Again" doesn't count toward attempts
  const isTryAgain = prize.currency === '';

  if (!isTryAgain) {
    spinAttempts += 1;
  }

  // If 3 successful spins, start cooldown
  if (spinAttempts >= 3) {
    newCooldown = new Date(now.getTime() + 9 * 60 * 60 * 1000); // 9 hrs
    spinAttempts = 0; // reset for next round
  }

  const updates = {
    spin_attempts: spinAttempts,
    cooldown_until: newCooldown,
    total_spins: (user.total_spins || 0) + 1,
    last_reward: isTryAgain ? 'Try Again' : `${prize.value} ${prize.currency}`,
  };

  const { error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update user' });
  }

  res.json({
    value: prize.value,
    currency: prize.currency,
    type: prize.type,
    angle: prize.angle,
  });
});

app.post('/logout', async (req, res) => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: 'Logout successful' });
});

// Other routes
const authRoute = require('./routes/auth');
const walletRoute = require('./routes/wallet');
const logoutRoute = require('./routes/Logout');

app.use('/auth', authRoute);
app.use('/wallet', walletRoute);
app.use('/logout', logoutRoute);
const withdrawRoute = require('./routes/withdraw');
app.use('/withdraw', withdrawRoute);


// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
