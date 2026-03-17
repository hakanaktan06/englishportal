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
    if(sidebarMain) sidebarMain.classList.toggle('-translate-x-full');
    if(sideOverlay) sideOverlay.classList.toggle('hidden');
}

if(sideOpenBtn) sideOpenBtn.addEventListener('click', toggleMobileSidebar);
if(sideCloseBtn) sideCloseBtn.addEventListener('click', toggleMobileSidebar);
if(sideOverlay) sideOverlay.addEventListener('click', toggleMobileSidebar);

// ==========================================
// UI ULTRA: ŞIK BİLDİRİM VE ONAY MOTORU
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-500' : (type === 'error' ? 'bg-rose-500' : 'bg-amber-500');
    
    const iconSvg = type === 'success' 
        ? `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>` 
        : `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;

    toast.className = `${bgColor} text-white px-5 py-3.5 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0 border border-white/20`;
    toast.innerHTML = `<span class="flex-shrink-0">${iconSvg}</span> <span>${message}</span>`;
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

        if(!modal) { resolve(confirm(message)); return; }

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
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) { window.location.href = 'index.html'; return; } 
    
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'god') {
        window.location.href = 'index.html';
        return;
    }
    fetchSystemData();
}
checkGodSecurity();

document.getElementById('godLogoutBtn').addEventListener('click', async () => {
    const onay = await customConfirm("God Panelden çıkış yapıyorsun. Emin misin?", "Evet, Çık");
    if(onay) {
        await supabaseClient.auth.signOut();
        window.location.href = 'index.html';
    }
});

// ==========================================
// SİSTEMİ TARAMA VE LİSTELEME
// ==========================================
let allTeachersData = []; 

async function fetchSystemData() {
    // 🌟 premium_until kolonunu da çekiyoruz!
    const { data: teachers, error: tErr } = await supabaseClient.from('profiles').select('id, full_name, is_premium, premium_until, created_at').eq('role', 'teacher').order('created_at', { ascending: false });
    const { data: allStudents } = await supabaseClient.from('profiles').select('id, teacher_id').eq('role', 'student');

    const tbody = document.getElementById('teachersList');
    if(tErr || !teachers) { tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-rose-500">Veri çekilemedi!</td></tr>'; return; }

    allTeachersData = teachers;
    document.getElementById('statTotalTeachers').innerText = teachers.length;
    document.getElementById('statTotalStudents').innerText = allStudents ? allStudents.length : 0;

    if (teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-10 text-center text-slate-500 font-medium">Sistemde henüz kayıtlı öğretmen yok.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    const today = new Date();

    teachers.forEach(teacher => {
        const studentCount = allStudents ? allStudents.filter(s => s.teacher_id === teacher.id).length : 0;
        
        let isPremium = teacher.is_premium;
        let badgeText = "FREEMIUM";
        let badgeClass = "bg-slate-800 text-slate-400 border-slate-700";
        let dateInfo = "-";

        // Süre kontrolü
        if (isPremium && teacher.premium_until) {
            const expiry = new Date(teacher.premium_until);
            if (today > expiry) {
                isPremium = false; // SÜRE BİTMİŞ!
                badgeText = "SÜRESİ BİTTİ";
                badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                dateInfo = `<span class="text-rose-500">${expiry.toLocaleDateString('tr-TR')}</span>`;
            } else {
                badgeText = "PREMİUM";
                badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                const diffTime = Math.abs(expiry - today);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                dateInfo = diffDays > 3000 ? "Sınırsız" : expiry.toLocaleDateString('tr-TR') + ` <span class="text-slate-500 text-[10px]">(${diffDays} gün)</span>`;
            }
        } else if (isPremium) {
            badgeText = "PREMİUM";
            badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            dateInfo = "Sınırsız";
        }

        const statusBadge = `<div class="flex flex-col items-center gap-1"><span class="px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${badgeClass}">${badgeText}</span><span class="text-[10px] font-bold text-slate-400">${dateInfo}</span></div>`;

        const actionBtn = isPremium
            ? `<button onclick="revokePremium('${teacher.id}')" class="text-[10px] md:text-xs bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 px-3 py-2 rounded-xl font-bold transition">Yetkiyi İptal Et</button>`
            : `<button onclick="openPremiumModal('${teacher.id}', '${teacher.full_name.replace(/'/g, "\\'")}')" class="text-[10px] md:text-xs bg-amber-500 hover:bg-amber-400 text-black px-3 py-2 rounded-xl font-black shadow-[0_0_15px_rgba(245,158,11,0.3)] transition transform active:scale-95 flex items-center gap-1 ml-auto">YETKİ VER <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg></button>`;

        tbody.innerHTML += `
            <tr class="hover:bg-slate-800/50 transition border-b border-slate-800/50">
                <td class="p-3 md:p-4"><p class="text-sm md:text-base font-black text-white">${teacher.full_name}</p></td>
                <td class="p-3 md:p-4 text-center text-sm font-bold text-blue-400">${studentCount}</td>
                <td class="p-3 md:p-4 text-center">${statusBadge}</td>
                <td class="p-3 md:p-4 text-right flex items-center justify-end gap-2">
                    ${actionBtn}
                    <button onclick="deleteTeacher('${teacher.id}', '${teacher.full_name.replace(/'/g, "\\'")}')" class="bg-slate-800 hover:bg-rose-500 text-slate-500 hover:text-white p-2 rounded-xl transition border border-slate-700 hover:border-rose-500" title="Öğretmeni Sistemden Sil"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </td>
            </tr>`;
    });
}

// ==========================================
// YENİ PREMİUM SÜRE MOTORU
// ==========================================
let targetTeacherForPremium = null;

window.openPremiumModal = function(teacherId, teacherName) {
    targetTeacherForPremium = teacherId;
    document.getElementById('premiumDurationTeacherName').innerText = teacherName;
    const modal = document.getElementById('premiumDurationModal');
    const box = document.getElementById('premiumDurationBox');
    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); box.classList.remove('scale-95'); }, 10);
}

window.closePremiumModal = function() {
    const modal = document.getElementById('premiumDurationModal');
    const box = document.getElementById('premiumDurationBox');
    modal.classList.add('opacity-0'); box.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

window.applyPremium = async function(days) {
    closePremiumModal();
    showToast("Abonelik aktifleştiriliyor...", "info");

    let expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    const dateStr = expiryDate.toISOString().split('T')[0]; 

    const { error } = await supabaseClient.from('profiles').update({ 
        is_premium: true, 
        premium_until: dateStr 
    }).eq('id', targetTeacherForPremium);

    if (error) {
        showToast("Hata: " + error.message, "error");
    } else {
        showToast("VIP Abonelik Başarıyla Tanımlandı! 💸", "success");
        fetchSystemData(); 
    }
}

window.revokePremium = async function(teacherId) {
    const onay = await customConfirm("Öğretmenin Premium yetkisini iptal ediyorsun. Emin misin?", "Evet, İptal Et");
    if (!onay) return;
    showToast("Yetki alınıyor...", "info");
    const { error } = await supabaseClient.from('profiles').update({ 
        is_premium: false, 
        premium_until: null 
    }).eq('id', teacherId);

    if (!error) { showToast("Premium yetkisi alındı.", "success"); fetchSystemData(); }
}

// ==========================================
// HOCA SİLME MOTORU
// ==========================================
window.deleteTeacher = async function(teacherId, teacherName) {
    const onay = await customConfirm(`DİKKAT! ${teacherName} isimli öğretmeni siliyorsun. Tüm öğrencileri ve verileri de gidebilir. Emin misin?`, "Evet, Acımam Sil");
    if (!onay) return;

    showToast("Öğretmen siliniyor...", "info");
    const { error } = await supabaseClient.from('profiles').delete().eq('id', teacherId);
    
    if (error) showToast("Hata: " + error.message, "error");
    else {
        showToast("Öğretmen sistemden kazındı!", "success");
        fetchSystemData();
    }
}

// VIP Fiyatları ve Linkleri Çek
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
        } catch(e) {}
    }
}
loadVipData();

// VIP Fiyatları ve Linkleri Kaydet
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
    
    if(error) showToast("Hata oluştu!", "error");
    else showToast("Fiyatlar ve Linkler Sisteme İşlendi!", "success");
});



// ==========================================
// YAPAY ZEKA API KEY YÖNETİM MOTORU
// ==========================================
async function loadApiKey() {
    const { data, error } = await supabaseClient.from('profiles').select('openai_key').eq('role', 'god').single();
    if (data && data.openai_key) {
        document.getElementById('godApiKey').value = data.openai_key;
    }
}
loadApiKey();

window.toggleApiKeyVisibility = function() {
    const input = document.getElementById('godApiKey');
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
};

const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', async () => {
        const key = document.getElementById('godApiKey').value.trim();
        
        if(!key || !key.startsWith('sk-')) { 
            showToast("Lütfen 'sk-' ile başlayan geçerli bir OpenAI şifresi girin!", "error"); 
            return; 
        }
        
        showToast("Şifre sisteme gömülüyor...", "info");
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { error } = await supabaseClient.from('profiles').update({ openai_key: key }).eq('id', user.id);
        
        if(error) {
            showToast("Kaydetme Hatası: " + error.message, "error");
        } else {
            showToast("Yapay Zeka Motoru Aktif! Şifre başarıyla kaydedildi. 🚀", "success");
        }
    });
}

// ==========================================
// DUYURU YAYIN MOTORU
// ==========================================
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
// ÖĞRETMEN YÖNETİM MOTORU (ULTRA-ESTETİK DİNAMİK KARTLAR)
// ==========================================
async function fetchTeachers() {
    const listContainer = document.getElementById('teacherList');
    if (!listContainer) return;

    listContainer.innerHTML = '<p class="text-slate-400 text-sm animate-pulse col-span-full text-center py-5">Öğretmenler yükleniyor...</p>';

    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('role', 'teacher')
        .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
        listContainer.innerHTML = '<div class="col-span-full text-center p-8 text-slate-500 font-bold border border-dashed border-slate-700 rounded-2xl">Sistemde henüz kayıtlı öğretmen bulunmuyor.</div>';
        return;
    }

    listContainer.innerHTML = '';

    data.forEach(teacher => {
        let isVip = teacher.is_premium;
        let badgeHtml = "";

        if (isVip && teacher.premium_until) {
            const expiryDate = new Date(teacher.premium_until);
            const today = new Date();
            
            if (today > expiryDate) {
                isVip = false; 
                badgeHtml = `<span class="bg-slate-700/50 text-slate-400 border border-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Süresi Bitti</span>`;
            } else {
                const expiryText = expiryDate.toLocaleDateString('tr-TR');
                badgeHtml = `<div class="text-right">
                                <span class="bg-amber-500/20 text-amber-500 border border-amber-500/50 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.2)] block mb-1">VIP AKTİF</span>
                                <span class="text-[9px] text-amber-500/70 font-bold block tracking-widest">SON: ${expiryText}</span>
                             </div>`;
            }
        } else {
            badgeHtml = `<span class="bg-slate-700/50 text-slate-400 border border-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Standart</span>`;
        }

        const avatarColor = isVip ? 'from-amber-400 to-orange-500' : 'from-indigo-500 to-purple-600';

        let actionUI = "";
        if (isVip) {
            actionUI = `
                <div class="bg-slate-900/60 p-1.5 rounded-[14px] border border-slate-700/50 flex items-center justify-between mb-3 shadow-inner">
                    <button onclick="updateTeacherVip('${teacher.id}', -1)" class="flex-1 py-2 text-[11px] font-black text-rose-400 hover:bg-rose-500/20 rounded-lg transition">-1 AY</button>
                    <div class="w-px h-5 bg-slate-700/50 mx-1"></div>
                    <button onclick="updateTeacherVip('${teacher.id}', 1)" class="flex-1 py-2 text-[11px] font-black text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition">+1 AY</button>
                    <div class="w-px h-5 bg-slate-700/50 mx-1"></div>
                    <button onclick="updateTeacherVip('${teacher.id}', 3)" class="flex-1 py-2 text-[11px] font-black text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition">+3 AY</button>
                    <div class="w-px h-5 bg-slate-700/50 mx-1"></div>
                    <button onclick="updateTeacherVip('${teacher.id}', 12)" class="flex-1 py-2 text-[11px] font-black text-purple-400 hover:bg-purple-500/20 rounded-lg transition">+1 YIL</button>
                </div>
                <div class="flex gap-3">
                    <button onclick="updateTeacherVip('${teacher.id}', 0)" class="flex-1 bg-slate-900/40 hover:bg-slate-800 text-slate-400 border border-slate-700/50 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition">VIP İPTAL ET</button>
                    <button onclick="deleteTeacher('${teacher.id}')" class="w-12 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition" title="Öğretmeni Sil">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;
        } else {
            actionUI = `
                <div class="bg-slate-900/60 p-1.5 rounded-[14px] border border-slate-700/50 flex items-center justify-between mb-3 shadow-inner">
                    <button onclick="updateTeacherVip('${teacher.id}', 1)" class="flex-1 py-2.5 text-[11px] font-black text-amber-500 hover:bg-amber-500/20 rounded-lg transition">+1 AY VIP</button>
                    <div class="w-px h-5 bg-slate-700/50 mx-1"></div>
                    <button onclick="updateTeacherVip('${teacher.id}', 3)" class="flex-1 py-2.5 text-[11px] font-black text-orange-500 hover:bg-orange-500/20 rounded-lg transition">+3 AY VIP</button>
                    <div class="w-px h-5 bg-slate-700/50 mx-1"></div>
                    <button onclick="updateTeacherVip('${teacher.id}', 12)" class="flex-1 py-2.5 text-[11px] font-black text-purple-400 hover:bg-purple-500/20 rounded-lg transition">+1 YIL VIP</button>
                </div>
                <div class="flex justify-end">
                    <button onclick="deleteTeacher('${teacher.id}')" class="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20 transition" title="Öğretmeni Sil">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Öğretmeni Sistemden Sil
                    </button>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = "bg-slate-800/40 border border-slate-700/50 p-5 rounded-[24px] flex flex-col gap-4 hover:border-indigo-500/50 transition-colors relative overflow-hidden shadow-sm";
        
        card.innerHTML = `
            ${isVip ? '<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>' : ''}
            <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0 border border-white/10">
                        ${teacher.full_name ? teacher.full_name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <h4 class="font-black text-white text-base leading-tight">${teacher.full_name || 'İsimsiz'}</h4>
                        <p class="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Kayıt: ${new Date(teacher.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                </div>
                <div class="shrink-0">${badgeHtml}</div>
            </div>
            
            <div class="mt-auto border-t border-slate-700/50 pt-4">
                ${actionUI}
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// VIP TEK TIKLA GÜNCELLEME MOTORU
window.updateTeacherVip = async function(id, months) {
    let msg = "";
    if (months === 0) msg = "Bu öğretmenin VIP paketini tamamen iptal edip Freemium'a düşürmek istediğine emin misin?";
    else if (months < 0) msg = `Öğretmenin süresinden ${Math.abs(months)} ay silmek istediğinize emin misiniz?`;
    else msg = `Öğretmene ${months} aylık VIP tanımlamak istediğine emin misin?`;

    const isConfirmed = confirm(msg);
    if(!isConfirmed) return;

    if (typeof showToast === "function") showToast("İşleniyor...", "info");

    if (months === 0) {
        const { error } = await supabaseClient.from('profiles').update({ is_premium: false, premium_until: null }).eq('id', id);
        if (error) { if (typeof showToast === "function") showToast("Hata oluştu!", "error"); } 
        else { if (typeof showToast === "function") showToast("Öğretmen Freemium'a düşürüldü.", "success"); fetchTeachers(); }
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
            if (typeof showToast === "function") showToast("Süre bittiği için öğretmen Freemium'a düşürüldü.", "success");
            fetchTeachers();
            return;
        }

        const expiryStr = baseDate.toISOString();
        const { error } = await supabaseClient.from('profiles').update({ is_premium: true, premium_until: expiryStr }).eq('id', id);
        
        if (error) { if (typeof showToast === "function") showToast("Hata oluştu!", "error"); } 
        else {
            const toastMsg = months > 0 ? `+${months} Ay eklendi!` : `${months} Ay silindi!`;
            if (typeof showToast === "function") showToast(toastMsg, "success");
            fetchTeachers();
        }
    }
}

// Öğretmeni Sil
window.deleteTeacher = async function(id) {
    const isConfirmed = confirm("Bu öğretmeni tamamen silmek istediğine emin misin? (Geri dönüşü yoktur)");
    if (!isConfirmed) return;
    
    const { error } = await supabaseClient.from('profiles').delete().eq('id', id);
    if (error) { if (typeof showToast === "function") showToast("Silinirken hata oluştu!", "error"); } 
    else { if (typeof showToast === "function") showToast("Öğretmen başarıyla silindi.", "success"); fetchTeachers(); }
}

// Sayfa yüklendiğinde motoru ateşle!
document.addEventListener('DOMContentLoaded', fetchTeachers);
fetchTeachers();


