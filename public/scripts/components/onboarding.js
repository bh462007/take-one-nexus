/**
 * FUTURISTIC NEXUS ONBOARDING TOUR
 * Interactive HUD sequence for guiding visitors.
 */

(function() {
  const TOUR_STORAGE_KEY = 'take_one_tour_completed';

  const TOUR_STEPS = [
    {
      targetSelector: 'header .logo',
      title: 'Nexus Hub',
      body: 'Welcome to Take One Nexus. The easiest way to find your film crew online and collaborate with creators.',
      placement: 'bottom'
    },
    {
      targetSelector: '#guestHeroActions',
      title: 'Choose Your Pathway',
      body: 'Select your pathway: Upload your own script to recruit crew members, or browse active projects to join as a crew operative.',
      placement: 'bottom'
    },
    {
      targetSelector: 'header nav a[href="#explore"]',
      title: 'Discover Projects',
      body: 'Browse live pitches, explore screenplay synopses, and request to join production teams looking for talent.',
      placement: 'bottom'
    },
    {
      targetSelector: '#navCrewLink',
      title: 'Crew Finder',
      body: 'Find specific operatives by role: sound designers, cinematographers, editors, and directors.',
      placement: 'bottom'
    },
    {
      targetSelector: '#loginBtn',
      title: 'Activate Your Signal',
      body: 'Ready to join? Click here to register your profile, choose your crew role, and build your digital film identity.',
      placement: 'bottom'
    }
  ];

  let currentStepIndex = 0;
  let overlayEl = null;
  let spotlightEl = null;
  let tooltipEl = null;

  function initTour() {
    // Only run tour if not completed and not logged in (guest page)
    if (localStorage.getItem(TOUR_STORAGE_KEY)) {
      createReplayButton();
      return;
    }

    // Wait for DOM and dynamic updates to settle
    setTimeout(() => {
      if (isUserLoggedIn()) return; // Don't annoy logged-in users with introduction guide
      startTour();
    }, 2500);
  }

  function isUserLoggedIn() {
    return typeof API !== 'undefined' && API.auth && API.auth.isLoggedIn();
  }

  function startTour() {
    currentStepIndex = 0;
    createTourElements();
    showStep(currentStepIndex);
    createReplayButton(true); // Hide replay while active
  }

  function createTourElements() {
    if (document.getElementById('nexusTourOverlay')) return;

    overlayEl = document.createElement('div');
    overlayEl.id = 'nexusTourOverlay';
    overlayEl.className = 'nexus-tour-overlay';

    spotlightEl = document.createElement('div');
    spotlightEl.className = 'nexus-tour-spotlight';
    overlayEl.appendChild(spotlightEl);

    tooltipEl = document.createElement('div');
    tooltipEl.className = 'nexus-tour-tooltip tour-pulse-glow';
    overlayEl.appendChild(tooltipEl);

    document.body.appendChild(overlayEl);

    // Dynamic update on resize or scroll
    window.addEventListener('resize', updateLayout);
    window.addEventListener('scroll', updateLayout);
  }

  function destroyTourElements() {
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
      spotlightEl = null;
      tooltipEl = null;
    }
    window.removeEventListener('resize', updateLayout);
    window.removeEventListener('scroll', updateLayout);
    createReplayButton(false);
  }

  function showStep(index) {
    if (index < 0 || index >= TOUR_STEPS.length) {
      completeTour();
      return;
    }

    currentStepIndex = index;
    const step = TOUR_STEPS[index];
    const target = document.querySelector(step.targetSelector);

    if (!target || !isElementVisible(target)) {
      // Safely skip steps where target is missing or hidden
      console.warn(`Tour step target not found or invisible: ${step.targetSelector}. Skipping...`);
      showStep(index + 1);
      return;
    }

    // Update content
    tooltipEl.className = `nexus-tour-tooltip tour-pulse-glow placement-${step.placement}`;
    tooltipEl.innerHTML = `
      <div class="nexus-tour-header">
        <span class="nexus-tour-title">${step.title}</span>
        <span class="nexus-tour-step">TRANSMISSION ${index + 1}/${TOUR_STEPS.length}</span>
      </div>
      <div class="nexus-tour-body">${step.body}</div>
      <div class="nexus-tour-footer">
        <button class="nexus-tour-skip" id="tourSkipBtn">Skip</button>
        <div class="nexus-tour-nav">
          ${index > 0 ? '<button class="nexus-tour-btn btn-prev" id="tourPrevBtn">Back</button>' : ''}
          <button class="nexus-tour-btn btn-next" id="tourNextBtn">
            ${index === TOUR_STEPS.length - 1 ? 'Finish' : 'Next →'}
          </button>
        </div>
      </div>
    `;

    // Bind Button Events
    document.getElementById('tourSkipBtn').onclick = skipTour;
    if (index > 0) {
      document.getElementById('tourPrevBtn').onclick = () => showStep(index - 1);
    }
    document.getElementById('tourNextBtn').onclick = () => showStep(index + 1);

    // Scroll element into view smoothly if not visible in viewport
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Let scroll settle then position spotlight and tooltip
    setTimeout(() => {
      positionElements(target, step.placement);
    }, 300);
  }

  function positionElements(target, placement) {
    if (!target || !spotlightEl || !tooltipEl) return;

    const rect = target.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Pad spotlight size for breathing room
    const padding = 8;
    const spotlightTop = rect.top + scrollY - padding;
    const spotlightLeft = rect.left + scrollX - padding;
    const spotlightWidth = rect.width + (padding * 2);
    const spotlightHeight = rect.height + (padding * 2);

    spotlightEl.style.top = `${spotlightTop}px`;
    spotlightEl.style.left = `${spotlightLeft}px`;
    spotlightEl.style.width = `${spotlightWidth}px`;
    spotlightEl.style.height = `${spotlightHeight}px`;

    // Calculate tooltip coordinates
    let tooltipTop = 0;
    let tooltipLeft = 0;

    const tooltipRect = tooltipEl.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width || 320;
    const tooltipHeight = tooltipRect.height || 160;

    const margin = 16;

    if (placement === 'bottom') {
      tooltipTop = spotlightTop + spotlightHeight + margin;
      tooltipLeft = spotlightLeft + (spotlightWidth / 2) - 30; // Shifted slightly for arrow align
    } else if (placement === 'top') {
      tooltipTop = spotlightTop - tooltipHeight - margin;
      tooltipLeft = spotlightLeft + (spotlightWidth / 2) - 30;
    } else if (placement === 'left') {
      tooltipTop = spotlightTop + (spotlightHeight / 2) - 30;
      tooltipLeft = spotlightLeft - tooltipWidth - margin;
    } else if (placement === 'right') {
      tooltipTop = spotlightTop + (spotlightHeight / 2) - 30;
      tooltipLeft = spotlightLeft + spotlightWidth + margin;
    }

    // Keep tooltip inside viewport boundaries
    const viewportWidth = window.innerWidth;
    if (tooltipLeft + tooltipWidth > viewportWidth - 20) {
      tooltipLeft = viewportWidth - tooltipWidth - 20;
    }
    if (tooltipLeft < 20) {
      tooltipLeft = 20;
    }

    tooltipEl.style.top = `${tooltipTop}px`;
    tooltipEl.style.left = `${tooltipLeft}px`;
  }

  function updateLayout() {
    if (!overlayEl || currentStepIndex < 0 || currentStepIndex >= TOUR_STEPS.length) return;
    const step = TOUR_STEPS[currentStepIndex];
    const target = document.querySelector(step.targetSelector);
    if (target) {
      positionElements(target, step.placement);
    }
  }

  function isElementVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function skipTour() {
    localStorage.setItem(TOUR_STORAGE_KEY, 'skipped');
    destroyTourElements();
    showToast('Guide closed. Access it anytime via the bottom right HUD.');
  }

  function completeTour() {
    localStorage.setItem(TOUR_STORAGE_KEY, 'completed');
    destroyTourElements();
    showToast('Nexus Synchronized! Enjoy the platform ✦');
  }

  function createReplayButton(hide = false) {
    let btn = document.getElementById('nexusTourReplayBtn');
    
    if (hide) {
      if (btn) btn.style.display = 'none';
      return;
    }

    if (isUserLoggedIn()) {
      if (btn) btn.remove();
      return;
    }

    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'nexusTourReplayBtn';
      btn.className = 'tour-replay-fab';
      btn.title = 'Replay System Guide';
      btn.innerHTML = '?';
      
      // Inject standard styles dynamically
      const style = document.createElement('style');
      style.textContent = `
        .tour-replay-fab {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 44px;
          height: 44px;
          background: rgba(10, 12, 16, 0.85);
          border: 1px solid var(--border);
          color: var(--silver);
          border-radius: 50%;
          cursor: pointer;
          font-family: 'Space Mono', monospace;
          font-weight: bold;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9980;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .tour-replay-fab:hover {
          color: var(--neon);
          border-color: var(--neon);
          box-shadow: 0 0 15px rgba(255, 77, 26, 0.3);
          transform: scale(1.08) translateY(-2px);
        }
        @media (max-width: 768px) {
          .tour-replay-fab {
            bottom: 20px;
            right: 20px;
            width: 36px;
            height: 36px;
            font-size: 14px;
          }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(btn);

      btn.onclick = () => {
        startTour();
      };
    } else {
      btn.style.display = 'flex';
    }
  }

  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 4000);
    }
  }

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTour);
  } else {
    initTour();
  }
})();
