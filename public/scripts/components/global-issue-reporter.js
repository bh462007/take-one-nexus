/**
 * Global Issue Reporter for TAKE ONE Static Pages
 * Reusable vanilla JS component for .htm pages
 */
(function() {
  const container = document.getElementById('globalIssueReporterRoot');
  if (!container) return;

  const html = `
    <button class="static-issue-trigger" id="openIssueModal">
      <div class="icon-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF4D1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
      <span class="label">Report Issue</span>
    </button>

    <div class="issue-modal-overlay" id="issueModalOverlay" style="display: none;">
      <div class="issue-modal-content">
        <div class="issue-modal-header">
           <div class="header-left">
              <div class="kicker">System Report</div>
              <h2>Report an Issue</h2>
           </div>
           <button class="close-modal" id="closeIssueModal">&times;</button>
        </div>
        <form id="issueReportForm">
           <div class="form-group">
              <label>Subject / Title</label>
              <input type="text" id="issueTitle" required placeholder="e.g. Navigation button not working">
           </div>
           <div class="form-row">
              <div class="form-group">
                 <label>Category</label>
                 <select id="issueCategory">
                    <option value="bug">Technical Bug</option>
                    <option value="visual">Visual Glitch</option>
                    <option value="content">Content Error</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                 </select>
              </div>
              <div class="form-group">
                 <label>Screenshot URL (Optional)</label>
                 <input type="text" id="issueScreenshot" placeholder="Link to image...">
              </div>
           </div>
           <div class="form-group">
              <label>Description</label>
              <textarea id="issueDescription" required placeholder="Explain what happened..."></textarea>
           </div>
           <button type="submit" class="submit-btn" id="submitIssueBtn">Submit Report &rarr;</button>
        </form>
        <div id="issueStatus" class="issue-status"></div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  const modal = document.getElementById('issueModalOverlay');
  const openBtn = document.getElementById('openIssueModal');
  const closeBtn = document.getElementById('closeIssueModal');
  const form = document.getElementById('issueReportForm');
  const status = document.getElementById('issueStatus');

  const openModal = () => {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  };

  openBtn.onclick = openModal;
  closeBtn.onclick = closeModal;
  window.onclick = (e) => { if (e.target == modal) closeModal(); };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitIssueBtn');
    btn.disabled = true;
    btn.innerText = 'Transmitting...';

    const payload = {
      title: document.getElementById('issueTitle').value,
      category: document.getElementById('issueCategory').value,
      description: document.getElementById('issueDescription').value,
      screenshot: document.getElementById('issueScreenshot').value || null,
      location: window.location.href
    };

    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        status.innerHTML = '<div class="success">Transmission Received. Closing link...</div>';
        setTimeout(() => {
          closeModal();
          form.reset();
          status.innerHTML = '';
          btn.disabled = false;
          btn.innerHTML = 'Submit Report &rarr;';
        }, 2500);
      } else {
        throw new Error(data.message || 'Signal failure');
      }
    } catch (err) {
      status.innerHTML = '<div class="error">Transmission Error: ' + err.message + '</div>';
      btn.disabled = false;
      btn.innerHTML = 'Submit Report &rarr;';
    }
  };
})();
