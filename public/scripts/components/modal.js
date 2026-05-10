/**
 * MODAL MANAGEMENT
 * Shared utility for opening and closing cinematic modals.
 */

function openModal(modal) {
    if (!modal) return;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Add event listener to close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) closeModal(modal);
    };
}

function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    
    // Only re-enable scrolling if no other modals are open
    const openModals = document.querySelectorAll('.modal.show');
    if (openModals.length === 0) {
        document.body.style.overflow = '';
    }
}

// Global scope attachment if not already present
if (typeof window !== 'undefined') {
    window.openModal = openModal;
    window.closeModal = closeModal;
}
