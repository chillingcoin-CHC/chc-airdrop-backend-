import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ In-memory data stores
const eligibleWallets = new Set();       // Stores claimed wallets
const claimedWallets = new Set();        // Prevents double claiming
const referrals = {};                    // wallet -> referrer
const referralCounts = {};               // referrer -> count

// ✅ Home
app.get("/", (req, res) => {
  res.send("🎉 CHC Airdrop Backend is Live!");
});

// ✅ Eligibility check
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

  if (lowerWallet === referrer?.toLowerCase()) {
    return res.status(400).json({ error: "Self-referral not allowed" });
  }

  if (referrals[lowerWallet]) {
    return res.status(400).json({ error: "Referral already submitted" });
  }

  referrals[lowerWallet] = referrer?.toLowerCase() || null;

  if (referrer && referrer.startsWith("0x")) {
    const lowerReferrer = referrer.toLowerCase();
    referralCounts[lowerReferrer] = (referralCounts[lowerReferrer] || 0) + 1;
  }

  eligibleWallets.add(lowerWallet);
  res.json({ success: true, referredBy: referrer || null });
});

// ✅ Claim airdrop
app.post("/claim", (req, res) => {
  const { wallet, referrer } = req.body;

  if (!wallet || !wallet.startsWith("0x")) {
    return res.status(400).json({ success: false, message: "Invalid wallet" });
  }

  const normalizedWallet = wallet.toLowerCase();

  // ❌ Already claimed
  if (claimedWallets.has(normalizedWallet)) {
    return res.json({ success: false, message: "Wallet already claimed" });
  }

  // ✅ Mark as claimed
  claimedWallets.add(normalizedWallet);
  eligibleWallets.add(normalizedWallet);

  // ✅ Save referral if valid
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

// ✅ Admin export of all claimed wallets
app.get("/admin/export", (req, res) => {
  const data = Array.from(claimedWallets).map((wallet) => ({
    wallet,
    referrer: referrals[wallet] || null,
    referralCount: referralCounts[wallet] || 0,
  }));
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`✅ CHC Airdrop server running on port ${PORT}`);
});
