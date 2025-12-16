// Enhanced Settings Navigation System
const SettingsUI = {
    init() {
        this.sidebarLinks = document.querySelectorAll('.list-group-item-action');
        this.sections = document.querySelectorAll('.settings-section');

        if (!this.sidebarLinks.length || !this.sections.length) return;

        // Show first section by default
        this.sections.forEach((sec, i) => {
            if (i === 0) {
                sec.classList.add('active');
                sec.classList.remove('d-none');
            } else {
                sec.classList.remove('active');
                sec.classList.add('d-none');
            }
        });

        // Attach click handlers
        this.sidebarLinks.forEach(link => {
            link.addEventListener('click', e => this.onLinkClick(e, link));
        });
    },

    onLinkClick(event, link) {
        event.preventDefault();
        const targetId = link.dataset.target;

        if (!targetId) return;

        // Remove active class from links
        this.sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        // Hide all sections
        this.sections.forEach(sec => {
            sec.classList.remove('active');
            sec.classList.add('d-none');
        });

        // Show target section with animation
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.remove('d-none');
            // Allow time for browser to register display change before animation
            setTimeout(() => targetSection.classList.add('active'), 10);
        }
    },

    showSection(targetId) {
        const link = [...this.sidebarLinks].find(l => l.dataset.target === targetId);
        if (link) this.onLinkClick(new Event('click'), link);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    SettingsUI.init();
});
