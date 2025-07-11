const express = require('express');
const cors = require('cors');
const app = express();
const spinRoute = require('./routes/spin'); // ✅ Adjust path if different

app.use(cors());
app.use(express.json()); // ✅ Required to parse JSON bodies

// Mount the /spin route
app.use('/spin', spinRoute); // ✅ This makes POST /spin work

// Optional test route
app.get('/', (req, res) => {
  res.send('Spin-to-Earn backend running!');
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
