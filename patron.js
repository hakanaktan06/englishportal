// ==========================================
// 1. SUPABASE BAĞLANTISI
// ==========================================
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// MOBİL MENÜ KONTROLÜ
// ==========================================
const sidebarMain = document.getElementById('mainSidebar');
const sideOverlay = document.getElementById('sidebarOverlay');
const sideOpenBtn = document.getElementById('openSidebarBtn');
const sideCloseBtn = document.getElementById('closeSidebarBtn');

function toggleMobileSidebar() {
    if (sidebarMain) sidebarMain.classList.toggle('-translate-x-full');
    if (sideOverlay) sideOverlay.classList.toggle('hidden');
}

if (sideOpenBtn) sideOpenBtn.addEventListener('click', toggleMobileSidebar);
if (sideCloseBtn) sideCloseBtn.addEventListener('click', toggleMobileSidebar);
if (sideOverlay) sideOverlay.addEventListener('click', toggleMobileSidebar);

// XSS KORUMASI
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, function (tag) {
        const charsToReplace = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
        return charsToReplace[tag] || tag;
    });
}

// ==========================================
// UI ULTRA: ŞIK BİLDİRİM VE ONAY MOTORU
// ==========================================
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-500' : (type === 'error' ? 'bg-rose-500' : 'bg-amber-500');

    const iconSvg = type === 'success'
        ? `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
        : `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

    toast.className = `${bgColor} text-white px-5 py-3.5 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0 border border-white/20`;
    toast.innerHTML = `<span class="flex-shrink-0">${iconSvg}</span> <span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function customConfirm(message, btnText = "Evet, Onayla") {
    return new Promise((resolve) => {
        const modal = document.getElementById('customConfirmModal');
        const box = document.getElementById('customConfirmBox');
        const btnOk = document.getElementById('customConfirmOk');
        const btnCancel = document.getElementById('customConfirmCancel');

        if (!modal) { resolve(confirm(message)); return; }

        document.getElementById('customConfirmMessage').innerText = message;
        btnOk.innerText = btnText;

        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); box.classList.remove('scale-95'); }, 10);

        const cleanup = () => {
            modal.classList.add('opacity-0'); box.classList.add('scale-95');
            setTimeout(() => modal.classList.add('hidden'), 300);
            btnOk.replaceWith(btnOk.cloneNode(true));
            btnCancel.replaceWith(btnCancel.cloneNode(true));
        };

        document.getElementById('customConfirmOk').addEventListener('click', () => { cleanup(); resolve(true); });
        document.getElementById('customConfirmCancel').addEventListener('click', () => { cleanup(); resolve(false); });
    });
}

// ==========================================
// GÜVENLİK VE ÇIKIŞ
// ==========================================
async function checkGodSecurity() {
    // 🌟 REDIRECT LOOP BREAK: Sayfa açılırken 700ms bekle (Supabase uyanışı için)
    await new Promise(r => setTimeout(r, 700));

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) { window.location.href = 'index.html'; return; }

    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'god') {
        window.location.href = 'index.html';
        return;
    }
    fetchGodMetrics();
    fetchTeachers();
}
checkGodSecurity();

document.getElementById('godLogoutBtn').addEventListener('click', async () => {
    const onay = await customConfirm("God Panel oturumunu sonlandırmak istediğinizi onaylıyor musunuz?", "Evet, Çıkış Yap");
    if (onay) {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    }
});

// ==========================================
// GOD PANEL METRİKLERİ (TÜM SİSTEM)
// ==========================================
async function fetchGodMetrics() {
    // 1. Toplam Öğrenci Sayısı
    const { count: studentCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
    document.getElementById('godStatStudents').innerText = studentCount || 0;

    // 2. Toplam Kurum Sayısı
    const { count: kurumCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'kurum');
    document.getElementById('godStatKurum').innerText = kurumCount || 0;

    // 3. Toplam Eğitmen Sayısı
    const { count: teacherCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
    document.getElementById('godStatTeachers').innerText = teacherCount || 0;

    // 4. Sistemdeki Toplam Borç
    const { data: unpaidLessons } = await supabaseClient.from('private_lessons').select('price').eq('is_paid', false);
    let totalDebt = 0;
    if (unpaidLessons) {
        unpaidLessons.forEach(l => totalDebt += Number(l.price || 0));
    }
    document.getElementById('godStatDebt').innerText = "₺" + totalDebt.toLocaleString('tr-TR');
}


// ==========================================
// ÖĞRETMEN YÖNETİM MOTORU VE GÖRÜNMEZ RADAR
// ==========================================
function timeAgo(dateString) {
    if (!dateString) return "<span class='text-slate-500'>Hiç giriş yapmadı</span>";
    const diff = new Date() - new Date(dateString);
    const minutes = Math.floor(diff / 60000);

    if (minutes < 5) return "<span class='text-emerald-400 font-black animate-pulse text-[10px] uppercase'>Çevrimiçi</span>";
    if (minutes < 60) return `<span class='text-amber-400'>${minutes} dk önce</span>`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `<span class='text-slate-300'>${hours} saat önce</span>`;
    return `<span class='text-slate-400'>${Math.floor(hours / 24)} gün önce</span>`;
}

// ==========================================
// SEKMELER ARASI GEÇİŞ (GOD STİLE)
// ==========================================
const sections = {
    teachers: document.getElementById('teacherList').parentElement,
    kurum: document.getElementById('section-kurum')
};

function switchTab(target) {
    for (const key in sections) {
        if(sections[key]) sections[key].classList.add('hidden');
    }
    if(sections[target]) sections[target].classList.remove('hidden');

    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('bg-amber-500/10', 'text-amber-500', 'border-amber-500/20', 'active-menu'));
    const activeBtn = document.getElementById(`btn-${target}`);
    if(activeBtn) activeBtn.classList.add('bg-amber-500/10', 'text-amber-500', 'border-amber-500/20', 'active-menu');

    if(target === 'teachers') fetchTeachers();
    if(target === 'kurum') fetchKurumlar();
}

document.getElementById('btn-teachers').onclick = (e) => { e.preventDefault(); switchTab('teachers'); };
document.getElementById('btn-kurum').onclick = (e) => { e.preventDefault(); switchTab('kurum'); };

async function fetchTeachers() {
    const listContainer = document.getElementById('teacherList');
    if (!listContainer) return;

    listContainer.innerHTML = '<p class="text-slate-400 text-sm animate-pulse col-span-full text-center py-5">Öğretmen radarı ve istihbarat verileri taranıyor...</p>';

    const { data: teachers, error } = await supabaseClient.from('profiles').select('*, last_login, announcement').eq('role', 'teacher').order('created_at', { ascending: false });
    const { data: allStudents } = await supabaseClient.from('profiles').select('id, teacher_id').eq('role', 'student');
    const { data: unpaidLessons } = await supabaseClient.from('private_lessons').select('teacher_id, price').eq('is_paid', false);

    if (error || !teachers || teachers.length === 0) {
        listContainer.innerHTML = '<div class="col-span-full text-center p-8 text-slate-500 font-bold border border-dashed border-slate-700 rounded-2xl">Sistemde henüz kayıtlı öğretmen bulunmuyor.</div>';
        const godStat = document.getElementById('godStatTeachers'); if (godStat) godStat.innerText = "0";
        return;
    }

    const godStat = document.getElementById('godStatTeachers'); if (godStat) godStat.innerText = teachers.length;
    listContainer.innerHTML = '';

    teachers.forEach(teacher => {
        const myStudentsCount = allStudents ? allStudents.filter(s => s.teacher_id === teacher.id).length : 0;
        let myUnpaidDebt = 0;
        if (unpaidLessons) unpaidLessons.filter(l => l.teacher_id === teacher.id).forEach(l => myUnpaidDebt += Number(l.price || 0));

        let isVip = teacher.is_premium;
        let badgeHtml = "";

        if (isVip && teacher.premium_until) {
            const expiryDate = new Date(teacher.premium_until);
            if (new Date() > expiryDate) {
                isVip = false;
                badgeHtml = `<div class="flex flex-col items-end"><span class="bg-slate-700/50 text-slate-400 border border-slate-600 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Süresi Bitti</span></div>`;
            } else {
                badgeHtml = `<div class="flex flex-col items-end"><span class="bg-amber-500/20 text-amber-500 border border-amber-500/50 px-2 py-1 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.2)] mb-1 whitespace-nowrap">VIP AKTİF</span><span class="text-[8px] md:text-[9px] text-amber-500/70 font-bold tracking-widest whitespace-nowrap">SON: ${expiryDate.toLocaleDateString('tr-TR')}</span></div>`;
            }
        } else {
            badgeHtml = `<div class="flex flex-col items-end"><span class="bg-slate-700/50 text-slate-400 border border-slate-600 px-2 py-1 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Standart</span></div>`;
        }

        const avatarColor = isVip ? 'from-amber-400 to-orange-500' : 'from-indigo-500 to-purple-600';
        const radarStatus = timeAgo(teacher.last_login);

        let actionUI = isVip ? `
            <div class="bg-slate-900/60 p-1.5 rounded-[14px] border border-slate-700/50 flex items-center justify-between mb-3 shadow-inner">
                <button onclick="updateTeacherVip('${teacher.id}', -1)" class="flex-1 py-2 text-[11px] font-black text-rose-400 hover:bg-rose-500/20 rounded-lg transition">-1 AY</button><div class="w-px h-5 bg-slate-700/50 mx-1"></div><button onclick="updateTeacherVip('${teacher.id}', 1)" class="flex-1 py-2 text-[11px] font-black text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition">+1 AY</button><div class="w-px h-5 bg-slate-700/50 mx-1"></div><button onclick="updateTeacherVip('${teacher.id}', 3)" class="flex-1 py-2 text-[11px] font-black text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition">+3 AY</button><div class="w-px h-5 bg-slate-700/50 mx-1"></div><button onclick="updateTeacherVip('${teacher.id}', 12)" class="flex-1 py-2 text-[11px] font-black text-purple-400 hover:bg-purple-500/20 rounded-lg transition">+1 YIL</button>
            </div>
            <div class="flex gap-3">
                <button onclick="updateTeacherVip('${teacher.id}', 0)" class="flex-1 bg-slate-900/40 hover:bg-slate-800 text-slate-400 border border-slate-700/50 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition">VIP İPTAL ET</button>
                <button onclick="resetTeacherPassword('${teacher.id}')" class="w-12 flex items-center justify-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/20 transition" title="Şifreyi Sıfırla"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-3l8.44-8.44A6 6 0 0115 7h0z"></path></svg></button>
                <button onclick="deleteTeacher('${teacher.id}')" class="w-12 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition" title="Öğretmeni Sil"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
            </div>` : `
            <div class="bg-slate-900/60 p-1.5 rounded-[14px] border border-slate-700/50 flex items-center justify-between mb-3 shadow-inner">
                <button onclick="updateTeacherVip('${teacher.id}', 1)" class="flex-1 py-2.5 text-[11px] font-black text-amber-500 hover:bg-amber-500/20 rounded-lg transition">+1 AY VIP</button><div class="w-px h-5 bg-slate-700/50 mx-1"></div><button onclick="updateTeacherVip('${teacher.id}', 3)" class="flex-1 py-2.5 text-[11px] font-black text-orange-500 hover:bg-orange-500/20 rounded-lg transition">+3 AY VIP</button><div class="w-px h-5 bg-slate-700/50 mx-1"></div><button onclick="updateTeacherVip('${teacher.id}', 12)" class="flex-1 py-2.5 text-[11px] font-black text-purple-400 hover:bg-purple-500/20 rounded-lg transition">+1 YIL VIP</button>
            </div>
            <div class="flex justify-end gap-3">
                <button onclick="resetTeacherPassword('${teacher.id}')" class="flex flex-1 items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 transition" title="Şifreyi Sıfırla"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-3l8.44-8.44A6 6 0 0115 7h0z"></path></svg> Şifreyi Sıfırla</button>
                <button onclick="deleteTeacher('${teacher.id}')" class="flex flex-1 items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20 transition" title="Öğretmeni Sil"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> Sistemi Kapat</button>
            </div>`;

        const currentPersonalMsg = teacher.announcement || '';
        const personalMsgUI = `
            <div class="mt-4 border-t border-slate-700/50 pt-4">
                <label class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Bu Hocaya Özel Bildirim Gönder</label>
                <div class="flex gap-2">
                    <input type="text" id="ann_${teacher.id}" value="${escapeHTML(currentPersonalMsg)}" class="w-full bg-slate-900 border border-slate-700 text-xs px-3 py-2 rounded-lg text-white outline-none focus:border-indigo-500 placeholder-slate-600" placeholder="Örn: Hocam süreniz bitiyor...">
                    <button onclick="sendPersonalMessage('${teacher.id}')" class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase transition shrink-0 shadow-sm flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg> İLET</button>
                </div>
            </div>`;

        const card = document.createElement('div');
        card.className = "bg-slate-800/40 border border-slate-700/50 p-5 rounded-[24px] flex flex-col gap-4 hover:border-indigo-500/50 transition-colors relative overflow-hidden shadow-sm";

        card.innerHTML = `
            ${isVip ? '<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>' : ''}
            <div class="flex justify-between items-start gap-2 mb-2">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0 border border-white/10">${teacher.full_name ? escapeHTML(teacher.full_name.charAt(0).toUpperCase()) : '?'}</div>
                    <div class="min-w-0">
                        <h4 class="font-black text-white text-base leading-tight truncate">${teacher.full_name ? escapeHTML(teacher.full_name) : 'İsimsiz'}</h4>
                        <p class="text-[10px] text-indigo-400 font-bold truncate lowercase mt-0.5">${teacher.email ? escapeHTML(teacher.email) : 'Mail Yok'}</p>
                        <p class="text-[9px] text-slate-400 mt-1 font-bold flex items-center gap-1 truncate"><svg class="w-3 h-3 text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> ${radarStatus}</p>
                    </div>
                </div>
                <div class="shrink-0 text-right">${badgeHtml}</div>
            </div>
            <div class="flex flex-wrap gap-2 mb-1">
                <span class="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> ${myStudentsCount} Öğrenci</span>
                <span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ₺${myUnpaidDebt} Alacak</span>
            </div>
            <div class="mt-auto border-t border-slate-700/50 pt-4">${actionUI}${personalMsgUI}</div>
        `;
        listContainer.appendChild(card);
    });
}



// VIP KURUMSAL GÜNCELLEME MOTORU
window.updateTeacherVip = async function (id, months) {
    let msg = "";
    if (months === 0) msg = "Öğretmenin VIP yetkisini iptal etmek ve standart pakete geçirmek istediğinizi onaylıyor musunuz?";
    else if (months < 0) msg = `Öğretmenin VIP aboneliğinden ${Math.abs(months)} ay eksiltilecektir. Onaylıyor musunuz?`;
    else msg = `Öğretmen hesabına ${months} aylık Premium VIP yetkisi tanımlanacaktır. Onaylıyor musunuz?`;

    const isConfirmed = await customConfirm(msg, "Evet, Onayla");
    if (!isConfirmed) return;

    if (typeof showToast === "function") showToast("İşlem başlatıldı...", "info");

    if (months === 0) {
        const { error } = await supabaseClient.from('profiles').update({ is_premium: false, premium_until: null }).eq('id', id);
        if (error) { if (typeof showToast === "function") showToast("Sistem hatası oluştu.", "error"); }
        else { if (typeof showToast === "function") showToast("Hesap standart pakete güncellendi.", "success"); fetchTeachers(); }
    } else {
        const { data: t } = await supabaseClient.from('profiles').select('premium_until').eq('id', id).single();
        let baseDate = new Date();

        if (t && t.premium_until) {
            const currentExpiry = new Date(t.premium_until);
            if (currentExpiry > baseDate) baseDate = currentExpiry;
        }

        baseDate.setMonth(baseDate.getMonth() + months);

        if (baseDate <= new Date()) {
            await supabaseClient.from('profiles').update({ is_premium: false, premium_until: null }).eq('id', id);
            if (typeof showToast === "function") showToast("Süre sona erdiği için hesap standart pakete alındı.", "success");
            fetchTeachers();
            return;
        }

        const expiryStr = baseDate.toISOString();
        const { error } = await supabaseClient.from('profiles').update({ is_premium: true, premium_until: expiryStr }).eq('id', id);

        if (error) { if (typeof showToast === "function") showToast("Sistem hatası oluştu.", "error"); }
        else {
            const toastMsg = months > 0 ? `Premium süre ${months} ay uzatıldı.` : `Premium süre ${Math.abs(months)} ay kısaltıldı.`;
            if (typeof showToast === "function") showToast(toastMsg, "success");
            fetchTeachers();
        }
    }
}

// 🌟 YENİ: KİŞİYE ÖZEL MESAJ MOTORU 🌟
window.sendPersonalMessage = async function (teacherId) {
    const inputEl = document.getElementById(`ann_${teacherId}`);
    if (!inputEl) return;
    const msg = inputEl.value;

    showToast("Özel mesaj iletiliyor...", "info");
    const { error } = await supabaseClient.from('profiles').update({ announcement: msg }).eq('id', teacherId);

    if (error) {
        showToast("Mesaj gönderilemedi: " + error.message, "error");
    } else {
        showToast(msg === "" ? "Hocanın özel mesajı kaldırıldı." : "Özel mesaj hocanın paneline başarıyla sabitlendi!", "success");
    }
};

// KURUMSAL SİLME MOTORU
window.deleteTeacher = async function (id) {
    const isConfirmed = await customConfirm("Öğretmen kaydını sistemden kalıcı olarak silmek istediğinizi onaylıyor musunuz? Bu işlem geri alınamaz.", "Kalıcı Olarak Sil");
    if (!isConfirmed) return;

    const { error } = await supabaseClient.from('profiles').delete().eq('id', id);
    if (error) { if (typeof showToast === "function") showToast("Silme işlemi başarısız oldu.", "error"); }
    else { if (typeof showToast === "function") showToast("Öğretmen kaydı başarıyla silindi.", "success"); fetchTeachers(); fetchGodMetrics(); }
}

// ŞİFRE SIFIRLAMA MOTORU
// 🌟 YENİ: GOD PANEL ÖZEL ŞIK ŞİFRE GİRİŞ ARAYÜZÜ 🌟
function godPrompt(title, desc = "", placeholder = "Buraya yazın...") {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = "fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[9999] p-4 opacity-0 transition-all duration-300";

        const box = document.createElement('div');
        // God panel teması: Koyu Slate, Amber/Rose vurgular
        box.className = "bg-slate-900 border border-slate-700 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-[24px] w-full max-w-sm p-6 transform scale-95 transition-all duration-400";

        box.innerHTML = `
            <div class="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/20 rounded-full blur-[40px] pointer-events-none"></div>
            <div class="relative z-10 mb-5">
                <div class="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4 text-amber-400 shadow-inner">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path></svg>
                </div>
                <h3 class="text-xl font-black text-white leading-tight uppercase tracking-wide">${title}</h3>
                ${desc ? `<p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">${desc}</p>` : ''}
            </div>
            <input type="text" class="w-full relative z-10 bg-slate-950/50 border border-slate-700 text-white px-4 py-3.5 rounded-xl focus:outline-none focus:border-amber-500 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] mb-6 font-black tracking-widest placeholder-slate-600 transition" placeholder="${placeholder}" autofocus autocomplete="off">
            <div class="flex gap-3 relative z-10">
                <button id="gpCancel" class="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-black uppercase text-[10px] tracking-widest transition">İptal</button>
                <button id="gpOk" class="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.3)] transition">KİLİDİ AÇ</button>
            </div>
        `;

        modal.appendChild(box);
        document.body.appendChild(modal);

        const input = box.querySelector('input');
        const btnOk = box.querySelector('#gpOk');
        const btnCancel = box.querySelector('#gpCancel');

        setTimeout(() => {
            modal.classList.remove('opacity-0');
            box.classList.remove('scale-95');
            input.focus();
        }, 10);

        const cleanup = (val) => {
            modal.classList.add('opacity-0');
            box.classList.add('scale-95');
            setTimeout(() => { modal.remove(); resolve(val); }, 300);
        };

        btnOk.addEventListener('click', () => cleanup(input.value.trim()));
        btnCancel.addEventListener('click', () => cleanup(null));
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') cleanup(input.value.trim()); if (e.key === 'Escape') cleanup(null); });
    });
}

// ŞİFRE SIFIRLAMA MOTORU
window.resetTeacherPassword = async function (id) {
    const newPassword = await godPrompt("ŞİFREYİ SIFIRLIYORSUNUZ", "Sisteme giriş için yepyeni devasa bir anahtar belirleyin.", "Örn: sifre1234");
    if (!newPassword) return;
    if (newPassword.length < 6) {
        if (typeof showToast === "function") showToast("Hata! Şifre en az 6 karakter olmalıdır.", "error");
        return;
    }

    const onay = await customConfirm(`Öğretmenin şifresini devasa ve yepyeni olan "${newPassword}" olarak değiştirmek istediğinize emin misiniz?`, "Evet, Sistemi Kilidini Aç");
    if (!onay) return;

    if (typeof showToast === "function") showToast("Ağ sistemlerine müdahale ediliyor...", "info");

    try {
        const apiUrl = window.location.protocol === 'file:'
            ? 'https://englishportalvip.vercel.app/api/reset-password' // Yerel test için fallback
            : '/api/reset-password';

        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetUserId: id, newPassword: newPassword })
        });

        let data;
        try {
            data = await res.json();
        } catch (e) {
            throw new Error("Sunucu yanıt veremedi (Vercel API Hatası).");
        }

        if (res.ok && data.success) {
            if (typeof showToast === "function") showToast("Şifre başarıyla güncellendi!", "success");
        } else {
            if (typeof showToast === "function") showToast("Hata: " + (data.error || "Sunucu hatası"), "error");
        }
    } catch (err) {
        if (typeof showToast === "function") showToast("Ağ bağlantısı hatası: Sunucu meşgul.", "error");
    }
}

// ==========================================
// KURUM YÖNETİM MOTORU
// ==========================================
async function fetchKurumlar() {
    const list = document.getElementById('kurumList');
    list.innerHTML = '<p class="col-span-full text-center text-slate-500 py-10 font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Kurumsal Veritabanı Taranıyor...</p>';

    const { data: kurumlar, error } = await supabaseClient.from('profiles').select('*').eq('role', 'kurum').order('created_at', { ascending: false });

    if(error || !kurumlar || kurumlar.length === 0) {
        list.innerHTML = '<p class="col-span-full text-center text-slate-500 py-10">Henüz B2B kayıtlı kurum bulunmuyor.</p>';
        return;
    }

    list.innerHTML = kurumlar.map(k => `
        <div class="bg-slate-800/40 border border-slate-700/50 p-5 rounded-[24px] flex flex-col gap-4 hover:border-amber-500/50 transition-colors relative overflow-hidden shadow-sm">
            <div class="flex justify-between items-start">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                        <img src="${k.school_logo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(k.school_name || k.full_name) + '&background=f59e0b&color=fff'}" class="w-full h-full object-cover rounded-xl">
                    </div>
                    <div>
                        <h4 class="font-black text-white text-base leading-tight">${k.school_name || k.full_name}</h4>
                        <p class="text-[10px] text-amber-500 font-bold uppercase mt-0.5 tracking-tighter">${k.email}</p>
                    </div>
                </div>
            </div>
            
            <div class="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                ${timeAgo(k.last_login)}
            </div>

            <div class="flex gap-2 mt-auto">
                <button onclick="resetTeacherPassword('${k.id}')" class="flex-1 py-3 bg-slate-900 border border-slate-700 text-[9px] font-black uppercase text-slate-400 hover:text-white rounded-xl transition">ŞİFRE</button>
                <button onclick="deleteKurum('${k.id}', '${k.school_name || k.full_name}')" class="flex-1 py-3 bg-rose-500/10 text-[9px] font-black uppercase text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition">SİL</button>
            </div>
        </div>
    `).join('');
}

window.deleteKurum = async (id, name) => {
    const onay = await customConfirm(`"${name}" kurumunu ve bağlı verilerini silmek istediğinize emin misiniz?`, "SİSTEMDEN KALDIR");
    if(!onay) return;
    
    const { error } = await supabaseClient.from('profiles').delete().eq('id', id);
    if(error) showToast(error.message, 'error');
    else {
        showToast("Kurum sistemden kaldırıldı.", "success");
        fetchKurumlar();
        fetchGodMetrics();
    }
};

// ==========================================
// AYAR KAYIT MOTORLARI
// ==========================================
async function loadVipData() {
    const { data } = await supabaseClient.from('profiles').select('vip_price').eq('role', 'god').single();
    if (data && data.vip_price) {
        try {
            const parsed = JSON.parse(data.vip_price);
            document.getElementById('price1').value = parsed.p1 || "";
            document.getElementById('price3').value = parsed.p3 || "";
            document.getElementById('price12').value = parsed.p12 || "";
            document.getElementById('link1').value = parsed.l1 || "";
            document.getElementById('link3').value = parsed.l3 || "";
            document.getElementById('link12').value = parsed.l12 || "";
        } catch (e) { }
    }
}
loadVipData();

document.getElementById('vipPriceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = document.getElementById('price1').value;
    const p3 = document.getElementById('price3').value;
    const p12 = document.getElementById('price12').value;
    const l1 = document.getElementById('link1').value;
    const l3 = document.getElementById('link3').value;
    const l12 = document.getElementById('link12').value;

    const vipData = JSON.stringify({ p1, p3, p12, l1, l3, l12 });

    const { data: { user } } = await supabaseClient.auth.getUser();
    showToast("Güncelleniyor...", "info");
    const { error } = await supabaseClient.from('profiles').update({ vip_price: vipData }).eq('id', user.id);

    if (error) showToast("Hata oluştu!", "error");
    else showToast("Fiyatlar ve Linkler Sisteme İşlendi!", "success");
});

async function loadApiKey() {
    const { data, error } = await supabaseClient.from('profiles').select('openai_key').eq('role', 'god').single();
    if (data && data.openai_key) {
        document.getElementById('openaiKeyInput').value = data.openai_key;
    }
}
loadApiKey();

const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', async () => {
        const key = document.getElementById('openaiKeyInput').value.trim();

        if (!key || !key.startsWith('sk-')) {
            showToast("Lütfen 'sk-' ile başlayan geçerli bir OpenAI şifresi girin!", "error");
            return;
        }
        showToast("Şifre sisteme gömülüyor...", "info");
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { error } = await supabaseClient.from('profiles').update({ openai_key: key }).eq('id', user.id);
        if (error) showToast("Kaydetme Hatası: " + error.message, "error");
        else showToast("Yapay Zeka Motoru Aktif! Şifre başarıyla kaydedildi.", "success");
    });
}

async function loadAnnouncement() {
    const { data } = await supabaseClient.from('profiles').select('announcement').eq('role', 'god').single();
    if (data && data.announcement) document.getElementById('godAnnouncement').value = data.announcement;
}
loadAnnouncement();

const saveAnnouncementBtn = document.getElementById('saveAnnouncementBtn');
if (saveAnnouncementBtn) {
    saveAnnouncementBtn.addEventListener('click', async () => {
        const text = document.getElementById('godAnnouncement').value;
        const { data: { user } } = await supabaseClient.auth.getUser();

        showToast("Yayınlanıyor...", "info");
        const { error } = await supabaseClient.from('profiles').update({ announcement: text }).eq('id', user.id);

        if (error) showToast("Hata: " + error.message, "error");
        else showToast(text.trim() === "" ? "Duyuru kaldırıldı!" : "Duyuru tüm panellere gönderildi!", "success");
    });
}

// ==========================================
// SİSTEMİ BAŞLAT
// ==========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkGodSecurity);
} else {
    checkGodSecurity();
}
