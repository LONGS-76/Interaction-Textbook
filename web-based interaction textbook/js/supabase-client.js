/**
 * Supabase客户端管理
 * 单例模式，确保全局只有一个Supabase客户端实例
 */

// 私有变量
let _supabaseClient = null;
let _isInitializing = false;
let _initPromise = null;

// Supabase客户端类
class SupabaseClient {
    constructor() {
        console.log('🔄 创建Supabase客户端实例');
    }
    
    // 获取Supabase客户端（单例）
    static async getClient() {
        // 如果已经初始化，直接返回
        if (_supabaseClient) {
            return _supabaseClient;
        }
        
        // 如果正在初始化，等待初始化完成
        if (_isInitializing && _initPromise) {
            return await _initPromise;
        }
        
        // 开始初始化
        _isInitializing = true;
        _initPromise = this._initializeClient();
        
        try {
            _supabaseClient = await _initPromise;
            return _supabaseClient;
        } finally {
            _isInitializing = false;
        }
    }
    
    // 初始化客户端
    static async _initializeClient() {
        console.log('🚀 初始化Supabase客户端...');
        
        // 检查配置
        if (!window.APP_CONFIG || !window.APP_CONFIG.supabase) {
            throw new Error('应用程序配置未加载');
        }
        
        const config = window.APP_CONFIG.supabase;
        
        if (!config.url || !config.anonKey) {
            throw new Error('Supabase配置不完整');
        }
        
        try {
            // 1. 加载Supabase库
            await this._loadSupabaseLibrary();
            
            // 2. 创建客户端
            const client = window.supabase.createClient(config.url, config.anonKey);
            
            console.log('✅ Supabase客户端初始化成功');
            
            // 3. 测试连接
            await this._testConnection(client);
            
            return client;
            
        } catch (error) {
            console.error('❌ Supabase客户端初始化失败:', error);
            throw error;
        }
    }
    
    // 加载Supabase库
    static async _loadSupabaseLibrary() {
        return new Promise((resolve, reject) => {
            // 如果已经加载，直接返回
            if (window.supabase && window.supabase.createClient) {
                resolve();
                return;
            }
            
            console.log('📦 加载Supabase库...');
            
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@supabase/supabase-js@2';
            script.async = true;
            
            script.onload = () => {
                console.log('✅ Supabase库加载成功');
                resolve();
            };
            
            script.onerror = () => {
                reject(new Error('无法加载Supabase库，请检查网络连接'));
            };
            
            document.head.appendChild(script);
        });
    }
    
    // 测试连接
    static async _testConnection(client) {
        try {
            console.log('🔌 测试Supabase连接...');
            
            const { data, error } = await client
                .from('user_progress')
                .select('count', { count: 'exact', head: true });
            
            if (error) {
                console.warn('⚠️ Supabase连接测试失败:', error.message);
                // 不抛出错误，客户端仍可使用
            } else {
                console.log('✅ Supabase连接正常');
            }
            
        } catch (error) {
            console.warn('⚠️ Supabase连接测试异常:', error.message);
        }
    }
    
    // 重置客户端（用于重新登录等情况）
    static reset() {
        console.log('🔄 重置Supabase客户端');
        _supabaseClient = null;
        _isInitializing = false;
        _initPromise = null;
    }
    
    // 获取当前用户
    static async getCurrentUser() {
        try {
            const client = await this.getClient();
            const { data: { user }, error } = await client.auth.getUser();
            
            if (error) throw error;
            return user;
            
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return null;
        }
    }
    
    // 检查是否已登录
    static async isAuthenticated() {
        const user = await this.getCurrentUser();
        return !!user;
    }
}

// 暴露到全局
window.Supabase = SupabaseClient;