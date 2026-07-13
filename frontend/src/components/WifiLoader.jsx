/**
 * The app's single loading indicator. Used for search, fetching, uploads,
 * authentication, and dashboard loading — never a default spinner.
 *
 * Usage:
 *   <WifiLoader />                          inline, no label
 *   <WifiLoader label="Loading complaints" />  inline, with label
 *   <WifiLoader overlay label="Signing in" />  full-screen overlay
 */
import React from 'react';

const WifiLoader = ({ overlay, label }) => {
  const content = (
    <div className="custom-loader-wrapper">
      <svg className="custom-spinner" viewBox="25 25 50 50">
        <circle cx="50" cy="50" r="20"></circle>
      </svg>
      {label && <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>{label}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className="loader-overlay">
        {content}
      </div>
    );
  }

  return content;
};

export default WifiLoader;
