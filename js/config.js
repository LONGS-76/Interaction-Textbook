// config.js - 修复版配置文件
window.APP_CONFIG = {
    supabase: {
        url: 'https://mdputttsejaxpgimracz.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHV0dHRzZWpheHBnaW1yYWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDYxNjYyMzUsImV4cCIyMDIyMTMyMjM1fQ.9Kt5Vv5yRzJt5L5v5RzJt5L5v5RzJt5L5v5RzJt5L5'
    },
    debug: true
};

console.log('✅ 配置加载完成');
console.log('Supabase URL:', window.APP_CONFIG.supabase.url);
