const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');

router.post('/', async (req, res) => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: 'Logout successful' });
});

module.exports = router; // ✅ THIS IS REQUIRED
