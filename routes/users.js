const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /user - create or update a user
router.post('/', async (req, res) => {
  const {
    wallet_address,
    username,
    reward_balance_aqcnx = 0,
    reward_balance_ton = 0,
    reward_vouchers = 0,
  } = req.body;

  if (!wallet_address) {
    return res.status(400).json({ error: 'wallet_address is required' });
  }

  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', wallet_address)
      .single();

    if (existingUser) {
      const { data, error: updateError } = await supabase
        .from('users')
        .update({
          username,
          reward_balance_aqcnx,
          reward_balance_ton,
          reward_vouchers,
        })
        .eq('wallet_address', wallet_address)
        .select()
        .single();

      if (updateError) throw updateError;
      return res.json({ message: 'User updated', data });
    } else {
      const { data, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            wallet_address,
            username,
            reward_balance_aqcnx,
            reward_balance_ton,
            reward_vouchers,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      return res.json({ message: 'User created', data });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /user/:wallet_address - retrieve a user
router.get('/:wallet_address', async (req, res) => {
  const { wallet_address } = req.params;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', wallet_address)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
