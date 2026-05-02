import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try Again',
  showIcon = true
}) => {
  return (
    <div className="error-message-container">
      {showIcon && (
        <div className="error-icon">
          <span>⚠️</span>
        </div>
      )}
      <div className="error-content">
        <h3 className="error-title">{title}</h3>
        {message && <p className="error-description">{message}</p>}
        {onRetry && (
          <button className="error-retry-btn" onClick={onRetry}>
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;