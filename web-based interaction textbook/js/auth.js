/**
 * 用户认证模块
 * 依赖于 Supabase 客户端
 */

// 认证管理类
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authListeners = [];
        this.isInitialized = false;
        
        console.log('🔐 认证管理器初始化');
    }
    
    // 初始化认证系统
    async init() {
        if (this.isInitialized) {
            return;
        }
        
        console.log('🔄 初始化认证系统...');
        
        try {
            // 1. 确保Supabase客户端就绪
            const client = await window.Supabase.getClient();
            
            // 2. 检查当前登录状态
            await this.checkAuthState();
            
            // 3. 设置认证状态监听
            this._setupAuthListener(client);
            
            this.isInitialized = true;
            console.log('✅ 认证系统初始化完成');
            
        } catch (error) {
            console.error('❌ 认证系统初始化失败:', error);
        }
    }
    
    // 检查认证状态
    async checkAuthState() {
        try {
            const user = await window.Supabase.getCurrentUser();
            
            if (user) {
                this.currentUser = user;
                this._updateUI(true, user);
                this._notifyListeners('login', user);
                
                console.log('✅ 用户已登录:', user.email);
                return { isAuthenticated: true, user };
                
            } else {
                this.currentUser = null;
                this._updateUI(false, null);
                
                console.log('👤 用户未登录');
                return { isAuthenticated: false, user: null };
            }
            
        } catch (error) {
            console.error('检查认证状态失败:', error);
            this._updateUI(false, null);
            return { isAuthenticated: false, user: null, error };
        }
    }
    
    // 用户登录
    async login(email, password) {
        try {
            this._showMessage('正在登录...', 'info');
            
            const client = await window.Supabase.getClient();
            
            const { data, error } = await client.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });
            
            if (error) {
                throw error;
            }
            
            this._showMessage('登录成功！', 'success');
            
            // 更新状态
            this.currentUser = data.user;
            this._updateUI(true, data.user);
            this._notifyListeners('login', data.user);
            
            return { success: true, user: data.user };
            
        } catch (error) {
            console.error('登录失败:', error);
            this._showMessage(`登录失败: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }
    
    // 用户注册
    async signup(email, password) {
        try {
            this._showMessage('正在注册...', 'info');
            
            const client = await window.Supabase.getClient();
            
            const { data, error } = await client.auth.signUp({
                email: email.trim(),
                password: password
            });
            
            if (error) {
                throw error;
            }
            
            this._showMessage('注册成功！请检查邮箱验证邮件。', 'success');
            
            return { success: true, data };
            
        } catch (error) {
            console.error('注册失败:', error);
            this._showMessage(`注册失败: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }
    
    // 用户登出
    async logout() {
        try {
            const client = await window.Supabase.getClient();
            const { error } = await client.auth.signOut();
            
            if (error) {
                throw error;
            }
            
            this.currentUser = null;
            this._updateUI(false, null);
            this._notifyListeners('logout', null);
            
            this._showMessage('已退出登录', 'success');
            
            return { success: true };
            
        } catch (error) {
            console.error('登出失败:', error);
            this._showMessage(`登出失败: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }
    
    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }
    
    // 检查是否已登录
    isLoggedIn() {
        return !!this.currentUser;
    }
    
    // 保存学习进度
    async saveProgress(chapterId, lessonId, progressData = {}) {
        if (!this.isLoggedIn()) {
            console.warn('用户未登录，无法保存进度');
            return { success: false, error: '用户未登录' };
        }
        
        try {
            const client = await window.Supabase.getClient();
            
            const { error } = await client
                .from('user_progress')
                .upsert({
                    user_id: this.currentUser.id,
                    chapter_id: chapterId,
                    lesson_id: lessonId,
                    progress_data: progressData,
                    completed: true,
                    last_accessed: new Date().toISOString()
                });
            
            if (error) {
                throw error;
            }
            
            console.log('📝 学习进度已保存');
            return { success: true };
            
        } catch (error) {
            console.error('保存学习进度失败:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 加载学习进度
    async loadProgress() {
        if (!this.isLoggedIn()) {
            console.warn('用户未登录，无法加载进度');
            return { success: false, error: '用户未登录' };
        }
        
        try {
            const client = await window.Supabase.getClient();
            
            const { data, error } = await client
                .from('user_progress')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('last_accessed', { ascending: false });
            
            if (error) {
                throw error;
            }
            
            // 更新页面进度状态
            this._updateProgressUI(data || []);
            
            return { success: true, data };
            
        } catch (error) {
            console.error('加载学习进度失败:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 添加认证状态监听器
    addAuthListener(callback) {
        if (typeof callback === 'function') {
            this.authListeners.push(callback);
        }
    }
    
    // 移除认证状态监听器
    removeAuthListener(callback) {
        const index = this.authListeners.indexOf(callback);
        if (index > -1) {
            this.authListeners.splice(index, 1);
        }
    }
    
    // 私有方法：设置认证状态监听
    _setupAuthListener(client) {
        client.auth.onAuthStateChange((event, session) => {
            console.log('🔐 认证状态变化:', event);
            
            switch (event) {
                case 'SIGNED_IN':
                    this.currentUser = session?.user || null;
                    this._updateUI(true, this.currentUser);
                    this._notifyListeners('login', this.currentUser);
                    break;
                    
                case 'SIGNED_OUT':
                    this.currentUser = null;
                    this._updateUI(false, null);
                    this._notifyListeners('logout', null);
                    break;
                    
                case 'USER_UPDATED':
                    this.currentUser = session?.user || null;
                    this._notifyListeners('update', this.currentUser);
                    break;
            }
        });
    }
    
    // 私有方法：更新UI
    _updateUI(isLoggedIn, user) {
        const loginSection = document.getElementById('login-section');
        const mainContent = document.getElementById('main-content');
        const userEmail = document.getElementById('user-email');
        const userAvatar = document.getElementById('user-avatar');
        
        if (loginSection) {
            loginSection.style.display = isLoggedIn ? 'none' : 'block';
        }
        
        if (mainContent) {
            mainContent.style.display = isLoggedIn ? 'block' : 'none';
        }
        
        if (userEmail && user) {
            userEmail.textContent = user.email;
        }
        
        if (userAvatar && user) {
            // 显示用户名的首字母
            const initial = user.email.charAt(0).toUpperCase();
            userAvatar.textContent = initial;
        }
        
        // 如果已登录，加载学习进度
        if (isLoggedIn && user) {
            this.loadProgress();
        }
    }
    
    // 私有方法：更新进度UI
    _updateProgressUI(progressData) {
        if (!Array.isArray(progressData)) return;
        
        progressData.forEach(item => {
            const statusEl = document.getElementById(`status-${item.chapter_id}-${item.lesson_id}`);
            if (statusEl && item.completed) {
                statusEl.textContent = '已完成';
                statusEl.classList.add('completed');
            }
        });
    }
    
    // 私有方法：显示消息
    _showMessage(message, type = 'info') {
        const messageEl = document.getElementById('auth-message');
        if (!messageEl) return;
        
        messageEl.textContent = message;
        messageEl.className = 'auth-message';
        
        switch (type) {
            case 'success':
                messageEl.classList.add('success');
                break;
            case 'error':
                messageEl.classList.add('error');
                break;
            case 'info':
                messageEl.classList.add('info');
                break;
        }
        
        // 3秒后自动清除消息
        setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = 'auth-message';
        }, 3000);
    }
    
    // 私有方法：通知监听器
    _notifyListeners(event, data) {
        this.authListeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('认证监听器执行错误:', error);
            }
        });
    }
}

// 创建全局认证管理器实例
window.Auth = new AuthManager();

// 为了方便使用，暴露一些常用函数到全局
window.AuthManager = {
    // 登录
    login: function() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            window.Auth._showMessage('请输入邮箱和密码', 'error');
            return;
        }
        
        if (password.length < 6) {
            window.Auth._showMessage('密码至少6个字符', 'error');
            return;
        }
        
        window.Auth.login(email, password);
    },
    
    // 注册
    signup: function() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            window.Auth._showMessage('请输入邮箱和密码', 'error');
            return;
        }
        
        if (password.length < 6) {
            window.Auth._showMessage('密码至少6个字符', 'error');
            return;
        }
        
        window.Auth.signup(email, password);
    },
    
    // 登出
    logout: function() {
        if (confirm('确定要退出登录吗？')) {
            window.Auth.logout();
        }
    },
    
    // 完成课程
    completeLesson: function(chapterId, lessonId) {
        window.Auth.saveProgress(chapterId, lessonId, {
            completedAt: new Date().toISOString()
        }).then(result => {
            if (result.success) {
                const statusEl = document.getElementById(`status-${chapterId}-${lessonId}`);
                if (statusEl) {
                    statusEl.textContent = '已完成';
                    statusEl.classList.add('completed');
                }
                alert('进度已保存！');
            } else {
                alert('保存失败: ' + result.error);
            }
        });
    }
};