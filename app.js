const firebaseConfig = {
  apiKey: "AIzaSyC_T-sg-pLNL4eCKPr9ZFcteZkG9wG3khM",
  authDomain: "mwasiringi-forum.firebaseapp.com",
  projectId: "mwasiringi-forum",
  storageBucket: "mwasiringi-forum.firebasestorage.app",
  messagingSenderId: "1019149418572",
  appId: "1:1019149418572:web:5cc45181c0bd429932f4e9"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// ==============================
// ROLE SYSTEM
// ==============================
function getUserRole() {
  const user = auth.currentUser;
  if (!user) return;

  db.collection("users").doc(user.uid).get().then(doc => {
    if (!doc.exists) return;

    const role = doc.data().role || "member";

    const el = document.getElementById("userRole");
    if (el) el.innerText = role;

    checkPermissions(role);
  });
}

// ==============================
// PERMISSIONS
// ==============================
function checkPermissions(role) {
  const addMemberBtn = document.getElementById("addMemberBtn");
  const addVisitBtn = document.getElementById("addVisitBtn");
  const adminPanel = document.getElementById("adminPanel");

  if (addMemberBtn) addMemberBtn.style.display = "none";
  if (addVisitBtn) addVisitBtn.style.display = "none";
  if (adminPanel) adminPanel.style.display = "none";

  if (role === "treasurer") {
    if (addVisitBtn) addVisitBtn.style.display = "block";
  }

  if (role === "chairman") {
    if (addMemberBtn) addMemberBtn.style.display = "block";
    if (addVisitBtn) addVisitBtn.style.display = "block";
    if (adminPanel) adminPanel.style.display = "block";
  }
}

// ==============================
// STK PAYMENT (FIXED FOR DEPLOYMENT)
// ==============================
async function pay() {
  const phone = document.getElementById("payPhone")?.value;
  const amount = document.getElementById("payAmount")?.value;

  if (!phone || !amount) {
    alert("❗ Enter phone and amount");
    return;
  }

  try {
    // 🔥 REPLACE WITH YOUR REAL RENDER URL
    const API_URL = "https://mwasiringi-forum.onrender.com";

    const res = await fetch(`${API_URL}/stkpush`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ phone, amount })
    });

    const data = await res.json();
    console.log("📩 STK RESPONSE:", data);

    if (data.error) {
      alert("❌ Payment failed");
    } else {
      alert("📱 STK sent! Check your phone");
    }

  } catch (err) {
    console.log("❌ PAY ERROR:", err);
    alert("❌ Network error or server unreachable");
  }
}

// ==============================
// AUTH LISTENER
// ==============================
auth.onAuthStateChanged(user => {
  if (user) {
    getUserRole();
  }
});

// ==============================
// INIT
// ==============================
window.onload = function () {
  console.log("App loaded ✅");
};

// ==============================
// SEARCH VISITS
// ==============================
function searchVisits() {
  console.log("Search triggered");
}