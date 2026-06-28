// SafeMoney Campus - Background Visual Effects & Toast Coordinator

// 1. Toast Notification Helper function (exposed globally)
window.showToast = function(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '<i class="fa-solid fa-circle-info" style="color: var(--color-primary);"></i>';
    if (type === 'success') icon = '<i class="fa-solid fa-circle-check" style="color: var(--color-safe);"></i>';
    if (type === 'error') icon = '<i class="fa-solid fa-circle-xmark" style="color: var(--color-danger);"></i>';
    if (type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation" style="color: var(--color-warning);"></i>';
    
    toast.innerHTML = `
        ${icon}
        <div style="flex: 1; font-weight: 500; line-height: 1.4;">${message}</div>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('active'), 50);
    
    // Automatically dismiss toast
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 400);
    }, 4500);
};

document.addEventListener('DOMContentLoaded', () => {
    // 2. Mouse Spotlight Coordinates Binding
    document.addEventListener('mousemove', (e) => {
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    });
    
    // 3. Network Particles Initialization (using particles.js cdn dependency)
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            "particles": {
                "number": { 
                    "value": 35, 
                    "density": { "enable": true, "value_area": 800 } 
                },
                "color": { "value": "#3b82f6" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.12, "random": false },
                "size": { "value": 2.5, "random": true },
                "line_linked": { 
                    "enable": true, 
                    "distance": 140, 
                    "color": "#3b82f6", 
                    "opacity": 0.08, 
                    "width": 1 
                },
                "move": { 
                    "enable": true, 
                    "speed": 1.0, 
                    "direction": "none", 
                    "random": false, 
                    "straight": false, 
                    "out_mode": "out", 
                    "bounce": false 
                }
            },
            "interactivity": {
                "detect_on": "window",
                "events": { 
                    "onhover": { "enable": true, "mode": "grab" }, 
                    "onclick": { "enable": false } 
                },
                "modes": { 
                    "grab": { 
                        "distance": 160, 
                        "line_linked": { "opacity": 0.2 } 
                    } 
                }
            },
            "retina_detect": true
        });
    }

    // 4. Performance Toggle Button Logic
    // Create floating control button automatically if it doesn't exist
    let perfBtn = document.getElementById('btn-performance-toggle');
    if (!perfBtn) {
        perfBtn = document.createElement('button');
        perfBtn.id = 'btn-performance-toggle';
        perfBtn.className = 'btn';
        perfBtn.style.position = 'fixed';
        perfBtn.style.bottom = '20px';
        perfBtn.style.right = '20px';
        perfBtn.style.zIndex = '999';
        perfBtn.style.padding = '0.5rem 0.85rem';
        perfBtn.style.borderRadius = '20px';
        perfBtn.style.fontSize = '0.75rem';
        perfBtn.style.display = 'flex';
        perfBtn.style.alignItems = 'center';
        perfBtn.style.gap = '6px';
        perfBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
        perfBtn.style.border = '1px solid var(--border-color)';
        perfBtn.style.background = 'rgba(15, 23, 42, 0.7)';
        perfBtn.style.backdropFilter = 'blur(12px)';
        perfBtn.style.color = 'var(--text-primary)';
        perfBtn.style.cursor = 'pointer';
        perfBtn.style.transition = 'all 0.3s ease';
        perfBtn.title = "Bật/Tắt hiệu ứng nền để tiết kiệm pin & CPU";
        document.body.appendChild(perfBtn);
    }

    let effectsEnabled = localStorage.getItem('effects_enabled') !== 'false';
    
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && localStorage.getItem('effects_enabled') === null) {
        effectsEnabled = false; // Disable heavy effects by default on mobile
        localStorage.setItem('effects_enabled', 'false');
    }

    const updateEffectsState = () => {
        const particlesContainer = document.getElementById('particles-js');
        const gridBg = document.querySelector('.grid-bg');
        const mouseGlow = document.querySelector('.mouse-glow');
        
        if (effectsEnabled) {
            if (particlesContainer) particlesContainer.style.opacity = '1';
            if (gridBg) gridBg.classList.remove('disable-scan');
            if (mouseGlow) mouseGlow.style.opacity = '1';
            perfBtn.innerHTML = '<i class="fa-solid fa-gauge-high" style="color: #34d399;"></i> <span>Hiệu ứng: Bật</span>';
        } else {
            if (particlesContainer) particlesContainer.style.opacity = '0';
            if (gridBg) gridBg.classList.add('disable-scan');
            if (mouseGlow) mouseGlow.style.opacity = '0';
            perfBtn.innerHTML = '<i class="fa-solid fa-bolt" style="color: #f43f5e;"></i> <span>Hiệu ứng: Tắt</span>';
        }
    };

    updateEffectsState();

    perfBtn.addEventListener('click', () => {
        effectsEnabled = !effectsEnabled;
        localStorage.setItem('effects_enabled', effectsEnabled ? 'true' : 'false');
        updateEffectsState();
        window.showToast(effectsEnabled ? 'Đã bật hiệu ứng đồ họa!' : 'Đã tắt các hiệu ứng để tiết kiệm hiệu năng.', effectsEnabled ? 'success' : 'warning');
    });

    // 5. Theme Toggle Button Logic (Dark/Light Mode)
    let themeBtn = document.getElementById('btn-theme-toggle');
    if (!themeBtn) {
        themeBtn = document.createElement('button');
        themeBtn.id = 'btn-theme-toggle';
        themeBtn.className = 'btn';
        themeBtn.style.position = 'fixed';
        themeBtn.style.bottom = '20px';
        themeBtn.style.right = '150px'; // Positioned next to performance toggle
        themeBtn.style.zIndex = '999';
        themeBtn.style.padding = '0.5rem 0.85rem';
        themeBtn.style.borderRadius = '20px';
        themeBtn.style.fontSize = '0.75rem';
        themeBtn.style.display = 'flex';
        themeBtn.style.alignItems = 'center';
        themeBtn.style.gap = '6px';
        themeBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
        themeBtn.style.border = '1px solid var(--border-color)';
        themeBtn.style.background = 'rgba(15, 23, 42, 0.7)';
        themeBtn.style.backdropFilter = 'blur(12px)';
        themeBtn.style.color = 'var(--text-primary)';
        themeBtn.style.cursor = 'pointer';
        themeBtn.style.transition = 'all 0.3s ease';
        themeBtn.title = "Bật/Tắt Giao diện Tối/Sáng";
        document.body.appendChild(themeBtn);
    }

    let currentTheme = localStorage.getItem('theme') || 'dark';

    const applyTheme = () => {
        if (currentTheme === 'light') {
            document.body.classList.add('light-theme');
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i> <span>Giao diện: Sáng</span>';
            themeBtn.style.background = 'rgba(255, 255, 255, 0.9)';
            themeBtn.style.borderColor = 'rgba(79, 70, 229, 0.15)';
            themeBtn.style.color = '#0f172a';
        } else {
            document.body.classList.remove('light-theme');
            themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i> <span>Giao diện: Tối</span>';
            themeBtn.style.background = 'rgba(15, 23, 42, 0.7)';
            themeBtn.style.borderColor = 'rgba(255, 255, 255, 0.05)';
            themeBtn.style.color = '#f8fafc';
        }
    };

    applyTheme();

    themeBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        applyTheme();
        window.showToast(currentTheme === 'light' ? 'Đã chuyển sang Giao diện Sáng (Fintech Light)!' : 'Đã chuyển sang Giao diện Tối (Cyber Dark)!', 'success');
    });
});
