import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const eligibleWallets = new Set();
const referrals = {};
const referralCounts = {};

// ✅ Root test
app.get("/", (req, res) => {
  res.send("🎉 CHC Airdrop Backend is Live!");
});

// ✅ Check eligibility
app.get("/check-eligibility", (req, res) => {
  const { wallet } = req.query;
  if (!wallet || !wallet.startsWith("0x")) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }
  const isEligible = eligibleWallets.has(wallet.toLowerCase());
  res.json({ eligible: isEligible });
});

// ✅ Submit referral
app.post("/referral", (req, res) => {
  const { wallet, referrer } = req.body;
  if (!wallet || !wallet.startsWith("0x")) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }

  const lowerWallet = wallet.toLowerCase();
  const lowerRef = referrer?.toLowerCase();

  if (lowerWallet === lowerRef) {
    return res.status(400).json({ error: "Self-referral not allowed" });
  }

  if (referrals[lowerWallet]) {
    return res.status(400).json({ error: "Referral already submitted" });
  }

  referrals[lowerWallet] = lowerRef || null;
  if (lowerRef) {
    referralCounts[lowerRef] = (referralCounts[lowerRef] || 0) + 1;
  }

  eligibleWallets.add(lowerWallet);
  res.json({ success: true, referredBy: lowerRef || null });
});

// ✅ Claim airdrop
app.post("/claim", (req, res) => {
  const { wallet, referrer } = req.body;
  if (!wallet || !wallet.startsWith("0x")) {
    return res.status(400).json({ success: false, message: "Invalid wallet" });
  }

  const lowerWallet = wallet.toLowerCase();
  const lowerRef = referrer?.toLowerCase();

  if (eligibleWallets.has(lowerWallet)) {
    return res.json({ success: false, message: "Wallet already claimed" });
  }

  eligibleWallets.add(lowerWallet);

  if (lowerRef && lowerWallet !== lowerRef) {
    referrals[lowerWallet] = lowerRef;
    referralCounts[lowerRef] = (referralCounts[lowerRef] || 0) + 1;
  }

  res.json({ success: true, message: "Airdrop claimed." });
});

// ✅ Admin export for manual distribution
app.get("/export", (req, res) => {
  const data = Array.from(eligibleWallets).map((wallet) => ({
    wallet,
    referrer: referrals[wallet] || null,
    referralsMade: referralCounts[wallet] || 0
  }));
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`✅ CHC Airdrop server running on port ${PORT}`);
});
