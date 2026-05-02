function SignUpModal({ onClose, onRegisterClick }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-header">
          <div className="modal-icon">🎓</div>
          <h2>Continue Learning</h2>
          <p>Sign up to unlock unlimited lessons, notes, and practice materials</p>
        </div>

        <div className="modal-body">
          <div className="modal-benefits">
            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <span>Access all lesson videos and notes</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <span>Practice unlimited past papers</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <span>Get instant AI support</span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">✓</span>
              <span>Track your progress</span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn solid" onClick={onRegisterClick}>
            Create Free Account
          </button>
          <button className="btn outline" onClick={onClose}>
            Maybe Later
          </button>
        </div>

        <p className="modal-notice">Already have an account? Log in from the navigation bar.</p>
      </div>
    </div>
  );
}

export default SignUpModal;
