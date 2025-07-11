const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// POST /withdraw
router.post('/', async (req, res) => {
  const { email, currency, amount, wallet } = req.body;

  if (!email || !currency || !amount || !wallet) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['AQCNX', 'TON'].includes(currency)) {
    return res.status(400).json({ error: 'Unsupported currency' });
  }

  // Get user by email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, reward_balance_aqcnx, reward_balance_ton')
    .eq('email', email)
    .single();

  if (userError || !user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const currentBalance =
    currency === 'AQCNX' ? user.reward_balance_aqcnx : user.reward_balance_ton;

  if (currentBalance < amount) {
    return res.status(400).json({ error: `Insufficient ${currency} balance` });
  }

  // Deduct from the correct balance field
  const balanceField =
    currency === 'AQCNX' ? 'reward_balance_aqcnx' : 'reward_balance_ton';

  const { error: updateError } = await supabase
    .from('users')
    .update({ [balanceField]: currentBalance - amount })
    .eq('email', email);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to update user balance' });
  }

  // Log the withdrawal
  const { error: logError } = await supabase.from('withdrawals').insert([
    {
      email,
      wallet_address: wallet,
      currency,
      amount,
      status: 'pending', // admin or background worker can mark as 'completed' later
    },
  ]);

  if (logError) {
    return res.status(500).json({ error: 'Withdrawal logged failed' });
  }

  return res.json({
    message: `Withdrawal of ${amount} ${currency} initiated successfully.`,
  });
});

module.exports = router;
