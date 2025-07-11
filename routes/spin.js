const express = require('express');
const router = express.Router();
const { supabase } = require('../supabaseClient');

// Weighted prize pool
const PRIZES = [
  { value: 10, currency: 'AQCNX', type: 'Common', chance: 30 },
  { value: 'Try Again', currency: '', type: 'None', chance: 20 },
  { value: 20, currency: 'AQCNX', type: 'Common', chance: 20 },
  { value: 50, currency: 'AQCNX', type: 'Uncommon', chance: 20 },
  { value: 1000, currency: 'AQCNX', type: 'Rare', chance: 5 },
  { value: 0.2, currency: 'TON', type: 'Epic', chance: 3 },
  { value: 0.3, currency: 'TON', type: 'Epic', chance: 1.5 },
  { value: 1, currency: 'TON', type: 'Legendary', chance: 0.3 },
  { value: 100, currency: '$', type: 'Voucher', chance: 0.2 },
];

// Weighted random selection
function getWeightedPrize(prizes) {
  const total = prizes.reduce((sum, p) => sum + p.chance, 0);
  const rand = Math.random() * total;
  let cumulative = 0;
  for (const prize of prizes) {
    cumulative += prize.chance;
    if (rand <= cumulative) return prize;
  }
  return prizes[0]; // Fallback
}

router.post('/', async (req, res) => {
  const { user_id } = req.body;
  console.log(req.body);
  if (!user_id) return res.status(400).json({ error: 'Missing user_id' });

  // Fetch user
  const { data: user, error } = await supabase
    .from('users')
    .select('last_spin_at, total_spins')
    .eq('id', user_id)
    .single();

  if (error || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Cooldown check
  const now = new Date();
  const lastSpin = user.last_spin_at ? new Date(user.last_spin_at) : null;
  if (lastSpin) {
    const hoursSince = (now - lastSpin) / (1000 * 60 * 60);
    if (hoursSince < 9) {
      const timeLeft = (9 - hoursSince).toFixed(1);
      return res.status(403).json({ error: `Wait ${timeLeft}h before next spin.` });
    }
  }

  // Get prize
  const prize = getWeightedPrize(PRIZES);

  // Update user
  const updates = {
    last_spin_at: now.toISOString(),
    total_spins: (user.total_spins || 0) + 1,
    last_reward:
      prize.currency === ''
        ? 'Try Again'
        : `${prize.value} ${prize.currency}`,
  };

  const { error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user_id);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update user' });
  }

  // Return prize info
  res.json({
    value: prize.value,
    currency: prize.currency,
    type: prize.type,
  });
});

module.exports = router;
