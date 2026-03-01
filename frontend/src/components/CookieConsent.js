import React, { useEffect, useState } from 'react';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [choiceMade, setChoiceMade] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cookie_consent');
      if (!stored) {
        setVisible(true);
        document.body.style.overflow = 'hidden';
      } else {
        setChoiceMade(true);
      }
    } catch (e) {
      // ignore storage access errors
      setVisible(true);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const setConsent = (value) => {
    try {
      localStorage.setItem('cookie_consent', value);
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      document.cookie = `cookie_consent=${value}; path=/; expires=${expires.toUTCString()}`;
    } catch (e) {
      // ignore storage access errors
    }
    setVisible(false);
    setChoiceMade(true);
    document.body.style.overflow = '';
  };

  if (!visible || choiceMade) return null;

  return (
    <div className="cookie-consent-overlay">
      <div className="cookie-consent-panel">
        <h5 className="title">We Use Cookies</h5>
        <p className="text">
          We use cookies to keep you signed in, remember preferences, and improve performance. You can accept cookies to continue using the site.
        </p>
        <div className="actions">
          <button className="btn btn-black px-4" onClick={() => setConsent('accepted')}>Accept Cookies</button>
          <button className="btn btn-light px-4" onClick={() => setConsent('rejected')}>Reject</button>
        </div>
        <div className="note">Essential cookies are required for authentication and security.</div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .cookie-consent-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(2px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .cookie-consent-panel {
          width: 100%;
          max-width: 520px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
          text-align: left;
          color: #0f172a;
        }
        .cookie-consent-panel .title {
          margin: 0 0 6px 0;
          font-weight: 800;
        }
        .cookie-consent-panel .text {
          margin: 0 0 14px 0;
          color: #475569;
        }
        .cookie-consent-panel .actions {
          display: flex;
          gap: 10px;
          margin-bottom: 8px;
        }
        .cookie-consent-panel .note {
          font-size: 12px;
          color: #64748b;
        }
        @media (max-width: 576px) {
          .cookie-consent-panel { padding: 16px; }
          .cookie-consent-panel .actions { flex-direction: column; }
        }
      `}} />
    </div>
  );
};

export default CookieConsent;
