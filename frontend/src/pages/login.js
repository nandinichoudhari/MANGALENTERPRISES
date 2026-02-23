import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiUrl } from '../api';

function Login() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: ""
  });
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // STEP 1: Send Email OTP
  const sendOtp = async () => {
    if (!formData.name || !formData.phone || !formData.email) {
      alert("Fill all fields");
      return;
    }

    if (formData.phone.length !== 10) {
      alert("Phone must be 10 digits");
      return;
    }

    try {
      const res = await fetch(apiUrl("/api/send-email-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          name: formData.name
        })
      });

      const data = await res.json();

      if (data.success) {
        setStep(2);
        alert(`📧 OTP sent to ${formData.email}! Check inbox/spam`);
      } else {
        alert(data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error(error);
      alert("Server error. Please try again.");
    }
  };

  // STEP 2: Verify Email OTP
  const verifyOtp = async () => {
    try {
      const res = await fetch(apiUrl("/api/verify-email-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.phone,
          email: formData.email,
          otp
        })
      });

      const data = await res.json();

      if (data.success) {
        // Clear previous user's session data before setting new user
        const prevPhone = localStorage.getItem('phone');
        if (prevPhone && prevPhone !== formData.phone) {
          // Different user is logging in — wipe all user-specific data
          ['cart', 'checkoutCart', 'checkoutTotal',
            'selectedAddress', 'deliveryAddress',
            'menuQuantities', 'menuActiveTab',
            'lastOrder', 'currentUserName', 'currentUserEmail'
          ].forEach(k => localStorage.removeItem(k));
        }

        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("phone", formData.phone);
        localStorage.setItem("userEmail", formData.email);
        localStorage.setItem("userName", formData.name);
        localStorage.setItem("token", data.token);
        // NOTE: Do NOT set deliveryAddress here — Address.js sets it when
        // the user picks/saves an address. Setting it here overwrites the real one.

        const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
        if (cartItems.length > 0) {
          navigate("/address");   // go through address step before payment
        } else {
          navigate("/cart");
        }

      } else {
        alert(data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error(error);
      alert("Verification failed");
    }
  };

  return (
    <div className="page-content">
      <div className="login-container">
        <h2 className="page-title">Login / Signup</h2>

        {step === 1 ? (
          <>
            <p>Enter details to receive OTP on email</p>

            <div className="input-group">
              <input
                name="name"
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                className="login-input"
              />
            </div>

            <div className="input-group">
              <input
                name="phone"
                type="tel"
                placeholder="Phone (10 digits)"
                value={formData.phone}
                onChange={handleInputChange}
                className="login-input"
                maxLength="10"
              />
            </div>

            <div className="input-group">
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className="login-input"
              />
            </div>

            <button className="login-btn" onClick={sendOtp}>
              Send OTP to Email
            </button>
          </>
        ) : (
          <>
            <p>
              Enter OTP sent to <strong>{formData.email}</strong>
            </p>

            <div className="input-group">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="login-input"
                maxLength="6"
              />
            </div>

            <button className="login-btn" onClick={verifyOtp}>
              Verify & Continue
            </button>

            <button
              className="login-btn"
              onClick={() => setStep(1)}
              style={{ background: "#6c757d" }}
            >
              Edit Details
            </button>
          </>
        )}

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link to="/cart" className="login-link">
            ← Back to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;