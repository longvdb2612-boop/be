// SafeMoney Campus - Dynamic Client App Controller

let appState = {
    coins: 100,
    dfss: 60,
    fomo: 50,
    impulsiveness: 50,
    authority: 50,
    fullname: 'Đang tải...',
    selectedPresetScore: 85,
    timeRemaining: 30,
    countdownTimer: null
};

// Preset Scenarios Data Mapping
const presets = {
    'preset-1': {
        text: "[THÔNG BÁO TRÚNG THƯỞNG]: Chúc mừng thuê bao 098xxxxxxx đã nhận được Voucher mua sắm 50 triệu và 1 xe máy SH 150i từ chương trình tri ân khách hàng Shopee Campus. Click điền thông tin và nộp 1.5 triệu đồng phí trước bạ tại: https://shopee-campus-gift.xyz",
        score: 85
    },
    'preset-2': {
        text: "[BIDV KHẨN CẤP]: Tài khoản trực tuyến của bạn bị phát hiện đăng nhập bất thường tại IP 192.168.4.1 lúc 22:50. Hãy đăng nhập khẩn cấp tại: http://bidv-smart-login-check.online để thay đổi mật khẩu, nếu không tài khoản sẽ bị khóa vĩnh viễn.",
        score: 92
    },
    'preset-3': {
        text: "Học kỳ 2 năm học 2025-2026 chính thức bắt đầu. Sinh viên Đại học Bách Khoa vui lòng kiểm tra lịch đóng học phí và chuyển khoản đúng tài khoản đào tạo của nhà trường tại cổng thông tin sis.hust.edu.vn.",
        score: 15
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Initial fetch of user details from database
    fetchUserProfile();
    
    // UI controls setups
    initPresetSelectors();
    initScanAction();
    initSafetyPauseActions();
    initTabNavigation();
    initAccountSwitcher();
});

// 1. FETCH USER PROFILE DATA
async function fetchUserProfile() {
    try {
        const response = await fetch('/api/profile/get');
        if (response.status === 401) {
            // Unauthorized - Redirect to Login
            window.location.href = '/login';
            return;
        }
        
        const data = await response.json();
        
        // Sync state
        appState.coins = data.coins;
        appState.dfss = data.dfss;
        appState.fomo = data.fomo;
        appState.impulsiveness = data.impulsiveness;
        appState.authority = data.authority;
        appState.fullname = data.fullname;
        
        // Update header & passport DOM
        updateHeaderStats();
        updatePassportUI();
        updateLedgerUI(data.is_completed);
        
        // Populate switch accounts list
        renderAccountsDropdown(data.active_accounts);

    } catch (err) {
        console.error('Không thể lấy thông tin hồ sơ cá nhân:', err);
    }
}

function updateHeaderStats() {
    document.getElementById('header-coins-val').textContent = appState.coins;
    document.getElementById('header-dfss-val').textContent = appState.dfss + "/100";
    document.getElementById('header-user-fullname').textContent = appState.fullname;
    
    const vaultCoins = document.getElementById('vault-coins-text');
    if (vaultCoins) vaultCoins.innerHTML = `${appState.coins} <i class="fa-solid fa-coins"></i>`;
}

function updatePassportUI() {
    document.getElementById('passport-fullname-val').textContent = appState.fullname;
    
    const pType = document.getElementById('passport-type');
    const pBias = document.getElementById('passport-bias');
    const pTier = document.getElementById('passport-tier');
    
    if (appState.dfss >= 75) {
        pType.textContent = "Lý Trí Vững Vàng";
        pBias.textContent = "Rủi ro thấp, phòng vệ tốt";
        pTier.textContent = "Tier 3: Safe Guard";
    } else if (appState.dfss >= 45) {
        pType.textContent = "Cảnh Giác Trung Bình";
        pTier.textContent = "Tier 2: Cảnh giác";
        
        let biases = [];
        if (appState.fomo > 60) biases.push("FOMO");
        if (appState.impulsiveness > 60) biases.push("Bốc đồng");
        if (appState.authority > 60) biases.push("Sợ quyền lực");
        pBias.textContent = biases.length > 0 ? biases.join(", ") : "Hành vi nhẹ";
    } else {
        pType.textContent = "Dễ Bị Tổn Thương";
        pTier.textContent = "Tier 1: Rủi ro cao";
        
        let biases = [];
        if (appState.fomo > 70) biases.push("FOMO cao");
        if (appState.impulsiveness > 70) biases.push("Bốc đồng lớn");
        if (appState.authority > 70) biases.push("Tôn sùng quyền lực");
        pBias.textContent = biases.join(" + ");
    }
    
    // Draw dynamic SVG Radar polygon values
    updatePassportRadar();
}

function updatePassportRadar() {
    const fomoLength = 40 * (appState.fomo / 100);
    const impLength = 40 * (appState.impulsiveness / 100);
    const autLength = 40 * (appState.authority / 100);
    
    // Center of 120x120 SVG is (60, 60)
    const x1 = 60;
    const y1 = 60 - fomoLength;
    
    const x2 = 60 + impLength * 0.866;
    const y2 = 60 + impLength * 0.5;
    
    const x3 = 60 - autLength * 0.866;
    const y3 = 60 + autLength * 0.5;
    
    const poly = document.getElementById('radar-poly');
    if (poly) {
        poly.setAttribute('points', `${x1},${y1} ${x2},${y2} ${x3},${y3}`);
    }
}

function updateLedgerUI(isCompleted) {
    const la = document.getElementById('ledger-task-auth');
    const l1 = document.getElementById('ledger-task-1');
    
    if (la) {
        la.classList.add('completed');
        la.querySelector('.coin-plus').innerHTML = '<i class="fa-solid fa-circle-check" style="margin-right: 4px;"></i> +30 CC';
    }
    if (isCompleted && l1) {
        l1.classList.add('completed');
        l1.querySelector('.coin-plus').innerHTML = '<i class="fa-solid fa-circle-check" style="margin-right: 4px;"></i> +50 CC';
    }
}

// 2. ACCOUNTS SWITCHER DROPDOWN PANEL
function initAccountSwitcher() {
    const dropdownBtn = document.getElementById('btn-accounts-dropdown');
    const dropdownPanel = document.getElementById('accounts-dropdown-panel');
    const logoutBtn = document.getElementById('btn-logout-submit');
    const logoutDirectBtn = document.getElementById('btn-logout-direct');
    
    // Toggle dropdown
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownPanel.classList.toggle('active');
    });
    
    document.addEventListener('click', () => {
        dropdownPanel.classList.remove('active');
    });
    
    dropdownPanel.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    const handleLogout = async () => {
        try {
            const response = await fetch('/api/logout', { method: 'POST' });
            const data = await response.json();
            window.location.href = data.redirect;
        } catch (err) {
            if (window.showToast) window.showToast('Lỗi khi đăng xuất!', 'error');
            else alert('Lỗi khi đăng xuất!');
        }
    };
    
    // Logout Actions
    logoutBtn.addEventListener('click', handleLogout);
    if (logoutDirectBtn) {
        logoutDirectBtn.addEventListener('click', handleLogout);
    }
}

function renderAccountsDropdown(accounts) {
    const container = document.getElementById('accounts-list-container');
    container.innerHTML = '';
    
    accounts.forEach(acc => {
        const btn = document.createElement('button');
        btn.className = 'account-item-btn';
        if (acc.fullname === appState.fullname) {
            btn.classList.add('active');
        }
        btn.innerHTML = `
            <span>${acc.fullname} (${acc.email})</span>
            ${acc.fullname === appState.fullname ? '<i class="fa-solid fa-circle-check"></i>' : ''}
        `;
        
        btn.addEventListener('click', async () => {
            if (acc.fullname === appState.fullname) return; // Already active
            
            try {
                const response = await fetch('/api/switch-account', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: acc.id })
                });
                const data = await response.json();
                
                if (response.ok) {
                    if (window.showToast) window.showToast(data.message, 'success');
                    else alert(data.message);
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1000);
                } else {
                    if (window.showToast) window.showToast(data.error, 'error');
                    else alert(data.error);
                }
            } catch (err) {
                if (window.showToast) window.showToast('Lỗi chuyển đổi tài khoản!', 'error');
                else alert('Lỗi chuyển đổi tài khoản!');
            }
        });
        
        container.appendChild(btn);
    });
}

// 3. PRESET SCENARIO LISTENERS
function initPresetSelectors() {
    const presetButtons = document.querySelectorAll('.preset-row');
    const textarea = document.getElementById('text-input');
    const customDrsSlider = document.getElementById('slider-custom-drs');
    const customDrsVal = document.getElementById('val-custom-drs');
    
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const data = presets[id];
            
            textarea.value = data.text;
            appState.selectedPresetScore = data.score;
            
            customDrsSlider.value = data.score;
            customDrsVal.textContent = data.score + "/100";
            
            textarea.focus();
        });
    });
    
    customDrsSlider.addEventListener('input', () => {
        appState.selectedPresetScore = parseInt(customDrsSlider.value);
        customDrsVal.textContent = appState.selectedPresetScore + "/100";
    });
}

// 4. MOCK AI SCAN RUNNER
function initScanAction() {
    const scanBtn = document.getElementById('btn-start-scan');
    const placeholder = document.getElementById('placeholder-view');
    const progressView = document.getElementById('progress-view');
    const resultView = document.getElementById('result-view');
    const progressBar = document.getElementById('inner-bar');
    
    const logItems = [
        document.getElementById('log-step-1'),
        document.getElementById('log-step-2'),
        document.getElementById('log-step-3')
    ];
    
    scanBtn.addEventListener('click', () => {
        const textInput = document.getElementById('text-input').value.trim();
        if (!textInput) {
            if (window.showToast) window.showToast('Vui lòng chọn một kịch bản hoặc nhập nội dung đáng ngờ!', 'warning');
            else alert('Vui lòng chọn một kịch bản hoặc nhập nội dung đáng ngờ!');
            return;
        }
        
        // Start animation UI
        placeholder.style.display = 'none';
        resultView.style.display = 'none';
        progressView.style.display = 'block';
        
        progressBar.style.width = '0%';
        logItems.forEach(item => item.className = 'step-log-item');
        
        // Scan L1
        logItems[0].className = 'step-log-item active';
        progressBar.style.width = '30%';
        
        setTimeout(() => {
            logItems[0].className = 'step-log-item completed';
            logItems[1].className = 'step-log-item active';
            progressBar.style.width = '65%';
            
            setTimeout(() => {
                logItems[1].className = 'step-log-item completed';
                logItems[2].className = 'step-log-item active';
                progressBar.style.width = '100%';
                
                setTimeout(() => {
                    logItems[2].className = 'step-log-item completed';
                    
                    // Show final analysis DRS Score results
                    displayScanResults();
                    
                }, 700);
            }, 800);
        }, 700);
    });
}

function displayScanResults() {
    const progressView = document.getElementById('progress-view');
    const resultView = document.getElementById('result-view');
    const gaugeFill = document.getElementById('gauge-fill');
    const scoreNum = document.getElementById('gauge-score-val');
    const verdictTag = document.getElementById('verdict-tag');
    const verdictDesc = document.getElementById('verdict-desc');
    
    progressView.style.display = 'none';
    resultView.style.display = 'flex';
    
    scoreNum.textContent = appState.selectedPresetScore;
    
    // Circular SVG dashoffset animation (circumference 440)
    let strokeOffset = 440 - (440 * appState.selectedPresetScore) / 100;
    gaugeFill.style.strokeDashoffset = strokeOffset;
    
    verdictTag.className = 'verdict-tag';
    gaugeFill.className.baseVal = 'gauge-ring-fill';
    
    if (appState.selectedPresetScore >= 70) {
        verdictTag.classList.add('danger');
        verdictTag.textContent = 'Mối nguy hiểm lớn (DRS > 70)';
        gaugeFill.classList.add('danger');
        verdictDesc.textContent = "Hệ thống phát hiện dấu hiệu thao túng tâm lý khẩn cấp và đường dẫn lừa đảo giả mạo ví điện tử.";
        
        // Mark scan task complete in ledger
        const l2 = document.getElementById('ledger-task-2');
        if (l2) {
            l2.classList.add('completed');
            l2.querySelector('.coin-plus').innerHTML = '<i class="fa-solid fa-circle-check" style="margin-right: 4px;"></i> +20 CC';
        }
        
        // Launch Safety Pause!
        setTimeout(() => {
            launchSafetyPauseModal();
        }, 1200);
        
    } else {
        verdictTag.classList.add('safe');
        verdictTag.textContent = 'Mức độ an toàn (DRS thấp)';
        verdictDesc.textContent = "Nội dung khớp với hoạt động thường nhật và chứng chỉ tên miền đào tạo an toàn chính thống.";
        
        // Save safe log to database directly
        saveDecisionToDatabase('continued');
    }
}

// 5. SAFETY PAUSE COUNTDOWN DIALOG
function launchSafetyPauseModal() {
    const modal = document.getElementById('safety-pause-screen');
    const timerFill = document.getElementById('timer-ring-fill');
    const timerText = document.getElementById('timer-text');
    const continueBtn = document.getElementById('btn-pause-continue');
    
    // Reset pulse and warning styles initially
    timerText.classList.remove('pulse');
    timerFill.classList.remove('warning');
    
    // Prompt questions selection
    const prompts = [
        "Tại sao họ lại ép buộc bạn phải thực hiện giao dịch hoặc chuyển khoản gấp gáp chỉ trong vài phút?",
        "Nếu đây thực sự là người đại diện của cơ quan công an/nhà trường, họ có bao giờ yêu cầu xử lý tài chính qua tin nhắn ẩn danh không?",
        "Số tiền hoặc thông tin bạn chuẩn bị cung cấp có khả năng khôi phục được không nếu xảy ra kịch bản xấu nhất?",
        "Tại sao bạn lại có xu hướng thực hiện giao dịch này mà không hỏi người thân hoặc tra cứu chéo trực tiếp?"
    ];
    document.getElementById('pause-question').textContent = prompts[Math.floor(Math.random() * prompts.length)];

    modal.classList.add('active');
    
    // Lock continue
    continueBtn.disabled = true;
    continueBtn.querySelector('span').textContent = "Tiếp tục giao dịch (Đang khóa)";
    
    appState.timeRemaining = 30;
    timerText.textContent = appState.timeRemaining;
    timerFill.style.strokeDashoffset = 0; // Circumference is 283
    
    clearInterval(appState.countdownTimer);
    appState.countdownTimer = setInterval(() => {
        appState.timeRemaining--;
        timerText.textContent = appState.timeRemaining;
        
        let progress = (30 - appState.timeRemaining) / 30;
        timerFill.style.strokeDashoffset = 283 * progress;
        
        // Add heartbeat warnings when under 10 seconds
        if (appState.timeRemaining <= 10 && appState.timeRemaining > 0) {
            timerText.classList.add('pulse');
            timerFill.classList.add('warning');
        }
        
        if (appState.timeRemaining <= 0) {
            clearInterval(appState.countdownTimer);
            timerText.classList.remove('pulse');
            timerFill.classList.remove('warning');
            continueBtn.disabled = false;
            continueBtn.querySelector('span').textContent = "Tiếp tục giao dịch";
        }
    }, 1000);
}

function initSafetyPauseActions() {
    const modal = document.getElementById('safety-pause-screen');
    const abortBtn = document.getElementById('btn-pause-abort');
    const continueBtn = document.getElementById('btn-pause-continue');
    const skipBtn = document.getElementById('btn-skip-timer');
    const timerText = document.getElementById('timer-text');
    const timerFill = document.getElementById('timer-ring-fill');
    
    // Prototype skip timer logic
    skipBtn.addEventListener('click', () => {
        clearInterval(appState.countdownTimer);
        appState.timeRemaining = 0;
        timerText.textContent = 0;
        timerText.classList.remove('pulse');
        timerFill.classList.remove('warning');
        timerFill.style.strokeDashoffset = 283;
        
        continueBtn.disabled = false;
        continueBtn.querySelector('span').textContent = "Tiếp tục giao dịch";
    });
    
    // Path 1: Abort transaction (SAY NO TO SCAM!)
    abortBtn.addEventListener('click', () => {
        clearInterval(appState.countdownTimer);
        timerText.classList.remove('pulse');
        timerFill.classList.remove('warning');
        modal.classList.remove('active');
        
        // Update DB
        saveDecisionToDatabase('aborted');
        
        // Update task UI ledger
        const l3 = document.getElementById('ledger-task-3');
        if (l3) {
            l3.classList.add('completed');
            l3.querySelector('.coin-plus').innerHTML = '<i class="fa-solid fa-circle-check" style="margin-right: 4px;"></i> +30 CC';
        }
        
        if (window.showToast) {
            window.showToast("Thành công! Bạn đã chặn đứng đòn thao túng tâm lý. +30 CC!", "success");
        } else {
            alert("Thành công! Bạn đã chặn đứng đòn thao túng tâm lý.\nThưởng ngay +30 Campus Coins và tăng điểm DFSS!");
        }
        
        // Switch to Dashboard View
        document.getElementById('tab-btn-dashboard').click();
    });
    
    // Path 2: Continue (Dangerous choice)
    continueBtn.addEventListener('click', () => {
        clearInterval(appState.countdownTimer);
        timerText.classList.remove('pulse');
        timerFill.classList.remove('warning');
        modal.classList.remove('active');
        
        // Update DB
        saveDecisionToDatabase('continued');
        
        if (window.showToast) {
            window.showToast("Cảnh báo: Bạn đã tiếp tục giao dịch rủi ro! Điểm DFSS đã bị giảm sụt.", "error");
        } else {
            alert("Cảnh báo: Bạn đã bỏ qua Safety Pause. Điểm số an toàn số (DFSS) của bạn đã bị suy giảm do hành động rủi ro!");
        }
        
        // Switch to Dashboard View
        document.getElementById('tab-btn-dashboard').click();
    });
}

// REST API Database Sync
async function saveDecisionToDatabase(status) {
    const textInput = document.getElementById('text-input').value.trim();
    
    try {
        const response = await fetch('/api/scan/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: textInput,
                link: '',
                drs_score: appState.selectedPresetScore,
                status: status
            })
        });
        
        if (response.ok) {
            // Retrieve updated coins/DFSS from DB response
            const resData = await response.json();
            appState.coins = resData.coins;
            appState.dfss = resData.dfss;
            appState.fomo = resData.fomo;
            appState.impulsiveness = resData.impulsiveness;
            appState.authority = resData.authority;
            
            updateHeaderStats();
            updatePassportUI();
        }
    } catch (err) {
        console.error('Không thể lưu kết quả quét lên cơ sở dữ liệu:', err);
    }
}

// 6. TAB NAVIGATION SYSTEMS
function initTabNavigation() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.view-panel');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab');
            document.getElementById(targetId).classList.add('active');
            
            if (targetId === 'view-dashboard') {
                animateDashboardGauges();
            }
        });
    });
}

function animateDashboardGauges() {
    const fillCircle = document.getElementById('dash-gauge-fill');
    const scoreVal = document.getElementById('dash-score-num');
    const verdictTitle = document.getElementById('dash-verdict-title');
    const verdictDesc = document.getElementById('dash-verdict-desc');
    
    if (!fillCircle) return;
    
    // Circular SVG dashoffset animation (circumference 471)
    let strokeOffset = 471 - (471 * appState.dfss) / 100;
    fillCircle.style.strokeDashoffset = strokeOffset;
    
    // Set dynamic gauge color based on score (Emerald Green, Amber, Alert Red)
    let strokeColor = 'var(--color-safe)';
    if (appState.dfss < 45) {
        strokeColor = 'var(--color-danger)';
    } else if (appState.dfss < 75) {
        strokeColor = 'var(--color-warning)';
    }
    fillCircle.style.stroke = strokeColor;
    
    // Number counter animation
    let count = 0;
    const interval = setInterval(() => {
        if (count >= appState.dfss) {
            clearInterval(interval);
        } else {
            count++;
            scoreVal.textContent = count;
        }
    }, 12);
    
    // Dynamic verdicts strings
    if (appState.dfss >= 75) {
        verdictTitle.textContent = "AN TOÀN CAO (SAFE ZONE)";
        verdictTitle.style.color = "var(--color-safe)";
        verdictDesc.textContent = "Hồ sơ của bạn cho thấy tính cẩn trọng cao, ít bị lung lay bởi quà tặng hay áp lực ảo.";
    } else if (appState.dfss >= 45) {
        verdictTitle.textContent = "ĐỘ CẢNH GIÁC TRUNG BÌNH";
        verdictTitle.style.color = "var(--color-warning)";
        verdictDesc.textContent = "Nhận thức an ninh tương đối ổn, tuy nhiên vẫn cần đề phòng bẫy cấp bách ép buộc thời gian.";
    } else {
        verdictTitle.textContent = "NGUY CƠ BỊ THAO TÚNG CAO";
        verdictTitle.style.color = "var(--color-danger)";
        verdictDesc.textContent = "Thiên kiến bốc đồng hoặc FOMO lớn, ranh giới phòng vệ mỏng. Hãy thực hành quét thêm kịch bản.";
    }
}
