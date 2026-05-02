import React from 'react';
import './EmptyState.css';

const EmptyState = ({
  icon = '📭',
  title = 'No data found',
  message = 'There are no items to display at the moment.',
  actionText,
  onAction,
  size = 'medium'
}) => {
  return (
    <div className={`empty-state-container ${size}`}>
      <div className="empty-state-icon">
        <span>{icon}</span>
      </div>
      <div className="empty-state-content">
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-message">{message}</p>
        {actionText && onAction && (
          <button className="empty-state-action-btn" onClick={onAction}>
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;