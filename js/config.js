// config.js - 修复版配置文件
window.APP_CONFIG = {
    supabase: {
        url: 'https://mdputttsejaxpgimracz.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHV0dHRzZWpheHBnaW1yYWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4ODUxNzcsImV4cCI6MjA4MTQ2MTE3N30.Y9ndFe2-Sc1ibxXTkKKLjuRRi49MPRNxfT6kweDv9eA'
    },
    debug: true
};

console.log('✅ 配置加载完成');
console.log('Supabase URL:', window.APP_CONFIG.supabase.url);

