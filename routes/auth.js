const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

// === SIGNUP ===
router.post('/signup', async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }

  // Create user in Supabase Auth
  const { data: authUser, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) return res.status(400).json({ error: authError.message });

  const userId = authUser?.user?.id;
  if (!userId) return res.status(500).json({ error: 'Failed to get user ID after signup' });

  // Insert into 'users' table
  const { data, error } = await supabase
    .from('users')
    .insert([{
      id: userId,
      username,
      email,
      wallet_address: "randomwalletaddresss",
      reward_balance_aqcnx: 0,
      reward_balance_ton: 0,
      reward_vouchers: 0,
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ message: 'Signup successful', user: data });
});


// === LOGIN ===
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Authenticate
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) return res.status(401).json({ error: authError.message });

  const userId = authData?.user?.id;

  // Fetch user details from `users` table
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select()
    .eq('id', userId)
    .single();

  if (fetchError || !user) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  res.json({ message: 'Login successful', user });
});

module.exports = router;
