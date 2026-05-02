import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiUrl } from '../api';

function Feedback() {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderData] = useState(location.state?.order || null);

  useEffect(() => {
    // If we have an existing feedback, redirect back or show it's already submitted.
    if (orderData?.feedback) {
      alert("Feedback already submitted for this order!");
      navigate('/user');
    }
  }, [orderData, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating from 1 to 5 stars.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(apiUrl('/api/submit-feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, rating, comment })
      });
      const result = await response.json();
      if (result.success) {
        alert('Thank you for your feedback!');
        navigate('/user');
      } else {
        alert(result.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error(error);
      alert('API error. Please try again later.');
    }
    setSubmitting(false);
  };

  return (
    <div style={S.page}>
      <div style={S.container}>
        <h2 style={S.title}>Leave Feedback</h2>
        <p style={S.subtitle}>Order: {orderId}</p>

        <form onSubmit={handleSubmit} style={S.formCard}>
          <div style={S.ratingWrapper}>
            <p style={S.label}>How was your experience?</p>
            <div style={S.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    ...S.star,
                    color: star <= rating ? '#FFD700' : '#E8DFD5'
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div style={S.inputGroup}>
            <label style={S.label}>Additional Comments (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you liked or what we can improve..."
              style={S.textarea}
              rows={4}
            />
          </div>

          <button type="submit" disabled={submitting} style={S.submitBtn}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight: '100vh', background: '#F4F0EB', padding: '40px 20px', fontFamily: "'Inter', sans-serif" },
  container: { maxWidth: 500, margin: '0 auto' },
  title: { fontSize: 24, fontWeight: 800, color: '#2C1810', marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#8B7355', textAlign: 'center', marginBottom: 24 },
  formCard: { background: '#fff', padding: 30, borderRadius: 16, border: '1px solid #E8DFD5' },
  ratingWrapper: { textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: 600, color: '#2C1810', marginBottom: 12, display: 'block' },
  starsContainer: { display: 'flex', justifyContent: 'center', gap: 10 },
  star: { fontSize: 40, cursor: 'pointer', transition: 'color 0.2s' },
  inputGroup: { marginBottom: 24 },
  textarea: { width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #E8DFD5', fontSize: 14, minHeight: 100, boxSizing: 'border-box', outline: 'none', background: '#FFF8F0', resize: 'vertical' },
  submitBtn: { width: '100%', padding: 14, background: '#8B4513', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' },
};

export default Feedback;
