const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// Update balance after buying TON/AQCNX
router.post('/update', async (req, res) => {
  const { wallet_address, add_aqcnx, add_ton } = req.body;

  if (!wallet_address) return res.status(400).json({ error: 'Wallet required' });

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('wallet_address', wallet_address)
    .single();

  if (!user) return res.status(404).json({ error: 'User not found' });

  const updated = await supabase
    .from('users')
    .update({
      reward_balance_aqcnx: user.reward_balance_aqcnx + (add_aqcnx || 0),
      reward_balance_ton: user.reward_balance_ton + (add_ton || 0),
    })
    .eq('wallet_address', wallet_address)
    .select()
    .single();

  res.json({ message: 'Balance updated', user: updated.data });
});

module.exports = router;
