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

// ==========================================
// VIP FİYAT YÖNETİM MOTORU (3'LÜ PAKET)
// ==========================================
async function loadVipPrice() {
    const { data } = await supabaseClient.from('profiles').select('vip_price').eq('role', 'god').single();
    if(data && data.vip_price) {
        try {
            const prices = JSON.parse(data.vip_price);
            document.getElementById('vipPrice1').value = prices.p1 || '';
            document.getElementById('vipPrice3').value = prices.p3 || '';
            document.getElementById('vipPrice12').value = prices.p12 || '';
        } catch(e) { console.log("İlk kurulum"); }
    }
}
loadVipPrice();

document.getElementById('savePriceBtn').addEventListener('click', async () => {
    const p1 = document.getElementById('vipPrice1').value.trim();
    const p3 = document.getElementById('vipPrice3').value.trim();
    const p12 = document.getElementById('vipPrice12').value.trim();
    
    if(!p1 || !p3 || !p12) { showToast("Tüm paket fiyatlarını doldurmalısın!", "error"); return; }
    
    const priceJson = JSON.stringify({ p1: p1, p3: p3, p12: p12 }); // Paketledik
    
    showToast("Fiyatlar güncelleniyor...", "info");
    const { error } = await supabaseClient.from('profiles').update({ vip_price: priceJson }).eq('role', 'god');
    
    if(error) showToast("Hata: " + error.message, "error");
    else showToast("Fiyatlar başarıyla güncellendi! 💸", "success");
});
