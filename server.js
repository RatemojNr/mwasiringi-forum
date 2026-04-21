const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();

// ==========================
// MIDDLEWARE
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ==========================
// DARAJA CREDENTIALS
// ==========================
const consumerKey = "NJ8isz5U7YGNsCewhRpjjj1d0OwKL6mngvw5KNXaKdTtM6XQ";
const consumerSecret = "KaCGk5ddHXZkzoU5ABFq3RshjodD11XyZWPdYOLP30orJm06V7GmNPvC4oceARfe";
const shortcode = "174379";
const passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

// ==========================
// FORMAT PHONE
// ==========================
function formatPhone(phone) {
  return phone
    .replace(/\+/g, "")
    .replace(/\s/g, "")
    .replace(/^0/, "254");
}

// ==========================
// GET ACCESS TOKEN
// ==========================
async function getAccessToken() {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  console.log("🔄 Getting access token...");

  const response = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`
      }
    }
  );

  console.log("✅ Token received");

  return response.data.access_token;
}

// ==========================
// STK PUSH ROUTE
// ==========================
app.post("/stkpush", async (req, res) => {
  console.log("📩 STK request received:", req.body);

  try {
    let { phone, amount } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ error: "Phone and amount required" });
    }

    phone = formatPhone(phone);
    amount = Number(amount);

    const token = await getAccessToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);

    const password = Buffer.from(
      shortcode + passkey + timestamp
    ).toString("base64");

    console.log("📞 Phone:", phone);
    console.log("💰 Amount:", amount);
    console.log("🔐 Password generated");

    const stkResponse = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: "https://mwasiringi-forum.onrender.com/callback"
        AccountReference: "MWASIRINGI",
        TransactionDesc: "Forum Payment"
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("✅ STK SUCCESS:", stkResponse.data);

    return res.json(stkResponse.data);

  } catch (err) {
    console.log("❌ STK ERROR:", err.response?.data || err.message);

    return res.status(500).json({
      error: err.response?.data || err.message
    });
  }
});

// ==========================
// CALLBACK
// ==========================
app.post("/callback", (req, res) => {
  console.log("📥 CALLBACK RECEIVED:", req.body);
  res.json({ message: "Callback received" });
});

// ==========================
// HOME ROUTE
// ==========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ==========================
// START SERVER
// ==========================
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});