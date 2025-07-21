import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const eligibleWallets = new Set();
const referrals = {};
const referralCounts = {};

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

  if (wallet.toLowerCase() === referrer?.toLowerCase()) {
    return res.status(400).json({ error: "Self-referral not allowed" });
  }

  if (referrals[wallet.toLowerCase()]) {
    return res.status(400).json({ error: "Referral already submitted" });
  }

  referrals[wallet.toLowerCase()] = referrer?.toLowerCase() || null;

  if (referrer && referrer.startsWith("0x")) {
    referralCounts[referrer.toLowerCase()] =
      (referralCounts[referrer.toLowerCase()] || 0) + 1;
  }

  eligibleWallets.add(wallet.toLowerCase());
  res.json({ success: true, referredBy: referrer || null });
});

// ✅ Admin export
app.get("/admin/export", (req, res) => {
  const data = Array.from(eligibleWallets).map((wallet) => ({
    wallet,
    referrer: referrals[wallet] || null,
    referralCount: referralCounts[wallet] || 0,
  }));
  res.json(data);
});

// ✅ Claim endpoint
app.post("/claim", (req, res) => {
  const { wallet, referrer } = req.body;

  if (!wallet || !wallet.startsWith("0x")) {
    return res.status(400).json({ success: false, message: "Invalid wallet" });
  }

  const normalizedWallet = wallet.toLowerCase();

  // Check if already claimed
  if (eligibleWallets.has(normalizedWallet)) {
    return res.json({ success: false, message: "Wallet already claimed" });
  }

  // Register wallet as claimed
  eligibleWallets.add(normalizedWallet);

  // Save referral if valid
  if (
    referrer &&
    referrer.startsWith("0x") &&
    referrer.toLowerCase() !== normalizedWallet
  ) {
    referrals[normalizedWallet] = referrer.toLowerCase();
    referralCounts[referrer.toLowerCase()] =
      (referralCounts[referrer.toLowerCase()] || 0) + 1;
  }

  return res.json({ success: true, message: "Airdrop claimed." });
});

app.listen(PORT, () => {
  console.log(`✅ CHC Airdrop server running on port ${PORT}`);
});
