import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from '../api';

function EmailLogin() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const sendEmailOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/send-email-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await res.json();

      if (result.success) {
        alert('📧 OTP sent to your email!');
        setStep(2);
      } else {
        alert('❌ ' + result.message);
      }
    } catch (error) {
      console.error(error);
      alert('❌ Connection failed');
    }

    setLoading(false);
  };

  const verifyEmailOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/verify-email-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const result = await res.json();

      if (result.success) {
        // Clear previous user session if switching users
        const prevEmail = localStorage.getItem('currentUserEmail') || localStorage.getItem('userEmail');
        if (prevEmail && prevEmail !== email) {
          ['cart', 'checkoutCart', 'checkoutTotal',
            'selectedAddress', 'deliveryAddress',
            'menuQuantities', 'menuActiveTab',
            'lastOrder', 'userName', 'phone', 'userEmail'
          ].forEach(k => localStorage.removeItem(k));
        }

        localStorage.setItem('loggedIn', 'true');
        localStorage.setItem('currentUserEmail', email);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('emailVerified', 'true');
        localStorage.setItem('token', result.token);

        navigate('/user');

      } else {
        alert('❌ ' + result.message);
      }
    } catch (error) {
      console.error(error);
      alert('❌ Verification failed');
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>📧 Email Login</h2>

        {step === 1 ? (
          <form onSubmit={sendEmailOtp}>
            <div className="input-wrapper">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                required
              />
            </div>
            <button className="login-btn primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyEmailOtp}>
            <div className="input-wrapper">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="6"
                className="login-input"
                required
              />
            </div>
            <button
              className="login-btn primary"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <button
              type="button"
              className="login-btn secondary"
              onClick={() => setStep(1)}
              style={{ marginTop: '1rem' }}
            >
              Change Email
            </button>
          </form>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <p>OR use Phone OTP</p>
          <button
            className="login-btn secondary"
            onClick={() => navigate('/login')}
          >
            Phone Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailLogin;