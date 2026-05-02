function RegisterRoleModal({ onSelect, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="role-modal">
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <div className="role-modal-header">
          <h2>Choose Account Type</h2>
          <p>Select how you want to join Learning Hub</p>
        </div>

        <div className="role-cards">
          <button
            className="role-card student-card"
            onClick={() => onSelect("student")}
          >
            <div className="role-illustration">🎓</div>
            <div className="role-inner">
              <span className="role-small">Register as</span>
              <h3>Student</h3>
              <p>Access lessons, notes, MCQs, AI support</p>

              <div className="role-footer">
                <span className="role-label">Student</span>
                <span className="role-check">✓</span>
              </div>
            </div>
          </button>

          <button
            className="role-card teacher-card"
            onClick={() => onSelect("teacher")}
          >
            <div className="role-illustration">👩‍🏫</div>
            <div className="role-inner">
              <span className="role-small">Register as</span>
              <h3>Teacher</h3>
              <p>Add classes, upload lessons, help students</p>

              <div className="role-footer">
                <span className="role-label">Teacher</span>
                <span className="role-check">✓</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterRoleModal;