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
const consumerKey = process.env.consumerKey || "NJ8isz5U7YGNsCewhRpjjj1d0OwKL6mngvw5KNXaKdTtM6XQ";
const consumerSecret = process.env.consumerSecret || "KaCGk5ddHXZkzoU5ABFq3RshjodD11XyZWPdYOLP30orJm06V7GmNPvC4oceARfe";
const shortcode = "174379";
const passkey = process.env.passkey || "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

// ==========================
// FORMAT PHONE
// ==========================
function formatPhone(phone) {
  phone = phone.toString().replace(/\s/g, "").replace(/\+/g, "");

  if (phone.startsWith("0")) {
    return "254" + phone.substring(1);
  }

  if (phone.startsWith("7")) {
    return "254" + phone;
  }

  return phone;
}

// ==========================
// ACCESS TOKEN
// ==========================
async function getAccessToken() {
  const auth = Buffer.from(
    `${consumerKey}:${consumerSecret}`
  ).toString("base64");

  const response = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`
      }
    }
  );

  return response.data.access_token;
}

// ==========================
// STK PUSH
// ==========================
app.post("/stkpush", async (req, res) => {
  console.log("📩 STK request:", req.body);

  try {
    let { phone, amount } = req.body;

    // ======================
    // VALIDATION
    // ======================
    if (!phone || !amount) {
      return res.status(400).json({
        error: "Phone and amount required"
      });
    }

    phone = formatPhone(phone);
    amount = parseInt(amount);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        error: "Invalid amount"
      });
    }

    console.log("📞 FINAL PHONE:", phone);
    console.log("💰 FINAL AMOUNT:", amount);

    const token = await getAccessToken();

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);

    const password = Buffer.from(
      shortcode + passkey + timestamp
    ).toString("base64");

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
        CallBackURL: "https://mwasiringi-forum.onrender.com/callback",
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
    console.log(
      "❌ FULL ERROR:",
      JSON.stringify(err.response?.data || err.message, null, 2)
    );

    return res.status(500).json({
      error: err.response?.data || err.message
    });
  }
});

// ==========================
// CALLBACK
// ==========================
app.post("/callback", (req, res) => {
  console.log("📥 CALLBACK RECEIVED:");
  console.log(JSON.stringify(req.body, null, 2));

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
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});