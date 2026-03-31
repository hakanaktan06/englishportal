// ==========================================
// 1. SUPABASE AYARLARI
// ==========================================
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let currentSchoolId = null;
let currentAdminName = '';
let currentSchoolName = '';

// ==========================================
// 🛡️ GÜVENLİK VE BAŞLATMA
// ==========================================
async function initKurumPortal() {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) { window.location.href = 'index.html'; return; }

    const { data: profile, error: pError } = await supabaseClient.from('profiles').select('*').eq('id', user.id).single();
    
    if (pError || !profile || profile.role !== 'kurum') {
        if (profile && profile.role === 'god') { window.location.href = 'patron.html'; return; }
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
        return;
    }

    currentSchoolId = profile.school_id;
    currentAdminName = profile.full_name;
    currentSchoolName = profile.school_name || "Yeni Akademi";

    // UI Güncelle
    document.getElementById('headerAdminName').innerText = currentAdminName;
    document.getElementById('headerSchoolName').innerText = currentSchoolName;
    document.getElementById('setSchoolName').value = currentSchoolName;
    document.getElementById('setSchoolLogo').value = profile.school_logo || '';
    if(profile.school_logo) document.getElementById('previewLogo').src = profile.school_logo;

    switchTab('dashboard');
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        if(splash) { splash.classList.add('opacity-0'); setTimeout(() => splash.classList.add('hidden'), 700); }
    }, 400);
}

// ==========================================
// UI MOTORU (SEKMELER)
// ==========================================
const tabs = {
    dashboard: document.getElementById('section-dashboard'),
    teachers: document.getElementById('section-teachers'),
    settings: document.getElementById('section-settings')
};

function switchTab(target) {
    for (const key in tabs) {
        if(tabs[key]) tabs[key].classList.add('hidden');
    }
    if(tabs[target]) tabs[target].classList.remove('hidden');

    // Sidebar Active State
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('bg-amber-600/20', 'text-amber-500', 'active-menu'));
    const activeBtn = document.getElementById(`btn-${target}`);
    if(activeBtn) activeBtn.classList.add('bg-amber-600/20', 'text-amber-500', 'active-menu');

    if(target === 'dashboard') fetchStats();
    if(target === 'teachers') fetchTeachers();

    // Mobile Sidebar Close
    if(window.innerWidth < 768) {
        document.getElementById('mainSidebar').classList.add('-translate-x-full');
        document.getElementById('sidebarOverlay').classList.add('hidden');
    }
}

document.getElementById('btn-dashboard').onclick = (e) => { e.preventDefault(); switchTab('dashboard'); };
document.getElementById('btn-teachers').onclick = (e) => { e.preventDefault(); switchTab('teachers'); };
document.getElementById('btn-settings').onclick = (e) => { e.preventDefault(); switchTab('settings'); };

// ==========================================
// İSTATİSTİK MOTORU
// ==========================================
async function fetchStats() {
    // 1. Eğitmen Sayısı
    const { count: tCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('school_id', currentSchoolId).eq('role', 'teacher');
    document.getElementById('statTeacherCount').innerText = tCount || 0;

    // 2. Öğrenci Sayısı
    const { count: sCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('school_id', currentSchoolId).eq('role', 'student');
    document.getElementById('statStudentCount').innerText = sCount || 0;

    // 3. Ödev Sayısı (Tamamlanan)
    const { data: teachers } = await supabaseClient.from('profiles').select('id').eq('school_id', currentSchoolId).eq('role', 'teacher');
    if(teachers && teachers.length > 0) {
        const tIds = teachers.map(t => t.id);
        const { count: hCount } = await supabaseClient.from('homeworks').select('*', { count: 'exact', head: true }).in('teacher_id', tIds).eq('status', 'Tamamlandı');
        document.getElementById('statHwCount').innerText = hCount || 0;
    }
    
    loadKurumLogs();
}

// ==========================================
// EĞİTMEN YÖNETİMİ
// ==========================================
async function fetchTeachers() {
    const container = document.getElementById('teacherList');
    container.innerHTML = '<div class="col-span-full py-10 text-center animate-pulse font-bold text-slate-400">Eğitmenler Listeleniyor...</div>';

    const { data: teachers, error } = await supabaseClient.from('profiles').select('*').eq('school_id', currentSchoolId).eq('role', 'teacher').order('created_at', { ascending: false });

    if(error || !teachers || teachers.length === 0) {
        container.innerHTML = '<div class="col-span-full py-20 text-center text-slate-400 font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">Henüz kayıtlı eğitmeniniz bulunmuyor.</div>';
        return;
    }

    container.innerHTML = teachers.map(t => `
        <div class="bg-white dark:bg-slate-800 rounded-[35px] p-6 shadow-sm border border-gray-50 dark:border-slate-700 flex flex-col hover:shadow-xl transition-all group relative overflow-hidden">
            <div class="flex items-center gap-4 mb-6">
                <div class="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
                    ${t.full_name[0]}
                </div>
                <div>
                    <h4 class="font-black text-slate-800 dark:text-white leading-tight">${t.full_name}</h4>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${t.email || 'Email Yok'}</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-2 mt-auto">
                <button onclick="resetTeacherPass('${t.id}', '${t.full_name}')" class="py-3 px-2 bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-white transition rounded-xl text-[9px] font-black tracking-widest uppercase">ŞİFRE SIFIRLA</button>
                <button onclick="deleteTeacher('${t.id}', '${t.full_name}')" class="py-3 px-2 bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white transition rounded-xl text-[9px] font-black tracking-widest uppercase text-center flex items-center justify-center">SİL</button>
            </div>
        </div>
    `).join('');
}

window.openAddTeacherModal = () => document.getElementById('addTeacherModal').classList.remove('hidden');
window.closeAddTeacherModal = () => document.getElementById('addTeacherModal').classList.add('hidden');

document.getElementById('newTeacherForm').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = "KAYDEDİLİYOR...";
    btn.disabled = true;

    const name = document.getElementById('regName').value;
    const username = document.getElementById('regUsername').value;
    const pass = document.getElementById('regPassword').value;
    const email = `${username.toLowerCase().replace(/\s+/g, '')}@${currentSchoolId.substring(0,8)}.com`;

    // 1. Auth Kaydı
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({ email, password: pass });
    if(authError) { showToast(authError.message, 'error'); btn.innerText = originalText; btn.disabled = false; return; }

    // 2. Profil Kaydı
    const { error: pError } = await supabaseClient.from('profiles').insert([{
        id: authData.user.id,
        full_name: name,
        email: email,
        role: 'teacher',
        school_id: currentSchoolId,
        created_by: currentSchoolId
    }]);

    if(pError) { showToast(pError.message, 'error'); } 
    else {
        showToast("Eğitmen başarıyla eklendi!", 'success');
        saveKurumLog("Eğitmen Eklendi", `${name} sisteme dahil edildi.`);
        closeAddTeacherModal();
        e.target.reset();
        fetchTeachers();
        fetchStats();
    }
    btn.innerText = originalText;
    btn.disabled = false;
};

window.deleteTeacher = async (id, name) => {
    if(!confirm(`${name} isimli eğitmeni silmek istediğinize emin misiniz?`)) return;
    const { error } = await supabaseClient.from('profiles').delete().eq('id', id);
    if(error) showToast(error.message, 'error');
    else {
        showToast("Eğitmen silindi.", "success");
        saveKurumLog("Eğitmen Silindi", `${name} sistemden kaldırıldı.`);
        fetchTeachers();
        fetchStats();
    }
};

window.resetTeacherPass = async (id, name) => {
    const newPass = prompt(`${name} için yeni şifreyi girin:`);
    if(!newPass) return;
    
    // Auth Update (Server side update should be done via edge functions, but we simulate via patron-like logic if we had service role. 
    // Since we are client-side with anon key, we'll suggest using a specific logic or letting god handle it.)
    // Note: Standard Supabase client can't update another user's password without service role.
    // For SaaS, we will use a dedicated table 'password_resets' which a trigger or edge function monitors.
    // Or, simpler for now:
    const { error } = await supabaseClient.from('password_resets').insert([{
        user_id: id,
        new_password: newPass,
        requested_by: currentSchoolId
    }]);

    if(error) showToast("Hata: " + error.message, "error");
    else showToast("Şifre sıfırlama talebi gönderildi.", "success");
};

// ==========================================
// AYARLAR MOTORU
// ==========================================
document.getElementById('schoolSettingsForm').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('setSchoolName').value;
    const logo = document.getElementById('setSchoolLogo').value;
    
    const { error } = await supabaseClient.from('profiles').update({
        school_name: name,
        school_logo: logo
    }).eq('id', currentSchoolId);

    if (error) showToast(error.message, 'error');
    else {
        showToast("Okul bilgileri güncellendi!", "success");
        currentSchoolName = name;
        document.getElementById('headerSchoolName').innerText = name;
        document.getElementById('previewLogo').src = logo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name);
        saveKurumLog("Okul Ayarları Güncellendi", "İsim/Logo değişikliği yapıldı.");
    }
};

// ==========================================
// LOGLAR VE YARDIMCILAR
// ==========================================
async function saveKurumLog(action, details) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    await supabaseClient.from('audit_logs').insert([{
        user_id: user.id,
        action: action,
        details: `${details} (Kurum: ${currentSchoolName})`,
        created_at: new Date().toISOString()
    }]);
}

async function loadKurumLogs() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    const { data: logs } = await supabaseClient.from('audit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    
    const container = document.getElementById('kurumLogsList');
    if(!logs || logs.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-10">İşlem kaydı bulunmuyor.</p>';
        return;
    }

    container.innerHTML = logs.map(log => `
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
            <div class="flex items-center gap-4">
                <div class="w-2 h-2 rounded-full bg-amber-500"></div>
                <div>
                    <p class="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-tight">${log.action}</p>
                    <p class="text-[10px] text-gray-400 font-bold">${log.details}</p>
                </div>
            </div>
            <span class="text-[9px] font-black text-slate-400">${new Date(log.created_at).toLocaleString('tr-TR')}</span>
        </div>
    `).join('');
}

function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
    toast.className = `${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl font-black text-xs tracking-widest uppercase animate-slideInRight flex items-center gap-3`;
    toast.innerHTML = `<span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('animate-fadeOut'); setTimeout(() => toast.remove(), 500); }, 3000);
}

// Başlat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initKurumPortal);
} else {
    initKurumPortal();
}

// Logout
document.getElementById('logoutBtn').onclick = async () => {
    if(!confirm("Çıkış yapmak istediğinize emin misiniz?")) return;
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
};
