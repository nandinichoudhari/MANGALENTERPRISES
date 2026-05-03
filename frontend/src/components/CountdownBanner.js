import { useState, useEffect } from 'react';

const CountdownBanner = () => {
  const TARGET_DATE = new Date('2026-05-03T20:30:00+05:30').getTime();
  const initialTimeLeft = TARGET_DATE - Date.now();
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft > 0 ? initialTimeLeft : 0);
  const [isActive, setIsActive] = useState(initialTimeLeft > 0);

  useEffect(() => {
    if (initialTimeLeft <= 0) {
      setIsActive(false);
      return;
    }

    const timer = setInterval(() => {
      const distance = TARGET_DATE - Date.now();
      
      if (distance <= 0) {
        clearInterval(timer);
        setIsActive(false);
        setTimeLeft(0);
      } else {
        setTimeLeft(distance);
      }
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Run ONCE on mount — never recreate the interval

  if (!isActive) return null;

  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="zepto-style-banner">
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        .zepto-style-banner {
          background: #ffde59; /* Bright Zepto-style Yellow */
          color: #000;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          z-index: 9999;
          position: sticky;
          top: 0;
          border-bottom: 2px solid #000;
        }
        .offer-badge {
          background: #000;
          color: #ffde59;
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 900;
          font-size: 14px;
          text-transform: uppercase;
          animation: pulse 1.5s infinite ease-in-out;
        }
        .timer-container {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 800;
          font-size: 18px;
        }
        .timer-unit {
          background: #000;
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          min-width: 38px;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }
        .timer-sep {
          color: #000;
          font-weight: 900;
        }
        .offer-text {
          font-weight: 700;
          font-size: 15px;
          color: #000;
        }
        @media (max-width: 600px) {
          .zepto-style-banner {
            flex-direction: column;
            gap: 8px;
            padding: 12px;
          }
          .offer-text { font-size: 13px; }
          .timer-container { font-size: 16px; }
        }
      `}</style>
      
      <div className="offer-badge">SALE LIVE SOON</div>
      
      <div className="offer-text">
        50% OFF on 1st Order 
        <span style={{ fontSize: '12px', opacity: 0.7, marginLeft: '8px' }}> (First 20 Users)</span>
      </div>

      <div className="timer-container">
        <div className="timer-unit">{hours.toString().padStart(2, '0')}</div>
        <span className="timer-sep">:</span>
        <div className="timer-unit">{minutes.toString().padStart(2, '0')}</div>
        <span className="timer-sep">:</span>
        <div className="timer-unit">{seconds.toString().padStart(2, '0')}</div>
      </div>
    </div>
  );
};

export default CountdownBanner;
