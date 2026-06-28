// SafeMoney Campus - Client-side Simulation Engine & UI Controller

// ========================================================================= 
// 1. LOCALSTORAGE DATABASE SIMULATION
// ========================================================================= 
const DB = {
    getUsers: () => JSON.parse(localStorage.getItem('sm_users')) || [],
    saveUsers: (users) => localStorage.setItem('sm_users', JSON.stringify(users)),
    getCurrentUser: () => JSON.parse(localStorage.getItem('sm_current_user')) || null,
    setCurrentUser: (user) => localStorage.setItem('sm_current_user', JSON.stringify(user)),
    getSessionAccounts: () => JSON.parse(localStorage.getItem('sm_session_accounts')) || [],
    saveSessionAccounts: (accs) => localStorage.setItem('sm_session_accounts', JSON.stringify(accs))
};

// Seed default supervisor parent account if DB is fresh
if (DB.getUsers().length === 0) {
    const parentAcc = {
        id: 99,
        email: "phuhuynh@campus.edu.vn",
        fullname: "Phụ Huynh Giám Sát (Parent)",
        password: "123",
        fomo: 20,
        impulsiveness: 15,
        authority: 30,
        dfss: 78,
        coins: 500,
        isProfileCompleted: true,
        scans: []
    };
    DB.saveUsers([parentAcc]);
}

// ========================================================================= 
// 2. CLIENT-SIDE ROUTE GUARD
// ========================================================================= 
const path = window.location.pathname.split('/').pop() || 'index.html';
const currentUser = DB.getCurrentUser();

if (path === 'dashboard.html' || path === 'onboarding.html') {
    if (!currentUser) {
        window.location.href = 'login.html';
    }
}
if (currentUser) {
    if (path === 'onboarding.html' && currentUser.isProfileCompleted) {
        window.location.href = 'dashboard.html';
    }
    if (path === 'dashboard.html' && !currentUser.isProfileCompleted) {
        window.location.href = 'onboarding.html';
    }
}
if (path === 'login.html' && currentUser) {
    window.location.href = currentUser.isProfileCompleted ? 'dashboard.html' : 'onboarding.html';
}

// ========================================================================= 
// 3. TOAST NOTIFICATION UTILITIES
// ========================================================================= 
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
    setTimeout(() => toast.classList.add('active'), 50);
    
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
};

// ========================================================================= 
// 4. AMBIENCE EFFECTS CONTROL
// ========================================================================= 
document.addEventListener('DOMContentLoaded', () => {
    // Spotlight Glow Binding
    document.addEventListener('mousemove', (e) => {
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    });

    // Particles.js Initialization
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            "particles": {
                "number": { "value": 30, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#4f46e5" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.1, "random": false },
                "size": { "value": 2.5, "random": true },
                "line_linked": { "enable": true, "distance": 140, "color": "#4f46e5", "opacity": 0.08, "width": 1 },
                "move": { "enable": true, "speed": 0.8, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
            },
            "interactivity": {
                "detect_on": "window",
                "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": false } },
                "modes": { "grab": { "distance": 160, "line_linked": { "opacity": 0.2 } } }
            },
            "retina_detect": true
        });
    }

    // Performance Toggle Button injection
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
        perfBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
        perfBtn.style.border = '1px solid var(--border-color)';
        perfBtn.style.background = 'var(--bg-card)';
        perfBtn.style.backdropFilter = 'blur(12px)';
        perfBtn.style.color = 'var(--text-primary)';
        perfBtn.style.cursor = 'pointer';
        perfBtn.title = "Bật/Tắt hiệu ứng nền";
        document.body.appendChild(perfBtn);
    }

    let effectsEnabled = localStorage.getItem('effects_enabled') !== 'false';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile && localStorage.getItem('effects_enabled') === null) {
        effectsEnabled = false;
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
            perfBtn.innerHTML = '<i class="fa-solid fa-gauge-high" style="color: var(--color-safe);"></i> <span>Hiệu ứng: Bật</span>';
        } else {
            if (particlesContainer) particlesContainer.style.opacity = '0';
            if (gridBg) gridBg.classList.add('disable-scan');
            if (mouseGlow) mouseGlow.style.opacity = '0';
            perfBtn.innerHTML = '<i class="fa-solid fa-bolt" style="color: var(--color-danger);"></i> <span>Hiệu ứng: Tắt</span>';
        }
    };
    updateEffectsState();

    perfBtn.addEventListener('click', () => {
        effectsEnabled = !effectsEnabled;
        localStorage.setItem('effects_enabled', effectsEnabled ? 'true' : 'false');
        updateEffectsState();
        window.showToast(effectsEnabled ? 'Đã bật hiệu ứng đồ họa!' : 'Đã tắt hiệu ứng tiết kiệm pin.', effectsEnabled ? 'success' : 'warning');
    });

    // Theme Toggle Button injection
    let themeBtn = document.getElementById('btn-theme-toggle');
    if (!themeBtn) {
        themeBtn = document.createElement('button');
        themeBtn.id = 'btn-theme-toggle';
        themeBtn.className = 'btn';
        themeBtn.style.position = 'fixed';
        themeBtn.style.bottom = '20px';
        themeBtn.style.right = '150px';
        themeBtn.style.zIndex = '999';
        themeBtn.style.padding = '0.5rem 0.85rem';
        themeBtn.style.borderRadius = '20px';
        themeBtn.style.fontSize = '0.75rem';
        themeBtn.style.display = 'flex';
        themeBtn.style.alignItems = 'center';
        themeBtn.style.gap = '6px';
        themeBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
        themeBtn.style.border = '1px solid var(--border-color)';
        themeBtn.style.background = 'var(--bg-card)';
        themeBtn.style.backdropFilter = 'blur(12px)';
        themeBtn.style.color = 'var(--text-primary)';
        themeBtn.style.cursor = 'pointer';
        themeBtn.title = "Bật/Tắt Giao diện Tối/Sáng";
        document.body.appendChild(themeBtn);
    }

    let currentTheme = localStorage.getItem('theme') || 'dark';
    const applyTheme = () => {
        if (currentTheme === 'light') {
            document.body.classList.add('light-theme');
            themeBtn.innerHTML = '<i class="fa-solid fa-moon"></i> <span>Giao diện: Sáng</span>';
        } else {
            document.body.classList.remove('light-theme');
            themeBtn.innerHTML = '<i class="fa-solid fa-sun"></i> <span>Giao diện: Tối</span>';
        }
    };
    applyTheme();

    themeBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        applyTheme();
        window.showToast(currentTheme === 'light' ? 'Đã chuyển sang Giao diện Sáng (Fintech Light)!' : 'Đã chuyển sang Giao diện Tối (Cyber Dark)!', 'success');
        if (typeof updatePassportRadar === 'function' && currentUser) {
            updatePassportRadar(currentUser.fomo, currentUser.impulsiveness, currentUser.authority);
        }
    });
});

// ========================================================================= 
// 5. AUTHENTICATION MODULE (login.html & reset-password.html)
// ========================================================================= 
if (path === 'login.html') {
    document.addEventListener('DOMContentLoaded', () => {
        const tabLogin = document.getElementById('tab-btn-login');
        const tabRegister = document.getElementById('tab-btn-register');
        const formLogin = document.getElementById('form-login');
        const formRegister = document.getElementById('form-register');
        const formForgot = document.getElementById('form-forgot-pw');
        const linkForgot = document.getElementById('link-forgot-pw');
        const btnForgotBack = document.getElementById('btn-forgot-back');
        const alertBox = document.getElementById('auth-alert');

        const showAlert = (msg, isSuccess = false) => {
            alertBox.textContent = msg;
            alertBox.style.display = 'block';
            if (isSuccess) {
                alertBox.style.background = 'rgba(16, 185, 129, 0.1)';
                alertBox.style.color = '#34d399';
                alertBox.style.borderColor = 'rgba(16, 185, 129, 0.2)';
            } else {
                alertBox.style.background = 'rgba(239, 68, 68, 0.1)';
                alertBox.style.color = '#f87171';
                alertBox.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            }
        };
        const hideAlert = () => alertBox.style.display = 'none';

        const switchToLogin = () => {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            formLogin.classList.add('active');
            formRegister.classList.remove('active');
            formForgot.classList.remove('active');
            hideAlert();
        };
        const switchToRegister = () => {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            formRegister.classList.add('active');
            formLogin.classList.remove('active');
            formForgot.classList.remove('active');
            hideAlert();
        };

        // URL Tab check
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('tab') === 'register') {
            switchToRegister();
        }

        tabLogin.addEventListener('click', switchToLogin);
        tabRegister.addEventListener('click', switchToRegister);

        // Register Action
        formRegister.addEventListener('submit', (e) => {
            e.preventDefault();
            hideAlert();
            const fullname = document.getElementById('reg-fullname').value.trim();
            const email = document.getElementById('reg-username').value.trim();
            const password = document.getElementById('reg-pass').value;

            const users = DB.getUsers();
            if (users.find(u => u.email === email)) {
                showAlert('Email này đã được đăng ký!');
                return;
            }

            const newUser = {
                id: Date.now(),
                email,
                fullname,
                password,
                fomo: 50,
                impulsiveness: 50,
                authority: 50,
                dfss: 50,
                coins: 100,
                isProfileCompleted: false,
                scans: []
            };

            users.push(newUser);
            DB.saveUsers(users);

            window.showToast('Đăng ký thành công! Hãy đăng nhập.', 'success');
            switchToLogin();
            document.getElementById('login-username').value = email;
            document.getElementById('login-pass').focus();
        });

        // Login Action
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            hideAlert();
            const email = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-pass').value;

            const users = DB.getUsers();
            const user = users.find(u => u.email === email && u.password === password);

            if (!user) {
                showAlert('Tài khoản hoặc mật khẩu không chính xác!');
                return;
            }

            // Save session
            DB.setCurrentUser(user);

            // Add to switcher list
            const accs = DB.getSessionAccounts();
            if (!accs.find(a => a.email === user.email)) {
                accs.push({ id: user.id, email: user.email, fullname: user.fullname });
                DB.saveSessionAccounts(accs);
            }

            window.showToast('Đăng nhập thành công!', 'success');
            setTimeout(() => {
                window.location.href = user.isProfileCompleted ? 'dashboard.html' : 'onboarding.html';
            }, 1000);
        });

        // Forgot Password Action
        linkForgot.addEventListener('click', (e) => {
            e.preventDefault();
            formLogin.classList.remove('active');
            formRegister.classList.remove('active');
            formForgot.classList.add('active');
            hideAlert();
        });
        btnForgotBack.addEventListener('click', switchToLogin);

        formForgot.addEventListener('submit', (e) => {
            e.preventDefault();
            hideAlert();
            const email = document.getElementById('forgot-email').value.trim();
            const users = DB.getUsers();
            const user = users.find(u => u.email === email);

            if (!user) {
                showAlert('Yêu cầu khôi phục đã gửi (Nếu Email tồn tại)!', true);
                return;
            }

            const token = Math.random().toString(36).substring(2, 15);
            user.reset_token = token;
            user.reset_token_expires = Date.now() + 15 * 60 * 1000;
            DB.saveUsers(users);

            const resetLink = `${window.location.origin}${window.location.pathname.replace('login.html', 'reset-password.html')}?token=${token}`;
            console.log(`[MOCK EMAIL] Link reset: ${resetLink}`);

            const proceed = confirm(`DÀNH CHO BẢN DÙNG THỬ (PROTOTYPE):\nHệ thống giả định đã gửi email đặt lại mật khẩu thành công.\n\nBạn có muốn chuyển hướng sang trang đặt lại mật khẩu ngay bây giờ không?`);
            if (proceed) {
                window.location.href = resetLink;
            } else {
                switchToLogin();
            }
        });
    });
}

// ========================================================================= 
// 6. PASSWORD RESET MODULE (reset-password.html)
// ========================================================================= 
if (path === 'reset-password.html') {
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('form-reset-pw');
        const alertBox = document.getElementById('auth-alert');
        
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        const showAlert = (msg, isSuccess = false) => {
            alertBox.textContent = msg;
            alertBox.style.display = 'block';
            if (isSuccess) {
                alertBox.style.background = 'rgba(16, 185, 129, 0.1)';
                alertBox.style.color = '#34d399';
                alertBox.style.borderColor = 'rgba(16, 185, 129, 0.2)';
            } else {
                alertBox.style.background = 'rgba(239, 68, 68, 0.1)';
                alertBox.style.color = '#f87171';
                alertBox.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            }
        };

        if (!token) {
            showAlert('Lỗi: Thiếu Token đặt lại mật khẩu!');
            form.style.opacity = '0.5';
            form.querySelectorAll('input, button').forEach(e => e.disabled = true);
            return;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('new-pass').value;
            const confirmPass = document.getElementById('confirm-pass').value;

            if (password !== confirmPass) {
                showAlert('Mật khẩu xác nhận không trùng khớp!');
                return;
            }

            const users = DB.getUsers();
            const user = users.find(u => u.reset_token === token && u.reset_token_expires > Date.now());

            if (!user) {
                showAlert('Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!');
                return;
            }

            // Save new password
            user.password = password;
            delete user.reset_token;
            delete user.reset_token_expires;
            DB.saveUsers(users);

            showAlert('Đặt lại mật khẩu thành công! Trở lại trang đăng nhập sau giây lát...', true);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        });
    });
}

// ========================================================================= 
// 7. ONBOARDING QUIZ MODULE (onboarding.html)
// ========================================================================= 
if (path === 'onboarding.html') {
    const quizQuestions = [
        {
            title: "1. Bạn nhận được tin nhắn SMS thông báo Voucher mua sắm trị giá 50 triệu từ Shopee Campus sắp hết hạn chỉ trong 3 phút nữa. Bạn sẽ:",
            answers: [
                { text: "A. Bấm ngay vào đường link để không bỏ lỡ quà tặng giá trị này.", fomo: 90, imp: 80, aut: 20 },
                { text: "B. Tò mò, do dự một lúc xem có nên nhấp vào xem thử hay không.", fomo: 60, imp: 50, aut: 15 },
                { text: "C. Xóa tin nhắn hoặc vào thẳng ứng dụng Shopee chính thống để xác minh.", fomo: 10, imp: 10, aut: 10 }
            ]
        },
        {
            title: "2. Có biến động số dư trừ 500k lạ trong tài khoản, kèm tin nhắn SMS hướng dẫn click link này để gửi khiếu nại đòi lại tiền khẩn cấp.",
            answers: [
                { text: "A. Bấm link và nhập ngay tài khoản mật khẩu ngân hàng để đòi tiền gấp.", fomo: 20, imp: 95, aut: 40 },
                { text: "B. Lo lắng nhưng sẽ tìm hotline chính thức của ngân hàng để gọi xác nhận.", fomo: 10, imp: 40, aut: 20 },
                { text: "C. Bình tĩnh mở app ngân hàng tự tra cứu sao kê hoặc ra quầy giao dịch.", fomo: 10, imp: 10, aut: 10 }
            ]
        },
        {
            title: "3. Một người gọi điện tự xưng là Điều tra viên Bộ Công An nói số điện thoại của bạn dính vụ án rửa tiền, ép chuyển tiền bảo chứng điều tra.",
            answers: [
                { text: "A. Hoảng sợ và chuẩn bị chuyển khoản theo hướng dẫn để chứng minh vô tội.", fomo: 10, imp: 55, aut: 95 },
                { text: "B. Nghi ngờ lo sợ, tìm cách thương lượng hoặc hỏi ý kiến người thân trước.", fomo: 10, imp: 30, aut: 50 },
                { text: "C. Biết chắc là lừa đảo giả mạo, cúp máy ngay lập tức và báo cáo số điện thoại.", fomo: 10, imp: 10, aut: 10 }
            ]
        }
    ];

    let currentQuestionIndex = 0;
    let answersChosen = [];

    document.addEventListener('DOMContentLoaded', () => {
        const questionTitle = document.getElementById('quiz-question-title');
        const answersContainer = document.getElementById('quiz-answers');
        const progressText = document.getElementById('quiz-progress');
        const progressBar = document.getElementById('quiz-progress-bar');
        const backBtn = document.getElementById('btn-quiz-back');
        const submitBtn = document.getElementById('btn-quiz-submit');
        const quizContainer = document.getElementById('quiz-container');
        const resultPanel = document.getElementById('quiz-result');

        const loadQuestion = () => {
            const q = quizQuestions[currentQuestionIndex];
            progressText.textContent = `Câu hỏi ${currentQuestionIndex + 1} / 3`;
            progressBar.style.width = `${((currentQuestionIndex + 1) / 3) * 100}%`;
            questionTitle.textContent = q.title;
            
            answersContainer.innerHTML = '';
            q.answers.forEach((ans) => {
                const btn = document.createElement('button');
                btn.className = 'preset-row';
                btn.style.width = '100%';
                btn.style.textAlign = 'left';
                btn.style.padding = '1rem 1.25rem';
                btn.innerHTML = `<span style="font-weight: 500;">${ans.text}</span>`;
                
                btn.addEventListener('click', () => {
                    answersChosen[currentQuestionIndex] = ans;
                    if (currentQuestionIndex < 2) {
                        currentQuestionIndex++;
                        loadQuestion();
                    } else {
                        displayQuizResults();
                    }
                });
                answersContainer.appendChild(btn);
            });

            backBtn.style.display = currentQuestionIndex > 0 ? 'inline-flex' : 'none';
        };

        backBtn.addEventListener('click', () => {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                loadQuestion();
            }
        });

        const displayQuizResults = () => {
            quizContainer.style.display = 'none';
            resultPanel.style.display = 'block';

            const fomoVal = answersChosen[0].fomo;
            const impVal = answersChosen[1].imp;
            const autVal = answersChosen[2].aut;

            document.getElementById('result-fomo').textContent = fomoVal + '%';
            document.getElementById('result-imp').textContent = impVal + '%';
            document.getElementById('result-aut').textContent = autVal + '%';
        };

        submitBtn.addEventListener('click', () => {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tính toán...';

            const fomo = answersChosen[0].fomo;
            const impulsiveness = answersChosen[1].imp;
            const authority = answersChosen[2].aut;
            const dfss = Math.round(100 - (fomo + impulsiveness + authority) / 3);

            // Update current user
            currentUser.fomo = fomo;
            currentUser.impulsiveness = impulsiveness;
            currentUser.authority = authority;
            currentUser.dfss = dfss;
            currentUser.coins += 50;
            currentUser.isProfileCompleted = true;

            // Save in DB list
            const users = DB.getUsers();
            const dbIndex = users.findIndex(u => u.email === currentUser.email);
            if (dbIndex !== -1) {
                users[dbIndex] = currentUser;
                DB.saveUsers(users);
            }
            DB.setCurrentUser(currentUser);

            window.showToast('Hồ sơ Hộ chiếu FBP của bạn đã được khởi tạo! +50 CC.', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1200);
        });

        loadQuestion();
    });
}

// ========================================================================= 
// 8. DASHBOARD & SIMULATOR CONSOLE (dashboard.html)
// ========================================================================= 
if (path === 'dashboard.html') {
    const appState = {
        currentUser: null,
        selectedPresetScore: 0,
        selectedPresetTarget: 'fomo', // fomo, authority, impulsiveness
        countdownTimer: null,
        timeRemaining: 30
    };

    // Load state
    appState.currentUser = DB.getCurrentUser();

    // Radar math coordinator
    window.updatePassportRadar = function(fomo, imp, aut) {
        const center = 60;
        const radius = 40;
        
        // Coordinates calculations
        // Angle 1: Top (FOMO)
        const x1 = center;
        const y1 = center - radius * (fomo / 100);
        
        // Angle 2: Bottom-Right (Impulsiveness)
        const x2 = center + radius * (imp / 100) * 0.866;
        const y2 = center + radius * (imp / 100) * 0.5;
        
        // Angle 3: Bottom-Left (Authority Sensitivity)
        const x3 = center - radius * (aut / 100) * 0.866;
        const y3 = center + radius * (aut / 100) * 0.5;
        
        const poly = document.getElementById('radar-poly');
        if (poly) {
            poly.setAttribute('points', `${x1},${y1} ${x2},${y2} ${x3},${y3}`);
        }
    };

    const updatePassportUI = () => {
        const u = appState.currentUser;
        document.getElementById('lbl-fullname').textContent = u.fullname;
        document.getElementById('lbl-email').textContent = u.email;
        
        let classification = 'THẬN TRỌNG (GUARD)';
        if (u.dfss < 45) classification = 'DỄ TỔN THƯƠNG (RISK)';
        else if (u.dfss < 75) classification = 'CẢNH GIÁC (ALERT)';
        
        document.getElementById('lbl-classification').textContent = classification;
        document.getElementById('lbl-fomo-val').textContent = u.fomo + '%';
        document.getElementById('lbl-imp-val').textContent = u.impulsiveness + '%';
        document.getElementById('lbl-aut-val').textContent = u.authority + '%';

        updatePassportRadar(u.fomo, u.impulsiveness, u.authority);
    };

    const updateGauges = () => {
        const score = appState.currentUser.dfss;
        
        // Circle stroke math
        const fill = document.getElementById('dfss-fill');
        if (fill) {
            const offset = 440 - (440 * score) / 100;
            fill.style.strokeDashoffset = offset;
            
            // Shifting color donut
            if (score < 45) {
                fill.style.stroke = 'var(--color-danger)';
            } else if (score < 75) {
                fill.style.stroke = 'var(--color-warning)';
            } else {
                fill.style.stroke = 'var(--color-safe)';
            }
        }
        
        const txtValue = document.getElementById('dfss-text-val');
        if (txtValue) txtValue.textContent = score;

        let verdict = 'BẢO VỆ TỐT (SAFE GUARD)';
        let desc = 'Tài khoản có thói quen đối chứng thông tin tốt, ít bị kích động bởi các đe dọa khẩn cấp.';
        
        if (score < 45) {
            verdict = 'RỦI RO CAO (HIGH RISK)';
            desc = 'Bạn rất dễ bị thao túng bởi áp lực uy quyền ảo hoặc quà tặng giới hạn thời gian.';
        } else if (score < 75) {
            verdict = 'CẦN CẢNH GIÁC (MEDIUM RISK)';
            desc = 'Bạn thỉnh thoảng đưa ra quyết định vội vã khi lo âu. Hãy chú ý tự vấn nhiều hơn.';
        }

        const ratingLbl = document.getElementById('lbl-score-rating');
        if (ratingLbl) ratingLbl.textContent = verdict;
        
        const descLbl = document.getElementById('lbl-score-desc');
        if (descLbl) descLbl.textContent = desc;
    };

    const updateHeaderStats = () => {
        const u = appState.currentUser;
        document.getElementById('header-coins').textContent = u.coins + ' CC';
        document.getElementById('header-dfss').textContent = u.dfss + '/100 DFSS';
        document.getElementById('dashboard-coins-val').textContent = u.coins + ' CC';
    };

    const updateScansHistory = () => {
        const tableBody = document.getElementById('scans-history-body');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        const scans = appState.currentUser.scans || [];
        
        if (scans.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Chưa quét kịch bản lừa đảo nào.</td></tr>';
            return;
        }

        scans.forEach(s => {
            const tr = document.createElement('tr');
            
            let statusBadge = `<span style="color: var(--color-safe); font-weight: 700;">✓ ĐÃ HỦY (ABORT)</span>`;
            if (s.status === 'continued') {
                statusBadge = `<span style="color: var(--color-danger); font-weight: 700;">✗ TIẾP TỤC (FAILED)</span>`;
            }
            
            tr.innerHTML = `
                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.message}</td>
                <td style="color: var(--color-danger); font-weight: 700;">${s.drs}/100</td>
                <td>${statusBadge}</td>
                <td style="color: var(--text-muted);">${s.time}</td>
            `;
            tableBody.appendChild(tr);
        });
    };

    const updateLedgerTasks = () => {
        // Task 1: profile
        const l1 = document.getElementById('ledger-task-1');
        if (appState.currentUser.isProfileCompleted && l1) {
            l1.classList.add('completed');
            l1.querySelector('.coin-plus').innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã nhận';
        }
        
        // Task 2: first scan
        const l2 = document.getElementById('ledger-task-2');
        const hasScanned = appState.currentUser.scans && appState.currentUser.scans.length > 0;
        if (hasScanned && l2) {
            l2.classList.add('completed');
            l2.querySelector('.coin-plus').innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã nhận';
        }

        // Task 3: abort count
        const l3 = document.getElementById('ledger-task-3');
        const hasAborted = appState.currentUser.scans && appState.currentUser.scans.some(s => s.status === 'aborted');
        if (hasAborted && l3) {
            l3.classList.add('completed');
            l3.querySelector('.coin-plus').innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã nhận';
        }
    };

    const saveStateToDB = () => {
        const users = DB.getUsers();
        const idx = users.findIndex(u => u.email === appState.currentUser.email);
        if (idx !== -1) {
            users[idx] = appState.currentUser;
            DB.saveUsers(users);
        }
        DB.setCurrentUser(appState.currentUser);
    };

    const triggerSafetyPauseModal = () => {
        const modal = document.getElementById('safety-pause-modal');
        const timerText = document.getElementById('timer-text');
        const timerFill = document.getElementById('timer-ring-fill');
        const continueBtn = document.getElementById('btn-pause-continue');
        
        appState.timeRemaining = 30;
        timerText.textContent = 30;
        timerText.classList.remove('pulse');
        timerFill.classList.remove('warning');
        timerFill.style.strokeDashoffset = 0;
        
        continueBtn.disabled = true;
        continueBtn.querySelector('span').textContent = "Tiếp tục giao dịch (Bị khóa)";
        
        modal.classList.add('active');

        // Dynamic self-reflection question mapping
        const questions = [
            "Tại sao họ lại ép buộc bạn phải thực hiện giao dịch khẩn cấp này mà không cho phép bạn kiểm tra chéo độc lập?",
            "Nếu đây thực sự là Công an hoặc cơ quan thuế, tại sao họ lại yêu cầu bạn chuyển khoản vào tài khoản cá nhân thay vì làm việc trực tiếp tại trụ sở?",
            "Voucher trúng thưởng 50 triệu này có yêu cầu bạn phải nộp một khoản phí tạm ứng nào trước không? Tại sao bạn lại nhận được nó khi không tham gia chương trình nào?",
            "Hãy dừng lại 10 giây, hít thở sâu và gọi điện cho bố mẹ hoặc hotline chính thức để đối chứng thông tin này."
        ];
        document.getElementById('pause-question').textContent = questions[Math.floor(Math.random() * questions.length)];

        // Countdown intervals
        clearInterval(appState.countdownTimer);
        appState.countdownTimer = setInterval(() => {
            appState.timeRemaining--;
            timerText.textContent = appState.timeRemaining;
            
            const offset = 283 - (283 * appState.timeRemaining) / 30;
            timerFill.style.strokeDashoffset = offset;
            
            if (appState.timeRemaining <= 10) {
                timerText.classList.add('pulse');
                timerFill.classList.add('warning');
            }
            
            if (appState.timeRemaining <= 0) {
                clearInterval(appState.countdownTimer);
                continueBtn.disabled = false;
                continueBtn.querySelector('span').textContent = "Tiếp tục giao dịch";
            }
        }, 1000);
    };

    // Initialize View binds
    document.addEventListener('DOMContentLoaded', () => {
        // Tab routing binds
        const tabDashboard = document.getElementById('tab-btn-dashboard');
        const tabSimulator = document.getElementById('tab-btn-simulator');
        const panelDashboard = document.getElementById('panel-dashboard');
        const panelSimulator = document.getElementById('panel-simulator');
        
        tabDashboard.addEventListener('click', () => {
            tabDashboard.classList.add('active');
            tabSimulator.classList.remove('active');
            panelDashboard.classList.add('active');
            panelSimulator.classList.remove('active');
        });
        
        tabSimulator.addEventListener('click', () => {
            tabSimulator.classList.add('active');
            tabDashboard.classList.remove('active');
            panelSimulator.classList.add('active');
            panelDashboard.classList.remove('active');
        });

        // Initialize header profile switch binds
        const switcherBtn = document.getElementById('btn-header-switcher');
        const dropdownPanel = document.getElementById('accounts-dropdown');
        
        switcherBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownPanel.classList.toggle('active');
        });
        
        document.addEventListener('click', () => dropdownPanel.classList.remove('active'));

        // Render accounts list
        const renderAccounts = () => {
            const switcherList = document.getElementById('accounts-list-container');
            switcherList.innerHTML = '';
            const accs = DB.getSessionAccounts();
            
            accs.forEach(acc => {
                const btn = document.createElement('button');
                btn.className = 'account-item-btn';
                if (acc.email === appState.currentUser.email) {
                    btn.classList.add('active');
                }
                btn.innerHTML = `
                    <span>${acc.fullname}</span>
                    ${acc.email === appState.currentUser.email ? '<i class="fa-solid fa-circle-check"></i>' : ''}
                `;
                btn.addEventListener('click', () => {
                    if (acc.email === appState.currentUser.email) return;
                    
                    const users = DB.getUsers();
                    const targetUser = users.find(u => u.email === acc.email);
                    if (targetUser) {
                        DB.setCurrentUser(targetUser);
                        window.showToast(`Đã chuyển đổi sang tài khoản: ${targetUser.fullname}`, 'success');
                        setTimeout(() => window.location.reload(), 800);
                    }
                });
                switcherList.appendChild(btn);
            });
        };
        renderAccounts();

        // Logout bindings
        const handleLogout = () => {
            // Remove from switcher list
            const accs = DB.getSessionAccounts().filter(a => a.email !== appState.currentUser.email);
            DB.saveSessionAccounts(accs);
            
            localStorage.removeItem('sm_current_user');
            window.showToast('Đã đăng xuất thành công!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        };
        document.getElementById('logout-btn-header').addEventListener('click', handleLogout);
        document.getElementById('btn-logout-direct').addEventListener('click', handleLogout);

        // Preset Scan Selectors Binds
        const scanTextInput = document.getElementById('text-input');
        const scanBtn = document.getElementById('btn-start-scan');
        const placeholderView = document.getElementById('placeholder-view');
        const progressView = document.getElementById('progress-view');
        const resultView = document.getElementById('result-view');
        const innerProgress = document.getElementById('inner-bar');
        
        const logs = [
            document.getElementById('log-step-1'),
            document.getElementById('log-step-2'),
            document.getElementById('log-step-3')
        ];

        document.querySelectorAll('.preset-row').forEach(row => {
            row.addEventListener('click', () => {
                const text = row.querySelector('.preset-text').textContent;
                const score = parseInt(row.getAttribute('data-score'));
                const target = row.getAttribute('data-target');
                
                scanTextInput.value = text;
                appState.selectedPresetScore = score;
                appState.selectedPresetTarget = target;
            });
        });

        scanBtn.addEventListener('click', () => {
            const text = scanTextInput.value.trim();
            if (!text) {
                window.showToast('Vui lòng chọn một kịch bản hoặc nhập nội dung đáng ngờ!', 'warning');
                return;
            }

            // If user typed custom text, calculate impulsiveness DRS
            if (!appState.selectedPresetScore) {
                appState.selectedPresetScore = Math.floor(Math.random() * 40) + 60; // 60-100 DRS
                appState.selectedPresetTarget = 'impulsiveness';
            }

            // Start simulated progress bar animation
            placeholderView.style.display = 'none';
            resultView.style.display = 'none';
            progressView.style.display = 'block';
            innerProgress.style.width = '0%';
            
            logs.forEach(l => l.className = 'step-log-item');

            let progress = 0;
            const interval = setInterval(() => {
                progress += 5;
                innerProgress.style.width = `${progress}%`;
                
                if (progress === 30) {
                    logs[0].className = 'step-log-item active';
                } else if (progress === 40) {
                    logs[0].className = 'step-log-item done';
                    logs[1].className = 'step-log-item active';
                } else if (progress === 70) {
                    logs[1].className = 'step-log-item done';
                    logs[2].className = 'step-log-item active';
                }
                
                if (progress >= 100) {
                    clearInterval(interval);
                    logs[2].className = 'step-log-item done';
                    
                    // Render scan results
                    setTimeout(() => {
                        progressView.style.display = 'none';
                        resultView.style.display = 'block';
                        
                        const score = appState.selectedPresetScore;
                        document.getElementById('lbl-result-drs').textContent = `${score}/100`;
                        
                        let verdict = 'AN TOÀN (SAFE)';
                        let verdictDesc = 'Nội dung tin nhắn và đường dẫn chưa phát hiện dấu hiệu đe dọa hoặc lừa đảo khẩn cấp.';
                        let detailsColor = 'var(--color-safe)';
                        
                        if (score >= 70) {
                            verdict = 'RẤT NGUY HIỂM (HIGH RISK)';
                            verdictDesc = 'Hệ thống AI phát hiện kịch bản thao túng tâm lý khẩn cấp nhằm chiếm đoạt tài khoản!';
                            detailsColor = 'var(--color-danger)';
                            
                            // Pop Safety Pause modal overlay
                            setTimeout(triggerSafetyPauseModal, 800);
                        } else if (score >= 45) {
                            verdict = 'CẦN CHÚ Ý (WARNING)';
                            verdictDesc = 'Nội dung chứa liên kết không bảo mật hoặc khuyến mãi mập mờ.';
                            detailsColor = 'var(--color-warning)';
                        }
                        
                        document.getElementById('lbl-result-verdict').textContent = verdict;
                        document.getElementById('lbl-result-verdict').style.color = detailsColor;
                        document.getElementById('lbl-result-desc').textContent = verdictDesc;
                    }, 500);
                }
            }, 110); // 2.2 seconds total animation
        });

        // Safety Pause Modals buttons actions
        const abortBtn = document.getElementById('btn-pause-abort');
        const continueBtn = document.getElementById('btn-pause-continue');
        const modal = document.getElementById('safety-pause-modal');

        abortBtn.addEventListener('click', () => {
            clearInterval(appState.countdownTimer);
            modal.classList.remove('active');
            
            const message = scanTextInput.value.trim();
            const drs = appState.selectedPresetScore;
            
            // Adjust behavioral profile: user was cautious, decrease psychological trait
            const target = appState.selectedPresetTarget;
            if (target === 'fomo') appState.currentUser.fomo = Math.max(10, appState.currentUser.fomo - 8);
            else if (target === 'authority') appState.currentUser.authority = Math.max(10, appState.currentUser.authority - 8);
            else appState.currentUser.impulsiveness = Math.max(10, appState.currentUser.impulsiveness - 8);
            
            appState.currentUser.dfss = Math.round(100 - (appState.currentUser.fomo + appState.currentUser.impulsiveness + appState.currentUser.authority) / 3);
            appState.currentUser.coins += 30; // Thưởng coin
            
            // Append scan history
            appState.currentUser.scans = appState.currentUser.scans || [];
            appState.currentUser.scans.unshift({
                message: message,
                drs: drs,
                status: 'aborted',
                time: new Date().toLocaleString()
            });

            saveStateToDB();
            updatePassportUI();
            updateGauges();
            updateHeaderStats();
            updateScansHistory();
            updateLedgerTasks();
            
            window.showToast('Bạn đã hủy giao dịch kịp thời! Cộng thưởng +30 CC.', 'success');
            tabDashboard.click();
        });

        continueBtn.addEventListener('click', () => {
            clearInterval(appState.countdownTimer);
            modal.classList.remove('active');
            
            const message = scanTextInput.value.trim();
            const drs = appState.selectedPresetScore;
            
            // Adjust behavioral profile: user fell for it, increase targeted psychological trait
            const target = appState.selectedPresetTarget;
            if (target === 'fomo') appState.currentUser.fomo = Math.min(100, appState.currentUser.fomo + 12);
            else if (target === 'authority') appState.currentUser.authority = Math.min(100, appState.currentUser.authority + 12);
            else appState.currentUser.impulsiveness = Math.min(100, appState.currentUser.impulsiveness + 12);
            
            appState.currentUser.dfss = Math.round(100 - (appState.currentUser.fomo + appState.currentUser.impulsiveness + appState.currentUser.authority) / 3);
            
            // Append scan history
            appState.currentUser.scans = appState.currentUser.scans || [];
            appState.currentUser.scans.unshift({
                message: Message = message,
                drs: drs,
                status: 'continued',
                time: new Date().toLocaleString()
            });

            saveStateToDB();
            updatePassportUI();
            updateGauges();
            updateHeaderStats();
            updateScansHistory();
            updateLedgerTasks();
            
            window.showToast('Cảnh báo: Quyết định bỏ qua cảnh báo của bạn đã làm suy giảm Hộ chiếu DFSS!', 'error');
            tabDashboard.click();
        });

        // Initial paint
        updatePassportUI();
        updateGauges();
        updateHeaderStats();
        updateScansHistory();
        updateLedgerTasks();
    });
}
