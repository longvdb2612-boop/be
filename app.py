import os
import secrets
from datetime import datetime, timedelta, timezone
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
import bcrypt

app = Flask(__name__)
app.secret_key = os.urandom(24) # Strong cryptographic session keys

# Configure Relational Database (SQLite in the workspace folder)
db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'safemoney.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ========================================================================= 
# DATABASE MODELS
# ========================================================================= 
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    fullname = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    
    # Behavioral Profile Scores
    fomo_score = db.Column(db.Integer, default=50)
    impulsiveness_score = db.Column(db.Integer, default=50)
    authority_score = db.Column(db.Integer, default=50)
    dfss_score = db.Column(db.Integer, default=60)
    coins = db.Column(db.Integer, default=100)
    
    is_profile_completed = db.Column(db.Boolean, default=False)
    
    # Security parameters
    failed_login_attempts = db.Column(db.Integer, default=0)
    locked_until = db.Column(db.DateTime, nullable=True)
    
    # Password recovery token
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expires = db.Column(db.DateTime, nullable=True)

    def is_locked(self):
        if self.locked_until and self.locked_until > datetime.now(timezone.utc).replace(tzinfo=None):
            return True
        return False

class ScanRecord(db.Model):
    __tablename__ = 'scan_records'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(255), nullable=True)
    drs_score = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(50), nullable=False) # 'aborted' or 'continued'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# ========================================================================= 
# ROUTE PROTECTION DECORATOR
# ========================================================================= 
def get_current_user():
    user_id = session.get('current_user_id')
    if not user_id:
        return None
    return User.query.get(user_id)

# ========================================================================= 
# TEMPLATE VIEWS (PAGE CONTROLLERS & SERVER-SIDE ROUTE PROTECTION)
# ========================================================================= 
@app.route('/')
def landing_page():
    user = get_current_user()
    return render_template('landing.html', user=user)

@app.route('/login')
def login_page():
    user = get_current_user()
    if user:
        return redirect(url_for('app_page'))
    return render_template('auth.html')

@app.route('/onboarding')
def onboarding_page():
    user = get_current_user()
    if not user:
        return redirect(url_for('login_page'))
    if user.is_profile_completed:
        return redirect(url_for('app_page'))
    return render_template('onboarding.html', user=user)

@app.route('/app')
def app_page():
    user = get_current_user()
    if not user:
        return redirect(url_for('login_page'))
    if not user.is_profile_completed:
        return redirect(url_for('onboarding_page'))
    return render_template('app.html', user=user)

# ========================================================================= 
# REST API ENDPOINTS
# ========================================================================= 

# API 1: Register Account
@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    fullname = data.get('fullname', '').strip()
    password = data.get('password', '')

    if not email or not fullname or not password:
        return jsonify({'error': 'Vui lòng nhập đầy đủ thông tin!'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Tài khoản Email này đã tồn tại trên hệ thống!'}), 409

    # Encrypt Password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    new_user = User(email=email, fullname=fullname, password_hash=password_hash)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'Tạo tài khoản thành công! Hãy đăng nhập để bắt đầu.'}), 201

# API 2: Secure Login (Brute Force Protected)
@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Vui lòng cung cấp cả tài khoản và mật khẩu!'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Tài khoản không chính xác!'}), 401

    # Check brute-force lock
    if user.is_locked():
        unlock_time = user.locked_until.strftime('%H:%M:%S')
        return jsonify({'error': f'Tài khoản đang bị khoá tạm thời do nhập sai quá 5 lần. Hãy thử lại sau {unlock_time}.'}), 403

    # Check password
    if bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        # Reset failed attempts
        user.failed_login_attempts = 0
        user.locked_until = None
        db.session.commit()

        # Session setup
        session['current_user_id'] = user.id
        
        # Multi-accounts switcher registration
        if 'accounts' not in session:
            session['accounts'] = []
        
        # Append only if not already present
        if not any(acc['email'] == user.email for acc in session['accounts']):
            session['accounts'].append({
                'id': user.id,
                'email': user.email,
                'fullname': user.fullname
            })
        session.modified = True

        return jsonify({
            'message': 'Đăng nhập thành công!',
            'redirect': url_for('onboarding_page') if not user.is_profile_completed else url_for('app_page')
        }), 200
    else:
        # Increment failed attempts
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=5)
            db.session.commit()
            return jsonify({'error': 'Nhập sai mật khẩu quá 5 lần. Tài khoản bị khoá tạm thời trong 5 phút!'}), 403
        
        db.session.commit()
        attempts_left = 5 - user.failed_login_attempts
        return jsonify({'error': f'Mật khẩu không chính xác! Bạn còn {attempts_left} lần thử.'}), 401

# API 3: Switch Account Session (Instant without password)
@app.route('/api/switch-account', methods=['POST'])
def api_switch_account():
    data = request.get_json() or {}
    target_user_id = data.get('user_id')

    if not target_user_id:
        return jsonify({'error': 'Thiếu ID tài khoản cần chuyển đổi!'}), 400

    # Verify if target account is registered in active browser session
    active_accounts = session.get('accounts', [])
    if not any(acc['id'] == int(target_user_id) for acc in active_accounts):
        return jsonify({'error': 'Tài khoản này chưa đăng nhập trên thiết bị này!'}), 403

    user = User.query.get(target_user_id)
    if not user:
        return jsonify({'error': 'Tài khoản không tồn tại!'}), 404

    # Switch session
    session['current_user_id'] = user.id
    return jsonify({
        'message': f'Đã chuyển đổi sang tài khoản {user.fullname}',
        'redirect': url_for('onboarding_page') if not user.is_profile_completed else url_for('app_page')
    }), 200

# API 4: User Profile Getter
@app.route('/api/profile/get', methods=['GET'])
def api_profile_get():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Vui lòng đăng nhập!'}), 401

    active_accounts = session.get('accounts', [])

    return jsonify({
        'email': user.email,
        'fullname': user.fullname,
        'fomo': user.fomo_score,
        'impulsiveness': user.impulsiveness_score,
        'authority': user.authority_score,
        'dfss': user.dfss_score,
        'coins': user.coins,
        'is_completed': user.is_profile_completed,
        'active_accounts': active_accounts
    }), 200

# API 5: Save Profiling Sliders
@app.route('/api/profile/save', methods=['POST'])
def api_profile_save():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Vui lòng đăng nhập!'}), 401

    data = request.get_json() or {}
    fomo = int(data.get('fomo', 50))
    impulsiveness = int(data.get('impulsiveness', 50))
    authority = int(data.get('authority', 50))

    user.fomo_score = fomo
    user.impulsiveness_score = impulsiveness
    user.authority_score = authority

    # Calculate DFSS
    bias_average = (fomo + impulsiveness + authority) / 3
    user.dfss_score = round(100 - bias_average)
    
    # Award coins on completion
    if not user.is_profile_completed:
        user.coins += 50
        user.is_profile_completed = True

    db.session.commit()

    return jsonify({
        'message': 'Cấu hình hồ sơ thành công!',
        'dfss': user.dfss_score,
        'coins': user.coins
    }), 200

# API 6: Save Scam Scan Transaction Record
@app.route('/api/scan/save', methods=['POST'])
def api_scan_save():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Vui lòng đăng nhập!'}), 401

    data = request.get_json() or {}
    message = data.get('message', '').strip()
    link = data.get('link', '').strip()
    drs_score = int(data.get('drs_score', 0))
    status = data.get('status', 'continued') # 'aborted' or 'continued'

    if not message:
        return jsonify({'error': 'Thiếu nội dung tin nhắn!'}), 400

    # Save to history db
    record = ScanRecord(user_id=user.id, message=message, link=link, drs_score=drs_score, status=status)
    db.session.add(record)

    # Calculate score & coin impacts
    if status == 'aborted':
        user.coins += 30
        
        # Dynamically decrease target trait (user is becoming more cautious)
        if drs_score == 85:
            user.fomo_score = max(0, user.fomo_score - 8)
        elif drs_score == 92:
            user.authority_score = max(0, user.authority_score - 8)
        else:
            user.impulsiveness_score = max(0, user.impulsiveness_score - 8)
    else:
        # Dynamically increase target trait (user fell into the trap)
        if drs_score == 85:
            user.fomo_score = min(100, user.fomo_score + 12)
        elif drs_score == 92:
            user.authority_score = min(100, user.authority_score + 12)
        else:
            user.impulsiveness_score = min(100, user.impulsiveness_score + 12)

    # Recalculate DFSS Score based on new traits
    bias_average = (user.fomo_score + user.impulsiveness_score + user.authority_score) / 3
    user.dfss_score = round(100 - bias_average)

    db.session.commit()

    return jsonify({
        'message': 'Ghi nhận quyết định thành công!',
        'coins': user.coins,
        'dfss': user.dfss_score,
        'fomo': user.fomo_score,
        'impulsiveness': user.impulsiveness_score,
        'authority': user.authority_score
    }), 200

# API 7: Fetch Scan History
@app.route('/api/scan/history', methods=['GET'])
def api_scan_history():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Vui lòng đăng nhập!'}), 401

    records = ScanRecord.query.filter_by(user_id=user.id).order_by(ScanRecord.timestamp.desc()).all()
    history = [{
        'message': r.message[:80] + '...' if len(r.message) > 80 else r.message,
        'drs': r.drs_score,
        'status': r.status,
        'time': r.timestamp.strftime('%Y-%m-%d %H:%M:%S')
    } for r in records]

    return jsonify({'history': history}), 200

# API 8: Logout session
@app.route('/api/logout', methods=['POST'])
def api_logout():
    user_id = session.pop('current_user_id', None)
    if user_id:
        # Also clean up accounts list
        session['accounts'] = [acc for acc in session.get('accounts', []) if acc['id'] != user_id]
        session.modified = True
    return jsonify({'message': 'Đã đăng xuất thành công!', 'redirect': url_for('landing_page')}), 200

# API 9: Forgot Password Token Request
@app.route('/api/forgot-password', methods=['POST'])
def api_forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    
    if not email:
        return jsonify({'error': 'Vui lòng cung cấp địa chỉ Email!'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        # Return success even if user not found to prevent user enumeration security issues,
        # but let's print log warning.
        return jsonify({'message': 'Yêu cầu khôi phục mật khẩu đã được gửi (nếu Email tồn tại)!'}), 200
        
    # Generate random recovery token
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=15)
    db.session.commit()
    
    # Simulate sending email by printing details to the console log (extremely useful for local test!)
    reset_url = url_for('reset_password_page', token=token, _external=True)
    print("\n" + "="*80)
    print(f"[SECURITY MOCK EMAIL SENDER] Password reset request for: {email}")
    print("Click the following link to set a new password (valid for 15 minutes):")
    print(f" -> {reset_url}")
    print("="*80 + "\n")
    
    return jsonify({
        'message': 'Đã gửi liên kết khôi phục mật khẩu thành công! Vui lòng kiểm tra LOG/CONSOLE chạy Flask để lấy liên kết.',
        'console_link': reset_url # We also return it in response for the prototype convenience of test!
    }), 200

# Route: Password Reset Page
@app.route('/reset-password')
def reset_password_page():
    token = request.args.get('token', '').strip()
    if not token:
        return redirect(url_for('login_page'))
        
    user = User.query.filter_by(reset_token=token).first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.now(timezone.utc).replace(tzinfo=None):
        # Invalid or expired token
        return "Liên kết khôi phục mật khẩu không hợp lệ hoặc đã hết hạn! Vui lòng gửi lại yêu cầu.", 400
        
    return render_template('reset_password.html', token=token)

# API 10: Process Password Reset
@app.route('/api/reset-password', methods=['POST'])
def api_reset_password():
    data = request.get_json() or {}
    token = data.get('token', '').strip()
    new_password = data.get('password', '')
    
    if not token or not new_password:
        return jsonify({'error': 'Thiếu Token hoặc mật khẩu mới!'}), 400
        
    user = User.query.filter_by(reset_token=token).first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.now(timezone.utc).replace(tzinfo=None):
        return jsonify({'error': 'Yêu cầu đặt lại mật khẩu đã hết hạn hoặc không hợp lệ!'}), 400
        
    # Encrypt and save new password
    user.password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user.reset_token = None
    user.reset_token_expires = None
    db.session.commit()
    
    return jsonify({'message': 'Đặt lại mật khẩu thành công! Hãy đăng nhập bằng mật khẩu mới.'}), 200

# ========================================================================= 
# DATABASE INITIALIZATION
# ========================================================================= 
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    # Listen on all network interfaces to allow mobile connections
    import socket
    try:
        # Get local IP address for terminal logs
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        print("\n" + "="*80)
        print("[MOBILE CONNECTION] To access the app from your mobile phone:")
        print(f"URL: http://{local_ip}:5000")
        print("="*80 + "\n")
    except Exception:
        print("\n[MOBILE CONNECTION] Listening on all interfaces (0.0.0.0)...")
        
    app.run(host='0.0.0.0', debug=True, port=5000)
