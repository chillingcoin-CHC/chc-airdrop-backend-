const express = require('express');
const router = express.Router();
const User = require('../models/User');

// ✅ Register wallet
router.post('/register', async (req, res) => {
  try {
    const { wallet, twitter, telegram, discord, referredBy } = req.body;
    if (!wallet) return res.status(400).json({ error: 'Wallet is required' });

    let user = await User.findOne({ wallet: wallet.toLowerCase() });
    if (user) return res.status(400).json({ error: 'Wallet already registered' });

    user = new User({
      wallet: wallet.toLowerCase(),
      twitter,
      telegram,
      discord,
      referredBy
    });

    await user.save();

    // increment referral count for referrer
    if (referredBy) {
      const ref = await User.findOne({ wallet: referredBy.toLowerCase() });
      if (ref) {
        ref.referrals += 1;
        await ref.save();
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Check if wallet is registered
router.get('/check/:wallet', async (req, res) => {
  const wallet = req.params.wallet.toLowerCase();
  const user = await User.findOne({ wallet });
  res.json({ registered: !!user });
});

// ✅ Admin: Export all users
router.get('/export', async (req, res) => {
  const users = await User.find({});
  const csv = users.map(u => ${u.wallet},${u.twitter || ''},${u.telegram || ''},${u.discord || ''},${u.referredBy || ''},${u.referrals}).join('\n');
  res.setHeader('Content-Disposition', 'attachment; filename=airdrops.csv');
  res.set('Content-Type', 'text/csv');
  res.send('wallet,twitter,telegram,discord,referredBy,referrals\n' + csv);
});

module.exports = router;
