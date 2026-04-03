// ==========================================
// 1. SUPABASE BAĞLANTISI (Sistem Anahtarı)
// ==========================================
var supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
var supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// XSS GÜVENLİK FİLTRESİ (Gümrük Memuru)
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, function (tag) {
        const charsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return charsToReplace[tag] || tag;
    });
}

// ==========================================
// 🌟 RPG SİSTEMİ VERİLERİ (DÜKKAN VE AVATAR) 🌟
// ==========================================
const SHOP_DATA = {
    bases: [
        { id: 0, name: "Kâşif", img: "assets/avatars/base_0_v1.png" },
        { id: 1, name: "Savaşçı", img: "assets/avatars/base_1_v1.png" },
        { id: 2, name: "Büyücü", img: "assets/avatars/base_2_v1.png" },
        { id: 3, name: "Robot", img: "assets/avatars/base_3_v1.png" },
        { id: 4, name: "Ninja", img: "assets/avatars/base_4_v1.png" },
        { id: 5, name: "Kral", img: "assets/avatars/base_5_v1.png" }
    ],
    skins: [
        { id: 101, baseId: 0, img: "assets/avatars/base_0_v1.png" },
        { id: 102, baseId: 0, img: "assets/avatars/base_0_v2.png" },
        { id: 103, baseId: 0, img: "assets/avatars/base_0_v3.png" },
        { id: 104, baseId: 0, img: "assets/avatars/base_0_v4.png" },
        { id: 105, baseId: 0, img: "assets/avatars/base_0_v5.png" },
        { id: 111, baseId: 1, img: "assets/avatars/base_1_v1.png" },
        { id: 112, baseId: 1, img: "assets/avatars/base_1_v2.png" },
        { id: 113, baseId: 1, img: "assets/avatars/base_1_v3.png" },
        { id: 114, baseId: 1, img: "assets/avatars/base_1_v4.png" },
        { id: 115, baseId: 1, img: "assets/avatars/base_1_v5.png" },
        { id: 121, baseId: 2, img: "assets/avatars/base_2_v1.png" },
        { id: 122, baseId: 2, img: "assets/avatars/base_2_v2.png" },
        { id: 123, baseId: 2, img: "assets/avatars/base_2_v3.png" },
        { id: 124, baseId: 2, img: "assets/avatars/base_2_v4.png" },
        { id: 125, baseId: 2, img: "assets/avatars/base_2_v5.png" },
        { id: 131, baseId: 3, img: "assets/avatars/base_3_v1.png" },
        { id: 132, baseId: 3, img: "assets/avatars/base_3_v2.png" },
        { id: 133, baseId: 3, img: "assets/avatars/base_3_v3.png" },
        { id: 134, baseId: 3, img: "assets/avatars/base_3_v4.png" },
        { id: 135, baseId: 3, img: "assets/avatars/base_3_v5.png" },
        { id: 141, baseId: 4, img: "assets/avatars/base_4_v1.png" },
        { id: 142, baseId: 4, img: "assets/avatars/base_4_v2.png" },
        { id: 143, baseId: 4, img: "assets/avatars/base_4_v3.png" },
        { id: 144, baseId: 4, img: "assets/avatars/base_4_v4.png" },
        { id: 145, baseId: 4, img: "assets/avatars/base_4_v5.png" },
        { id: 151, baseId: 5, img: "assets/avatars/base_5_v1.png" },
        { id: 152, baseId: 5, img: "assets/avatars/base_5_v2.png" },
        { id: 153, baseId: 5, img: "assets/avatars/base_5_v3.png" },
        { id: 154, baseId: 5, img: "assets/avatars/base_5_v4.png" },
        { id: 155, baseId: 5, img: "assets/avatars/base_5_v5.png" }
    ],
    pets: [
        { id: 201, img: "assets/avatars/pet_monkey.png" },
        { id: 202, img: "assets/avatars/pet_wolf.png" },
        { id: 203, img: "assets/avatars/pet_owl.png" },
        { id: 204, img: "assets/avatars/pet_drone.png" },
        { id: 205, img: "assets/avatars/pet_panther.png" },
        { id: 206, img: "assets/avatars/pet_eagle.png" }
    ]
};

function getAvatarPreviewHTML(config, sizeClass = "w-12 h-12") {
    if (!config || Object.keys(config).length === 0) return `<div class="${sizeClass} rounded-full bg-indigo-100 flex items-center justify-center text-indigo-400 font-bold shrink-0">?</div>`;

    // Aktif skin veya base görseli
    let skinImg = "";
    if (config.skin && config.skin !== -1) {
        const s = SHOP_DATA.skins.find(x => x.id == config.skin);
        if (s) skinImg = s.img;
    }
    if (!skinImg && config.base !== undefined) {
        const b = SHOP_DATA.bases.find(x => x.id == config.base);
        if (b) skinImg = b.img;
    }

    // Pet görseli
    let petImg = "";
    if (config.pet && config.pet !== -1) {
        const p = SHOP_DATA.pets.find(x => x.id == config.pet);
        if (p) petImg = p.img;
    }

    // Config'i güvenli hale getirmek için Base64 veya Attribute kullanıyoruz.
    // En temizi: dataset üzerinden okumak.
    const configData = encodeURIComponent(JSON.stringify(config));

    return `
        <div class="relative ${sizeClass} shrink-0 group/avatar cursor-zoom-in" 
             data-avatar-config="${configData}"
             onclick="event.stopPropagation(); zoomAvatar(this.dataset.avatarConfig)" 
             title="Yakınlaştır">
            <div class="w-full h-full rounded-full border-2 border-gray-100 p-1 overflow-hidden transition-transform group-hover/avatar:scale-110 shadow-sm" style="background-color: white !important;">
                <img src="${skinImg || 'assets/avatars/base_0_v1.png'}" class="w-full h-full object-contain">
            </div>
            ${petImg ? `
                <div class="absolute -bottom-1 -right-1 w-1/2 h-1/2 rounded-full p-0.5 border border-gray-100 z-10 transition-transform group-hover/avatar:scale-125 shadow-md" style="background-color: white !important;">
                    <img src="${petImg}" class="w-full h-full object-contain animate-float">
                </div>
            ` : ''}
        </div>
    `;
}

// 🌟 AVATAR ZOOM SİSTEMİ 🌟
window.zoomAvatar = function (encodedConfig) {
    try {
        if (!encodedConfig) return;
        const config = JSON.parse(decodeURIComponent(encodedConfig));
        const modal = document.getElementById('avatarZoomModal');
        const content = document.getElementById('avatarZoomContent');

        if (!modal || !content) return;

        // Büyük hali için HTML üret (Zoom modunda tıklanabilirliği kaldırıyoruz)
        const zoomedHTML = getAvatarPreviewHTML(config, "w-64 h-64 md:w-80 md:h-80")
            .replace('cursor-zoom-in', '')
            .replace('onclick="event.stopPropagation(); zoomAvatar(this.dataset.avatarConfig)"', 'onclick=""');

        content.innerHTML = zoomedHTML;

        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0', 'scale-95');
        }, 10);
    } catch (e) {
        console.error("Avatar Zoom Hatası:", e);
    }
}

window.closeAvatarZoom = function () {
    const modal = document.getElementById('avatarZoomModal');
    if (!modal || modal.classList.contains('hidden')) return;

    modal.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// Ekranın herhangi bir yerine tıklayınca zoom'u kapat
document.addEventListener('click', () => {
    if (typeof closeAvatarZoom === 'function') closeAvatarZoom();
});


// ==========================================
// YENİ: SİSTEMDEKİ AKTİF ÖĞRETMENİN HAFIZASI VE LİMİT BEKÇİLERİ
// ==========================================
let currentTeacherId = null;
let currentTeacherName = '';
let isPremiumTeacher = false;
let currentStudentCount = 0;
let currentQuizCount = 0;
let currentTeacherIban = '';
let currentTeacherBankReceiver = '';

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

    const existingToasts = container.querySelectorAll('.toast-msg');
    for (let i = 0; i < existingToasts.length; i++) {
        if (existingToasts[i].innerText === message) return;
    }

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-500' : (type === 'error' ? 'bg-rose-500' : 'bg-indigo-500');

    const iconSvg = type === 'success'
        ? `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
        : (type === 'error'
            ? `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
            : `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);

    toast.className = `${bgColor} text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-${bgColor}/30 font-bold text-sm flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0`;

    toast.innerHTML = `<span class="flex-shrink-0">${iconSvg}</span> <span class="toast-msg">${escapeHTML(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => { toast.classList.remove('translate-y-10', 'opacity-0'); }, 10);
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function customConfirm(message, btnText = "Evet, İşlemi Yap") {
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
// GÜVENLİK (FEDAİ) MOTORU VE SÜRE KONTROLÜ
// ==========================================

// Sistemi Başlat (GÜMRÜK VE SPLASH)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkActiveSession);
} else {
    checkActiveSession();
}

async function checkActiveSession() {
    // 🌟 STABILIZATION: Supabase'in tam oturması için kısa bekleme
    await new Promise(r => setTimeout(r, 700));

    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
            console.warn("Kullanıcı bulunamadı, giriş sayfasına yönlendiriliyor.");
            window.location.href = 'index.html';
            return;
        }

        // 🌟 STEP 1: Sadece Rolü Kontrol Et (Hızlı & Güvenli)
        const { data: roleCheck, error: roleError } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();

        if (roleError || !roleCheck) {
            console.error("Yetki kontrolü başarısız:", roleError);
            window.location.href = 'index.html';
            return;
        }

        if (roleCheck.role !== 'teacher' && roleCheck.role !== 'god') {
            console.warn("Yetkisiz rol erişimi:", roleCheck.role);
            window.location.href = 'student.html';
            return;
        }

        // Eğer buradaysak yetki TAMAM. Splash'i hemen kapatalım ki kullanıcı beklediğini hissetmesin.
        const splash = document.getElementById('splashScreen');
        if (splash) {
            splash.classList.add('opacity-0');
            setTimeout(() => splash.classList.add('hidden'), 700);
        }

        currentTeacherId = user.id;

        // 🌟 STEP 2: Detaylı Verileri Arkadan Çek (Non-blocking)
        loadExtendedTeacherProfile(user.id);

    } catch (e) {
        console.error("Güvenlik sistemi hatası:", e);
    }
}

async function loadExtendedTeacherProfile(userId) {
    try {
        const { data: profile, error } = await supabaseClient.from('profiles').select('*').eq('id', userId).single();

        if (error || !profile) {
            console.warn("Profil detayları çekilemedi (Bazı kolonlar eksik olabilir):", error);
            return;
        }

        currentTeacherName = profile.full_name || 'Eğitmen';
        currentTeacherIban = profile.bank_iban || '';
        currentTeacherBankReceiver = profile.bank_receiver || '';

        // UI Güncellemeleri
        const welcomeNameEl = document.getElementById('welcomeTeacherName');
        if (welcomeNameEl) welcomeNameEl.innerText = currentTeacherName + " Öğretmenim";

        const agendaNameEl = document.getElementById('agendaTeacherName');
        if (agendaNameEl) agendaNameEl.innerText = currentTeacherName + " Öğretmenim, şimdi çalışma vakti!";

        // Markalama (B2B Kurumsal Yapı)
        if (profile.school_id) {
            // Eğer hoca bir kuruma bağlıysa, kurumun logosunu ve adını çek
            const { data: schoolData } = await supabaseClient.from('profiles').select('school_name, school_logo').eq('id', profile.school_id).single();
            if (schoolData) {
                if (schoolData.school_name) document.querySelectorAll('.school-name-display').forEach(el => el.innerText = schoolData.school_name);
                if (schoolData.school_logo) document.querySelectorAll('.school-logo-display').forEach(el => el.src = schoolData.school_logo);
            }
        } else {
            // Bağımsız hoca ise kendi verilerini kullan
            if (profile.school_name) document.querySelectorAll('.school-name-display').forEach(el => el.innerText = profile.school_name);
            if (profile.school_logo) document.querySelectorAll('.school-logo-display').forEach(el => el.src = profile.school_logo);
        }

        // Premium Kontrolü
        if (profile.is_premium && profile.premium_until) {
            const today = new Date();
            const expiry = new Date(profile.premium_until);
            isPremiumTeacher = (today <= expiry);
        } else {
            isPremiumTeacher = profile.is_premium;
        }

        // 4. KURUMLAR İÇİN VIP KONTROLÜ (GÜNCELLENDİ: Kurum VIP mirası)
        if (profile.school_id && !isPremiumTeacher) {
            // Eğer hoca kendisi VIP değilse ama bir kuruma bağlıysa, kurumun durumuna bakıyoruz
            const { data: schoolProfile } = await supabaseClient.from('profiles').select('is_premium').eq('id', profile.school_id).single();
            if (schoolProfile && schoolProfile.is_premium) {
                isPremiumTeacher = true; // Kurum VIP ise hoca da VIP'dir!
            }
        }

        if (isPremiumTeacher) {
            const logo = document.getElementById('panelLogo');
            if (logo) {
                logo.src = 'assets/logo_premium.png';
                logo.classList.remove('grayscale', 'brightness-0');
            }
        }
        // Kilitleri ve UI'ı güncelle
        updatePremiumUI();

        // 🌟 PANELİ BAŞLAT (Kokpit Sekmesini Aç)
        switchTab('dashboard');

        // 🌟 REALTIME LİSTENER'LARI BAŞLAT
        initRealtimeProfileListener();

    } catch (e) {
        console.error("Profil detay yükleme hatası:", e);
    }
}

// 🌟 YENİ: ANLIK AVATAR VE PROFİL GÜNCELLEME MOTORU
function initRealtimeProfileListener() {
    if (!currentTeacherId) return;

    // Eğer eski bir abonelik varsa temizle
    if (window.profileSubscription) {
        supabaseClient.removeChannel(window.profileSubscription);
    }

    console.log("REALTIME_PROFILE_LISTENER: Başlatılıyor...", currentTeacherId);

    window.profileSubscription = supabaseClient
        .channel('public:profiles:teacher_id=eq.' + currentTeacherId)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `teacher_id=eq.${currentTeacherId}`
        }, (payload) => {
            console.log("REALTIME_PROFILE_UPDATE:", payload);

            // 1. Eğer öğrenci listesi açıksa tazele (Thumbnail'ler için)
            // Not: Çok sık tetiklenirse debounce eklenebilir, ama şu an için direkt fetchStudents() makul.
            if (typeof fetchStudents === 'function') {
                fetchStudents();
            }

            // 2. Eğer o an bu öğrencinin profili (modalı) açıksa, ordaki büyük avatarı da güncelle
            const openProfId = document.getElementById('profStudentId')?.value;
            if (openProfId === payload.new.id) {
                const avatarPreview = document.getElementById('profileAvatarPreview');
                if (avatarPreview) {
                    avatarPreview.innerHTML = getAvatarPreviewHTML(payload.new.avatar_config, "w-16 h-16 md:w-20 md:h-20");
                }
            }
        })
        .subscribe();
}

function updatePremiumUI() {
    const locks = document.querySelectorAll('.vip-lock, .lock-icon');
    if (isPremiumTeacher) {
        locks.forEach(el => el.classList.add('hidden'));
        const logo = document.getElementById('panelLogo');
        if (logo) {
            logo.src = 'assets/logo_premium.png';
            logo.classList.remove('grayscale', 'brightness-0');
        }
    } else {
        locks.forEach(el => el.classList.remove('hidden'));
    }
}

// Premium Kapatma Fonksiyonu
window.closePremiumCelebration = function () {
    const modal = document.getElementById('premiumCelebrationModal');
    const box = document.getElementById('premiumCelebrationBox');
    if (modal) {
        modal.classList.add('opacity-0');
        box.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 500);
    }
}



// ==========================================
// ÇIKIŞ MOTORU VE MENÜLER
// ==========================================
document.addEventListener('click', async (e) => {
    if (e.target.closest('#logoutBtn')) {
        const onay = await customConfirm("Yönetim panelinden çıkmak istediğinize emin misiniz?", "Evet, Çıkış Yap");
        if (!onay) return;
        const { error } = await supabaseClient.auth.signOut();
        if (!error) window.location.href = 'index.html';
        else showToast("Çıkış yapılamadı!", "error");
    }
});

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

// ==========================================
// 2. SEKMELER ARASI GEÇİŞ VE NAVİGASYON
// ==========================================
const btnDashboard = document.getElementById('btn-dashboard');
const btnStudents = document.getElementById('btn-students');
const btnHomeworks = document.getElementById('btn-homeworks');
const btnActivities = document.getElementById('btn-activities');
const btnQuizzes = document.getElementById('btn-quizzes');
const btnResults = document.getElementById('btn-results');
const btnLogs = document.getElementById('btn-logs');
const btnClasses = document.getElementById('btn-classes');
const btnWhiteboard = document.getElementById('btn-whiteboard');
const btnStudentFlow = document.getElementById('btn-student-flow');

// SEKSİYONLAR (PANEL SAYFALARI)
const sectionDashboard = document.getElementById('section-dashboard');
const sectionStudents = document.getElementById('section-students');
const sectionHomeworks = document.getElementById('section-homeworks');
const sectionActivities = document.getElementById('section-activities');
const sectionQuizzes = document.getElementById('section-quizzes');
const sectionResults = document.getElementById('section-results');
const sectionLogs = document.getElementById('section-logs');
const sectionClasses = document.getElementById('section-classes');
const sectionWhiteboard = document.getElementById('section-whiteboard');
const sectionStudentFlow = document.getElementById('section-student-flow');

function switchTab(target) {
    if (sidebarMain && window.innerWidth < 768 && !sidebarMain.classList.contains('-translate-x-full')) {
        toggleMobileSidebar();
    }

    // Tüm butonlardan aktiflik sınıflarını kaldır
    [btnDashboard, btnStudents, btnClasses, btnHomeworks, btnActivities, btnQuizzes, btnResults, btnLogs, btnWhiteboard, btnStudentFlow].forEach(btn => {
        if (btn) btn.classList.remove('bg-indigo-800', 'shadow-inner');
    });

    // Tüm seksiyonları gizle
    [sectionDashboard, sectionStudents, sectionClasses, sectionHomeworks, sectionActivities, sectionQuizzes, sectionResults, sectionLogs, sectionWhiteboard, sectionStudentFlow].forEach(sec => {
        if (sec) sec.classList.add('hidden');
    });

    if (target === 'dashboard') {
        if (sectionDashboard) sectionDashboard.classList.remove('hidden');
        if (btnDashboard) btnDashboard.classList.add('bg-indigo-800', 'shadow-inner');
        fetchDashboardStats();
        fetchAgenda(); // 🌟 YENİ: Ajandayı da tetikle!
    } else if (target === 'classes') {
        if (sectionClasses) sectionClasses.classList.remove('hidden');
        if (btnClasses) btnClasses.classList.add('bg-indigo-800', 'shadow-inner');
        fetchClasses();
    } else if (target === 'whiteboard') {
        if (sectionWhiteboard) sectionWhiteboard.classList.remove('hidden');
        if (btnWhiteboard) btnWhiteboard.classList.add('bg-indigo-800', 'shadow-inner');
        fetchWhiteboard();
    } else if (target === 'homeworks') {
        if (sectionHomeworks) sectionHomeworks.classList.remove('hidden');
        if (btnHomeworks) btnHomeworks.classList.add('bg-indigo-800', 'shadow-inner');
        fillStudentSelect();
        fetchHomeworks();
    } else if (target === 'activities') {
        if (sectionActivities) sectionActivities.classList.remove('hidden');
        if (btnActivities) btnActivities.classList.add('bg-indigo-800', 'shadow-inner');
        fetchActivities();
    } else if (target === 'quizzes') {
        if (sectionQuizzes) sectionQuizzes.classList.remove('hidden');
        if (btnQuizzes) btnQuizzes.classList.add('bg-indigo-800', 'shadow-inner');
        fetchQuizzes();
    } else if (target === 'results') {
        if (sectionResults) sectionResults.classList.remove('hidden');
        if (btnResults) btnResults.classList.add('bg-indigo-800', 'shadow-inner');
        fetchResults();
    } else if (target === 'logs') {
        if (sectionLogs) sectionLogs.classList.remove('hidden');
        if (btnLogs) btnLogs.classList.add('bg-indigo-800', 'shadow-inner');
        loadLogs();
    } else if (target === 'student-flow') {
        if (sectionStudentFlow) sectionStudentFlow.classList.remove('hidden');
        if (btnStudentFlow) btnStudentFlow.classList.add('bg-indigo-800', 'shadow-inner');
        fetchStudentFlow();
    } else {
        if (sectionStudents) sectionStudents.classList.remove('hidden');
        if (btnStudents) btnStudents.classList.add('bg-indigo-800', 'shadow-inner');
        fetchStudents();
    }
}

if (btnDashboard) btnDashboard.onclick = () => switchTab('dashboard');
if (btnStudents) btnStudents.onclick = () => switchTab('students');
if (btnClasses) btnClasses.onclick = () => switchTab('classes');
if (btnWhiteboard) btnWhiteboard.onclick = () => switchTab('whiteboard');
if (btnHomeworks) btnHomeworks.onclick = () => switchTab('homeworks');
if (btnActivities) btnActivities.onclick = () => switchTab('activities');
if (btnQuizzes) btnQuizzes.onclick = () => switchTab('quizzes');
if (btnResults) btnResults.onclick = () => switchTab('results');
if (btnLogs) btnLogs.onclick = () => switchTab('logs');
if (btnStudentFlow) btnStudentFlow.onclick = () => switchTab('student-flow');

async function saveLog(action, details = "") {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        // Cihaz ve tarayıcı bilgisini al
        const device = navigator.userAgent;
        const enrichedDetails = `${details}${details ? ' | ' : ''}Cihaz: ${device}`;

        console.log("LOG KAYIT:", action, enrichedDetails);
        await supabaseClient.from('audit_logs').insert([{
            user_id: user.id,
            action: action,
            details: enrichedDetails,
            created_at: new Date().toISOString()
        }]);
    } catch (e) { console.error("Log hatası:", e); }
}

async function loadLogs() {
    const container = document.getElementById('logsContainer');
    container.innerHTML = '<div class="p-10 text-center text-gray-400 italic animate-pulse">Kayıtlar getiriliyor...</div>';

    const { data: { user } } = await supabaseClient.auth.getUser();
    const { data: logs, error } = await supabaseClient.from('audit_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);

    if (error || !logs || logs.length === 0) {
        container.innerHTML = '<div class="p-20 text-center text-gray-400 font-bold uppercase tracking-widest opacity-50">Henüz bir işlem kaydı bulunmuyor.</div>';
        return;
    }

    container.innerHTML = logs.map(log => {
        const date = new Date(log.created_at).toLocaleString('tr-TR');
        return `
            <div class="p-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors flex items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-gray-800 dark:text-white">${escapeHTML(log.action)}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${escapeHTML(log.details) || ''}</p>
                    </div>
                </div>
                <span class="text-[10px] font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap">${date}</span>
            </div>
        `;
    }).join('');
}

// 🌟 YENİ: PROFESYONEL ÖĞRENCİ AKIŞI MOTORU (CANLI)
// containerId: Dashboard için 'studentLiveLogs', Özel Sekme için 'studentFlowContainer'
async function fetchStudentFlow(containerId = 'studentFlowContainer') {
    const container = document.getElementById(containerId);
    if (!container || !currentTeacherId) return;

    // Eğer eski bir abonelik varsa temizle
    if (window.studentFlowSubscription) {
        supabaseClient.removeChannel(window.studentFlowSubscription);
    }

    container.innerHTML = `
        <div class="p-10 text-center flex flex-col items-center justify-center gap-4">
            <div class="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p class="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Güncelleniyor...</p>
        </div>`;

    try {
        const { data: students, error: sErr } = await supabaseClient.from('profiles').select('id, full_name').eq('teacher_id', currentTeacherId).eq('role', 'student');

        console.log("FLOW_STUDENTS_QUERY:", { students, sErr, currentTeacherId });

        if (!students || students.length === 0) {
            container.innerHTML = `<div class="p-10 text-center text-gray-400 font-bold uppercase tracking-widest opacity-50 italic text-[10px]">Henüz takip edilecek öğrenci bulunmuyor.</div>`;
            return;
        }

        const studentIds = students.map(s => s.id).filter(id => id !== null);
        const studentMap = {};
        students.forEach(s => studentMap[s.id] = s.full_name);

        console.log("FLOW_STUDENT_IDS:", studentIds);

        const loadInitialLogs = async () => {
            // 🌟 GELİŞMİŞ SORGU: RLS (Yetki) sorunlarını aşmak için JOIN (birleştirme) kullanıyoruz
            // audit_logs -> profiles -> teacher_id kontrolü
            const { data: logs, error } = await supabaseClient.from('audit_logs')
                .select('*, profiles!inner(teacher_id, full_name, avatar_config)')
                .eq('profiles.teacher_id', currentTeacherId)
                .order('created_at', { ascending: false })
                .limit(containerId === 'studentLiveLogs' ? 10 : 50);

            console.log("FLOW_LOGS_QUERY_RESULT (JOIN):", { logs, error, containerId });

            if (error) {
                console.error("FLOW_DB_ERROR:", error);
                container.innerHTML = `<div class="p-10 text-center text-red-500 font-bold uppercase tracking-widest text-[10px]">Veritabanı Hatası: ${error.message}</div>`;
                return;
            }

            if (!logs || logs.length === 0) {
                container.innerHTML = `<div class="p-10 text-center text-gray-400 font-bold uppercase tracking-widest opacity-50 italic text-[10px]">Henüz bir hareket sinyali gelmedi.</div>`;
                return;
            }

            renderLogs(logs);
        };

        const renderLogs = (logs) => {
            container.innerHTML = logs.map(log => {
                const date = new Date(log.created_at).toLocaleString('tr-TR');
                const studentName = log.profiles?.full_name || studentMap[log.user_id] || 'Bilinmeyen Öğrenci';
                const avatarConfig = log.profiles?.avatar_config || {};

                // Aksiyon tipine göre çerçeve rengi (opsiyonel vurgu)
                let ringColor = 'border-indigo-100';
                if (log.action.includes('Sınav')) ringColor = 'border-rose-200';
                else if (log.action.includes('Ödev')) ringColor = 'border-emerald-200';

                return `
                    <div class="p-4 hover:bg-gray-50/80 dark:hover:bg-slate-700/30 transition-all flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500 group">
                        ${getAvatarPreviewHTML(avatarConfig, "w-10 h-10")}
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center justify-between gap-1 mb-0.5">
                                <h4 class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate">${escapeHTML(studentName)}</h4>
                                <span class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter shrink-0">${date}</span>
                            </div>
                            <p class="text-xs font-bold text-gray-800 dark:text-white leading-tight truncate">${escapeHTML(log.action)}</p>
                            <p class="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed italic line-clamp-1">${escapeHTML(log.details) || ''}</p>
                        </div>
                    </div>`;
            }).join('');
        };

        await loadInitialLogs();

        // 🌟 DÜZELTME: Her abone olunduğunda benzersiz bir kanal ismi kullanılarak hatanın önüne geçilir
        const uniqueChannelId = `student-flow-${containerId}-${Date.now()}`;
        window.studentFlowSubscription = supabaseClient
            .channel(uniqueChannelId)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => {
                if (studentIds.includes(payload.new.user_id)) {
                    loadInitialLogs();
                    if (containerId === 'studentLiveLogs') showToast("Yeni bir öğrenci hareketi algılandı!", "info");
                }
            })
            .subscribe();

    } catch (e) {
        console.error("Akış çekme hatası:", e);
        container.innerHTML = `<div class="p-10 text-center text-red-400 font-bold uppercase tracking-widest opacity-50 italic text-[10px]">Hata: Veriler alınamadı.</div>`;
    }
}

// Kokpit (Dashboard) için yardımcı takma ad
window.fetchStudentLiveLogs = function () {
    fetchStudentFlow('studentLiveLogs');
};


// 🌟 BANKA BİLGİLERİ YÖNETİMİ 🌟
window.openBankSettings = function () {
    const modal = document.getElementById('bankSettingsModal');
    const ibanInp = document.getElementById('teacherIbanInput');
    const recInp = document.getElementById('teacherBankReceiverInput');

    if (ibanInp) ibanInp.value = currentTeacherIban || '';
    if (recInp) recInp.value = currentTeacherBankReceiver || '';

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('animate-in', 'fade-in', 'zoom-in-95', 'duration-300');
    }
}

window.saveBankSettings = async function () {
    const iban = document.getElementById('teacherIbanInput').value.trim();
    const receiver = document.getElementById('teacherBankReceiverInput').value.trim();

    if (!iban || !receiver) {
        showToast("Lütfen tüm alanları doldurun.", "error");
        return;
    }

    try {
        const { error } = await supabaseClient.from('profiles').update({
            bank_iban: iban,
            bank_receiver: receiver
        }).eq('id', currentTeacherId);

        if (error) throw error;

        currentTeacherIban = iban;
        currentTeacherBankReceiver = receiver;

        showToast("Banka bilgileriniz başarıyla güncellendi.", "success");
        saveLog("Banka Bilgileri Güncellendi", `Yeni IBAN: ${iban}`);
        document.getElementById('bankSettingsModal').classList.add('hidden');
    } catch (e) {
        console.error("Banka kaydetme hatası:", e);
        showToast("Kaydedilirken bir hata oluştu.", "error");
    }
}

// ==========================================
// KOKPİT (DASHBOARD) İSTATİSTİK VE AJANDA MOTORU
// ==========================================
async function fetchDashboardStats() {
    if (!currentTeacherId) return;

    // SAYILARI AL VE LİMİT İÇİN HAFIZAYA KAYDET
    const { count: studentCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('teacher_id', currentTeacherId);
    currentStudentCount = studentCount || 0;
    const dStud = document.getElementById('dashStudentCount');
    if (dStud) dStud.innerText = studentCount || 0;

    const { count: quizCount } = await supabaseClient.from('quizzes').select('*', { count: 'exact', head: true }).eq('teacher_id', currentTeacherId);
    currentQuizCount = quizCount || 0;
    const dQuiz = document.getElementById('dashQuizCount');
    if (dQuiz) dQuiz.innerText = quizCount || 0;

    const { count: hwCount } = await supabaseClient.from('homeworks').select('*', { count: 'exact', head: true }).eq('teacher_id', currentTeacherId);
    const dHw = document.getElementById('dashHwCount');
    if (dHw) dHw.innerText = hwCount || 0;

    const { data: results } = await supabaseClient.from('quiz_results').select('score, profiles!inner(*)').eq('profiles.teacher_id', currentTeacherId);
    let avgScore = 0;
    if (results && results.length > 0) {
        const total = results.reduce((sum, r) => sum + r.score, 0);
        avgScore = Math.round(total / results.length);
    }
    const dAvg = document.getElementById('dashAvgScore');
    if (dAvg) dAvg.innerText = avgScore ? `%${avgScore}` : '%0';

    fetchAgenda();
    fetchStudentLiveLogs(); // 🌟 YENİ: Dashboard loglarını da getir!
}

// ==========================================
// KOKPİT AJANDA MOTORU (GÜNCELLENDİ: Etiket Temizliği)
// ==========================================
async function fetchAgenda() {
    const agendaContainer = document.getElementById('agendaList');
    if (!agendaContainer || !currentTeacherId) return;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDateStr = sevenDaysAgo.toISOString().split('T')[0];

    console.log("AJANDA_SORGUSU_PARAMETRELERI:", { startDateStr, currentTeacherId });

    try {
        const { data: lessons, error: lErr } = await supabaseClient.from('private_lessons')
            .select('lesson_date, lesson_time, topic, profiles!inner(full_name)')
            .gte('lesson_date', startDateStr)
            .eq('teacher_id', currentTeacherId);

        if (lErr) console.error("Ajanda Ders Hatası:", lErr);

        const { data: homeworks, error: hErr } = await supabaseClient.from('homeworks')
            .select('due_date, title, status, profiles!inner(full_name)')
            .gte('due_date', startDateStr)
            .eq('teacher_id', currentTeacherId);

        if (hErr) console.error("Ajanda Ödev Hatası:", hErr);

        console.log("AJANDA_HAM_VERI (Dersler):", lessons);
        console.log("AJANDA_HAM_VERI (Ödevler):", homeworks);

        let agendaItems = [];

        if (lessons) {
            lessons.forEach(l => {
                agendaItems.push({
                    type: 'lesson',
                    dateStr: l.lesson_date,
                    timeStr: l.lesson_time || 'Belirtilmedi',
                    dateObj: new Date(`${l.lesson_date}T${l.lesson_time || '00:00'}:00`),
                    title: `${escapeHTML(l.profiles?.full_name || 'Öğrenci')} ile Özel Ders`,
                    desc: escapeHTML(l.topic)
                });
            });
        }

        if (homeworks) {
            homeworks.forEach(h => {
                if (h.status !== 'Tamamlandı') {
                    let cleanTitle = h.title || 'İsimsiz Ödev';
                    if (cleanTitle.includes('[KELİME_KARTI]')) {
                        cleanTitle = cleanTitle.replace('[KELİME_KARTI]', 'Telaffuz Görevi:').trim();
                    } else if (cleanTitle.includes('[WRITING]')) {
                        cleanTitle = cleanTitle.replace('[WRITING]', 'Gramer Görevi:').trim();
                    }

                    agendaItems.push({
                        type: 'homework',
                        dateStr: h.due_date,
                        timeStr: '23:59',
                        dateObj: new Date(`${h.due_date}T23:59:00`),
                        title: `${h.profiles?.full_name || 'Öğrenci'} - Ödev Teslimi`,
                        desc: cleanTitle
                    });
                }
            });
        }

        agendaItems.sort((a, b) => a.dateObj - b.dateObj);
        agendaContainer.innerHTML = '';

        if (agendaItems.length === 0) {
            agendaContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 text-gray-400">
                    <p class="text-sm font-bold text-gray-500">Yaklaşan bir programınız yok.</p>
                    <p class="text-[10px] mt-1 opacity-50 uppercase tracking-widest font-black">Harika! Şimdi dinlenme vakti.</p>
                </div>`;
            return;
        }

        agendaItems.slice(0, 10).forEach(item => {
            const d = item.dateObj;
            const dayName = d.toLocaleDateString('tr-TR', { weekday: 'long' });
            const shortDate = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });

            const isToday = d.toDateString() === new Date().toDateString();
            const dateBadge = isToday
                ? `<span class="bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase shadow-sm">BUGÜN</span>`
                : `<span class="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">${shortDate} ${dayName}</span>`;

            const icon = item.type === 'lesson'
                ? `<div class="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-sm"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422A12.083 12.083 0 0112 21.5a12.083 12.083 0 01-6.16-10.922L12 14z"></path></svg></div>`
                : `<div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg></div>`;

            const timeHtml = item.type === 'lesson' && item.timeStr !== 'Belirtilmedi'
                ? `<span class="ml-2 text-xs font-black text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${item.timeStr}</span>`
                : '';

            let badgeHtml = '';
            let displayDesc = item.desc;
            if (displayDesc.includes('Gramer Görevi:')) {
                badgeHtml = `<span class="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded text-[10px] font-black mr-2 uppercase tracking-widest border border-blue-200 dark:border-blue-800">GRAMER</span>`;
                displayDesc = displayDesc.replace('Gramer Görevi:', '').trim();
            } else if (displayDesc.includes('Telaffuz Görevi:')) {
                badgeHtml = `<span class="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded text-[10px] font-black mr-2 uppercase tracking-widest border border-purple-200 dark:border-purple-800">TELAFFUZ</span>`;
                displayDesc = displayDesc.replace('Telaffuz Görevi:', '').trim();
            }

            agendaContainer.innerHTML += `
                <div class="flex items-center gap-4 p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-700/40 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition group cursor-default">
                    ${icon}
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1.5">
                            ${dateBadge}
                            ${timeHtml}
                        </div>
                        <h4 class="text-sm font-black text-gray-800 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">${escapeHTML(item.title)}</h4>
                        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[250px] sm:max-w-md flex items-center">${badgeHtml} ${escapeHTML(displayDesc)}</p>
                    </div>
                </div>`;
        });
    } catch (err) {
        console.error("Ajanda ölümcül hata:", err);
    }
}

// ==========================================
// 3. YENİ NESİL: VIP ÖĞRENCİ İSTİHBARAT MOTORU (LİMİTLİ)
// ==========================================
const studentModalEl = document.getElementById('addStudentModal');
const openStudBtn = document.getElementById('addStudentBtn');
const closeStudBtn = document.getElementById('closeModalBtn');
const studentFormEl = document.getElementById('newStudentForm');

if (openStudBtn) {
    openStudBtn.addEventListener('click', () => {
        if (!isPremiumTeacher && currentStudentCount >= 3) {
            openPaywall("Maksimum Öğrenci Limitine Ulaştınız (3/3)");
            return;
        }
        if (studentModalEl) studentModalEl.classList.remove('hidden');
    });
}
if (closeStudBtn) closeStudBtn.addEventListener('click', () => { if (studentModalEl) studentModalEl.classList.add('hidden'); });

if (studentFormEl) {
    studentFormEl.addEventListener('submit', async function (e) {
        e.preventDefault();
        const submitBtn = studentFormEl.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "Yükleniyor...";

        const name = document.getElementById('studentName').value;
        const rawUsername = document.getElementById('studentUsername').value;
        const password = document.getElementById('studentPassword').value;
        const parentPhone = document.getElementById('parentPhone').value;

        const dummyEmail = rawUsername.replace(/\s+/g, '').toLowerCase() + '@englishportal.com';

        const { data, error } = await supabaseClient.auth.signUp({ email: dummyEmail, password: password });

        if (error) { showToast("Hata: " + error.message, "error"); submitBtn.innerText = originalText; return; }

        if (data.user) {
            const { error: profileError } = await supabaseClient.from('profiles').insert([{
                id: data.user.id,
                full_name: name,
                email: dummyEmail,
                role: 'student',
                parent_phone: parentPhone,
                teacher_id: currentTeacherId
            }]);

            if (profileError) showToast("Hata: " + profileError.message, "error");
            else {
                showToast("Öğrenci başarıyla eklendi.", "success");
                saveLog("Yeni Öğrenci Eklendi", `${name} (${rawUsername}) sisteme kaydedildi.`);
                if (studentModalEl) studentModalEl.classList.add('hidden');
                studentFormEl.reset();
                fetchStudents();
                fetchDashboardStats();
            }
        }
        submitBtn.innerText = originalText;
    });
}

window.deleteStudent = async function (id, name) {
    const onay = await safeDelete(`"${escapeHTML(name)}" öğrencisini ve TÜM verilerini silmek üzeresiniz. Bu işlem geri alınamaz!`);
    if (!onay) return;
    const { error } = await supabaseClient.from('profiles').delete().eq('id', id);
    if (error) showToast("Silerken hata oldu: " + error.message, "error");
    else {
        showToast("Öğrenci silindi.", "success");
        saveLog("Öğrenci Silindi", `${name} (ID: ${id}) sistemden kaldırıldı.`);
        fetchStudents();
        fetchDashboardStats();
    }
};

// 🌟 YENİ: ÖĞRETMEN PANELİ ÖZEL ŞIK ŞİFRE GİRİŞ ARAYÜZÜ 🌟
function teacherPrompt(title, desc = "", placeholder = "Buraya yazın...") {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 opacity-0 transition-opacity duration-300";

        const box = document.createElement('div');
        box.className = "bg-white dark:bg-slate-800 rounded-[24px] shadow-2xl border border-indigo-100 dark:border-slate-700 w-full max-w-sm p-6 transform scale-95 transition-all duration-300 relative overflow-hidden";

        box.innerHTML = `
            <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            <div class="mb-5 mt-2">
                <div class="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-indigo-100 dark:border-indigo-800/50">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-3l8.44-8.44A6 6 0 0115 7h0z"></path></svg>
                </div>
                <h3 class="text-lg font-black text-slate-800 dark:text-white leading-tight">${title}</h3>
                ${desc ? `<p class="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">${desc}</p>` : ''}
            </div>
            <input type="text" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6 font-bold tracking-widest placeholder-slate-400 transition" placeholder="${placeholder}" autofocus autocomplete="off">
            <div class="flex gap-2">
                <button id="tpCancel" class="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl font-bold uppercase text-[10px] tracking-widest transition">Vazgeç</button>
                <button id="tpOk" class="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-md hover:shadow-lg transition">Kaydet</button>
            </div>
        `;

        modal.appendChild(box);
        document.body.appendChild(modal);

        const input = box.querySelector('input');
        const btnOk = box.querySelector('#tpOk');
        const btnCancel = box.querySelector('#tpCancel');

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

window.resetStudentPassword = async function (id) {
    const newPassword = await teacherPrompt("Öğrenci Şifresini Sıfırla", "Öğrenci panelinize giriş yapabilmesi için güvenli bir şifre belirleyin. (En az 6 karakter)", "Örn: sifre1234");
    if (!newPassword) return; // Kullanıcı iptal etti
    if (newPassword.length < 6) {
        showToast("Hata! Şifre en az 6 karakter olmalıdır.", "error");
        return;
    }

    const onay = await customConfirm(`Öğrencinin şifresini "${newPassword}" olarak değiştirmek istediğinize emin misiniz?`, "Evet, Değiştir");
    if (!onay) return;

    showToast("Güvenli bağlantı kuruluyor...", "info");

    try {
        const apiUrl = window.location.protocol === 'file:'
            ? 'https://englishportalvip.vercel.app/api/reset-password' // Yerel test için
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
            showToast("Şifre başarıyla güncellendi!", "success");
        } else {
            showToast("Hata: " + (data.error || "Bilinmeyen sunucu hatası"), "error");
        }
    } catch (err) {
        showToast("Ağ bağlantısı hatası. Demo için lütfen siteyi Vercel altyapısında çalıştırın.", "error");
    }
};

// ===============================================
// VIP KARTLAR VE METRİKLER 
// ===============================================
async function fetchStudents() {
    const listContainer = document.getElementById('studentList');
    if (!listContainer || !currentTeacherId) return;

    listContainer.innerHTML = '<div class="w-full py-10 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 animate-pulse"><svg class="w-8 h-8 mb-3 opacity-50 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg><span class="text-sm font-bold uppercase tracking-widest">Öğrenci Verileri Yükleniyor...</span></div>';

    const { data: students, error: studErr } = await supabaseClient.from('profiles').select('*').eq('role', 'student').eq('teacher_id', currentTeacherId).order('created_at', { ascending: false });
    const { data: quizResults } = await supabaseClient.from('quiz_results').select('student_id, score, profiles!inner(*)').eq('profiles.teacher_id', currentTeacherId);
    const { data: lessons } = await supabaseClient.from('private_lessons').select('student_id, price, is_paid').eq('teacher_id', currentTeacherId);
    const { data: homeworks } = await supabaseClient.from('homeworks').select('student_id, status').eq('teacher_id', currentTeacherId);

    if (studErr || !students || students.length === 0) {
        document.getElementById('statTotalStudents').innerText = "0";
        document.getElementById('statClassAvg').innerText = "%0";
        document.getElementById('statTotalDebt').innerText = "₺0";
        document.getElementById('statHwRate').innerText = "%0";
        listContainer.innerHTML = `<div class="col-span-full w-full p-10 text-center text-gray-500 dark:text-gray-400 italic font-medium">Henüz sisteme kayıtlı öğrenci bulunmuyor.</div>`;
        return;
    }

    document.getElementById('statTotalStudents').innerText = students.length;

    let totalScore = 0;
    if (quizResults && quizResults.length > 0) {
        quizResults.forEach(r => totalScore += r.score);
        document.getElementById('statClassAvg').innerText = `%${Math.round(totalScore / quizResults.length)}`;
    } else { document.getElementById('statClassAvg').innerText = `%0`; }

    let totalDebt = 0;
    if (lessons) { lessons.forEach(l => { if (!l.is_paid) totalDebt += Number(l.price || 0); }); }
    document.getElementById('statTotalDebt').innerText = `₺${totalDebt}`;

    if (homeworks && homeworks.length > 0) {
        const completedHw = homeworks.filter(h => h.status === 'Tamamlandı').length;
        const hwRate = Math.round((completedHw / homeworks.length) * 100);
        document.getElementById('statHwRate').innerText = `%${hwRate}`;
    } else { document.getElementById('statHwRate').innerText = `%0`; }

    listContainer.innerHTML = '';

    students.forEach(student => {
        const studentQuizzes = quizResults ? quizResults.filter(q => q.student_id === student.id) : [];
        const studentLessons = lessons ? lessons.filter(l => l.student_id === student.id) : [];

        let studAvg = 0;
        if (studentQuizzes.length > 0) {
            const sum = studentQuizzes.reduce((a, b) => a + b.score, 0);
            studAvg = Math.round(sum / studentQuizzes.length);
        }

        let studDebt = 0;
        studentLessons.forEach(l => { if (!l.is_paid) studDebt += Number(l.price || 0); });

        let avgColor = 'bg-gray-200 dark:bg-slate-700';
        let avgWidth = studAvg > 0 ? studAvg : 0;
        let badgeHtml = '';

        if (studAvg >= 85) {
            avgColor = 'bg-emerald-500';
            badgeHtml = `<span class="bg-gradient-to-r from-amber-400 to-yellow-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800" title="Parlayan Yıldız">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            </span>`;
        } else if (studAvg >= 50) {
            avgColor = 'bg-yellow-500';
        } else if (studAvg > 0) {
            avgColor = 'bg-rose-500';
            badgeHtml = `<span class="bg-rose-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800 animate-pulse" title="Dikkat Gerekli">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </span>`;
        }

        const debtHtml = studDebt > 0
            ? `<div class="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800 shadow-sm">
                 <div class="relative flex h-2.5 w-2.5">
                   <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                   <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                 </div>
                 <span class="text-[10px] font-black tracking-widest">BORÇ: ₺${studDebt}</span>
               </div>`
            : `<div class="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm">HESAP TEMİZ</div>`;

        const dateStr = new Date(student.created_at).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });

        const card = document.createElement('div');
        card.className = "w-full h-full bg-white dark:bg-slate-800 p-6 rounded-[30px] shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300 relative group flex flex-col";

        card.innerHTML = `
            <div class="flex justify-between items-start mb-5">
                <div class="flex items-center gap-3">
                    ${getAvatarPreviewHTML(student.avatar_config)}
                    <div>
                        <h4 class="font-black text-gray-800 dark:text-white text-base leading-tight">${escapeHTML(student.full_name)}</h4>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Kayıt: ${dateStr}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${badgeHtml}
                    <button onclick="resetStudentPassword('${student.id}')" class="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 hover:bg-amber-50 dark:bg-slate-700/50 dark:hover:bg-amber-900/30 text-slate-400 hover:text-amber-500 transition-all border border-transparent hover:border-amber-200 dark:hover:border-amber-800 shadow-sm" title="Şifre Sıfırla">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4v-3l8.44-8.44A6 6 0 0115 7h0z"></path></svg>
                    </button>
                    <button onclick="deleteStudent('${student.id}', '${escapeHTML(student.full_name)}')" class="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-50 hover:bg-rose-50 dark:bg-slate-700/50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-800 shadow-sm" title="Sistemden Sil">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </div>

            <div class="mb-5 flex-1">
                <div class="flex justify-between items-end mb-1.5">
                    <span class="text-xs font-bold text-gray-500 dark:text-gray-400">Akademik Başarı</span>
                    <span class="text-xs font-black text-gray-800 dark:text-white">%${studAvg}</span>
                </div>
                <div class="w-full bg-gray-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div class="${avgColor} h-full rounded-full transition-all duration-1000" style="width: ${avgWidth}%"></div>
                </div>
            </div>

            <div class="flex items-center justify-between mt-auto border-t border-gray-50 dark:border-slate-700 pt-5">
                ${debtHtml}
                <button onclick="openStudentProfile('${student.id}', '${escapeHTML(student.full_name.replace(/\\/g, '\\\\').replace(/'/g, "\\'"))}', '${student.parent_phone || ''}')" class="bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-indigo-600 dark:text-indigo-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-sm flex items-center gap-1">
                    PROFİLİ AÇ
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </button>
            </div>
        `;
        listContainer.appendChild(card);

    });

    const searchInput = document.getElementById('searchStudentInput');
    if (searchInput && searchInput.value.trim() !== '') {
        searchInput.dispatchEvent(new Event('input'));
    }
}

// ==========================================
// 4. ÖDEV MOTORLARI 
// ==========================================
window.deleteHomework = async function (id, title) {
    const onay = await safeDelete(`"${escapeHTML(title)}" ödevini silmek istediğinize emin misiniz?`);
    if (!onay) return;
    const { error } = await supabaseClient.from('homeworks').delete().eq('id', id);
    if (error) showToast("Ödev silinirken hata oldu!", "error");
    else {
        showToast("Ödev silindi.", "success");
        saveLog("Ödev Silindi", `"${title}" ödevi silindi.`);
        fetchHomeworks();
        fetchStudents();
    }
};

async function fillStudentSelect() {
    const select = document.getElementById('hwStudentSelect');
    if (!select) return;

    select.innerHTML = '<option value="">Yükleniyor...</option>';

    const { data: students } = await supabaseClient.from('profiles').select('id, full_name').eq('role', 'student').eq('teacher_id', currentTeacherId);
    const { data: classes } = await supabaseClient.from('classes').select('id, name').eq('teacher_id', currentTeacherId);

    let html = '<option value="">Kime Gönderilecek?</option>';

    if (classes && classes.length > 0) {
        html += '<optgroup label="Sınıflar (Toplu)">';
        classes.forEach(c => {
            html += `<option value="class_${c.id}"> Sınıf: ${escapeHTML(c.name)}</option>`;
        });
        html += '</optgroup>';
    }

    if (students && students.length > 0) {
        html += '<optgroup label="Öğrenciler (Tekil)">';
        students.forEach(s => {
            html += `<option value="${s.id}">${escapeHTML(s.full_name)}</option>`;
        });
        html += '</optgroup>';
    }
    select.innerHTML = html;
}

const homeworkFormEl = document.getElementById('newHomeworkForm');
if (homeworkFormEl) {
    homeworkFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const target = document.getElementById('hwStudentSelect').value;
        if (!target) { showToast("Lütfen bir hedef seçin!", "error"); return; }

        const title = document.getElementById('hwTitle').value;
        const desc = document.getElementById('hwDesc').value;
        const dueDate = document.getElementById('hwDueDate').value;

        const btn = homeworkFormEl.querySelector('button');
        const originalBtnHTML = btn.innerHTML;
        btn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Gönderiliyor...`;

        let studentIds = [];
        if (target.startsWith('class_')) {
            const classId = target.replace('class_', '');
            const { data } = await supabaseClient.from('class_students').select('student_id').eq('class_id', classId);
            studentIds = data.map(d => d.student_id);
        } else {
            studentIds = [target];
        }

        if (studentIds.length === 0) {
            showToast("Hedefte öğrenci bulunamadı!", "error");
            btn.innerHTML = originalBtnHTML;
            return;
        }

        const inserts = studentIds.map(sid => ({
            student_id: sid,
            teacher_id: currentTeacherId,
            title: title,
            description: desc,
            due_date: dueDate,
            status: 'Bekliyor'
        }));

        const { error } = await supabaseClient.from('homeworks').insert(inserts);

        if (error) {
            showToast("Ödev hatası: " + error.message, "error");
        } else {
            showToast(`${studentIds.length} kişiye ödev başarıyla verildi!`, "success");
            saveLog("Toplu Ödev", `"${title}" ödevi ${studentIds.length} öğrenciye atandı.`);
            homeworkFormEl.reset();
            fetchHomeworks();
            fetchStudents();
        }
        btn.innerHTML = originalBtnHTML;
    });
}

async function fetchHomeworks() {
    const { data, error } = await supabaseClient.from('homeworks').select('*, profiles!inner(full_name)').eq('teacher_id', currentTeacherId).order('created_at', { ascending: false });
    const tbodyPending = document.getElementById('pendingHomeworkList');
    const tbodyCompleted = document.getElementById('completedHomeworkList');

    if (error || !tbodyPending || !tbodyCompleted) return;

    tbodyPending.innerHTML = '';
    tbodyCompleted.innerHTML = '';

    const validData = data || [];
    const pending = validData.filter(h => h.status !== 'Tamamlandı');
    const completed = validData.filter(h => h.status === 'Tamamlandı');

    if (pending.length === 0) {
        tbodyPending.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-gray-400 dark:text-gray-500 italic text-sm">Bekleyen ödev bulunmuyor.</td></tr>';
    } else {
        pending.forEach(hw => {
            const date = new Date(hw.due_date).toLocaleDateString('tr-TR');

            let displayTitle = hw.title;
            if (displayTitle.includes('[KELİME_KARTI]')) {
                displayTitle = `<span class="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded text-[10px] font-black mr-2 uppercase tracking-widest border border-purple-200 dark:border-purple-800">TELAFFUZ</span> ` + displayTitle.replace('[KELİME_KARTI]', '').trim();
            } else if (displayTitle.includes('[WRITING]')) {
                displayTitle = `<span class="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-black mr-2 uppercase tracking-widest border border-blue-200 dark:border-blue-800">GRAMER</span> ` + displayTitle.replace('[WRITING]', '').trim();
            }

            let actionButtons = '';

            // Eğer durum İnceleniyor ise, hocaya İncele butonu ver. Yoksa normal Onayla butonu.
            if (hw.status === 'İnceleniyor') {
                const safeDesc = escape(hw.description);
                actionButtons = `
                    <button onclick="reviewWriting('${hw.id}', '${hw.student_id}', '${safeDesc}')" class="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white px-3 py-2 rounded-xl transition shadow-sm border border-blue-100 dark:border-blue-800 text-xs font-black">
                        İNCELE ↗
                    </button>
                    <button onclick="deleteHomework('${hw.id}', '${escapeHTML(hw.title)}')" class="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white p-2.5 rounded-xl transition shadow-sm border border-rose-100 dark:border-rose-800" title="Sil">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                `;
            } else {
                actionButtons = `
                    <button onclick="approveHomework('${hw.id}', '${hw.student_id}')" class="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white p-2.5 rounded-xl transition shadow-sm border border-emerald-100 dark:border-emerald-800" title="Ödevi Onayla ve XP Ver">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                    <button onclick="deleteHomework('${hw.id}', '${escapeHTML(hw.title)}')" class="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white p-2.5 rounded-xl transition shadow-sm border border-rose-100 dark:border-rose-800" title="Sil">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                `;
            }

            tbodyPending.innerHTML += `
                <tr class="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-800 transition">
                    <td class="p-4 font-bold text-gray-800 dark:text-white text-sm">${hw.profiles ? escapeHTML(hw.profiles.full_name) : 'Bilinmeyen'}</td>
                    <td class="p-4 text-gray-600 dark:text-gray-300 text-sm truncate max-w-[200px]" title="${escapeHTML(hw.title.replace('[KELİME_KARTI] ', '').replace('[WRITING] ', ''))}">${displayTitle}</td>
                    <td class="p-4 text-amber-600 dark:text-amber-400 font-bold text-xs">${date}</td>
                    <td class="p-4 text-right flex items-center justify-end gap-2">
                        ${actionButtons}
                    </td>
                </tr>`;
        });
    }


    if (completed.length === 0) {
        tbodyCompleted.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-gray-400 dark:text-gray-500 italic text-sm">Henüz onaylanmış ödev yok.</td></tr>';
    } else {
        completed.forEach(hw => {
            const date = new Date(hw.due_date).toLocaleDateString('tr-TR');

            // ROZET KONTROLÜ
            let displayTitle = hw.title;
            if (displayTitle.includes('[KELİME_KARTI]')) {
                displayTitle = `<span class="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded text-[10px] font-black mr-2 uppercase tracking-widest border border-purple-200 dark:border-purple-800">TELAFFUZ</span> ` + displayTitle.replace('[KELİME_KARTI]', '').trim();
            } else if (displayTitle.includes('[WRITING]')) {
                displayTitle = `<span class="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-black mr-2 uppercase tracking-widest border border-blue-200 dark:border-blue-800">GRAMER</span> ` + displayTitle.replace('[WRITING]', '').trim();
            }

            let actionButtons = `<span class="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-700 mr-2">ONAYLI</span>`;

            // EĞER GRAMER ÖDEVİYSE, "BEDAVA" İNCELE BUTONUNU EKLE
            if (hw.title.includes('[WRITING]')) {
                const safeDesc = escape(hw.description);
                // isCompleted parametresini "true" gönderiyoruz ki içeride "Onayla" butonu çıkmasın!
                actionButtons += `<button onclick="reviewWriting('${hw.id}', '${hw.student_id}', '${safeDesc}', true)" class="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-xl transition shadow-sm border border-blue-100 dark:border-blue-800 text-[10px] font-black mr-2">İNCELE ↗</button>`;
            }

            actionButtons += `<button onclick="deleteHomework('${hw.id}', '${escapeHTML(hw.title)}')" class="bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2 rounded-xl transition border border-gray-100 dark:border-slate-600" title="Kayıtlardan Sil">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>`;

            tbodyCompleted.innerHTML += `
                <tr class="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-800 transition">
                    <td class="p-4 font-bold text-gray-800 dark:text-white text-sm">${hw.profiles ? escapeHTML(hw.profiles.full_name) : 'Bilinmeyen'}</td>
                    <td class="p-4 text-gray-600 dark:text-gray-300 text-sm truncate max-w-[200px]" title="${escapeHTML(hw.title.replace('[KELİME_KARTI] ', '').replace('[WRITING] ', ''))}">${displayTitle}</td>
                    <td class="p-4 text-emerald-600 dark:text-emerald-400 font-bold text-xs">${date}</td>
                    <td class="p-4 text-right flex items-center justify-end">
                        ${actionButtons}
                    </td>
                </tr>`;
        });

    }
}

window.approveHomework = async function (hwId, studentId) {
    const onay = await customConfirm("Ödevi onaylayıp öğrenciye +50 XP ve +10 EP-Coin kazandırmak istediğinize emin misiniz?", "Evet, Onayla");
    if (!onay) return;

    showToast("Ödev onaylanıyor...", "info");

    const { error } = await supabaseClient.from('homeworks').update({ status: 'Tamamlandı' }).eq('id', hwId);
    if (error) {
        showToast("Hata oluştu: " + error.message, "error");
        return;
    }

    const { data: prof } = await supabaseClient.from('profiles').select('xp, coins').eq('id', studentId).single();
    if (prof) {
        const newXp = (prof.xp || 0) + 50;
        const newCoins = (prof.coins || 0) + 10;
        await supabaseClient.from('profiles').update({ xp: newXp, coins: newCoins }).eq('id', studentId);
    }

    showToast("Ödev onaylandı! +50 XP ve +10 EP-Coin eklendi. 🪙", "success");
    saveLog("Ödev Onaylandı", `Öğrenci ID: ${studentId}, Ödev ID: ${hwId} onaylandı.`);
    fetchHomeworks();
    fetchStudents();
};

// ==========================================
// 5. ETKİNLİK MOTORLARI 
// ==========================================
const activityFormEl = document.getElementById('newActivityForm');
if (activityFormEl) {
    activityFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = activityFormEl.querySelector('button');
        const originalBtnText = btn.innerText;
        btn.innerText = "Yükleniyor...";

        const { error } = await supabaseClient.from('activities').insert([{
            title: document.getElementById('actTitle').value,
            category: document.getElementById('actCategory').value,
            link: document.getElementById('actLink').value,
            teacher_id: currentTeacherId
        }]);

        if (error) showToast("Hata: " + error.message, "error");
        else {
            showToast("Etkinlik kütüphaneye eklendi!", "success");
            activityFormEl.reset();
            fetchActivities();
        }
        btn.innerText = originalBtnText;
    });
}

window.deleteActivity = async (id) => {
    const onay = await customConfirm("Bu etkinliği sileyim mi?", "Evet, Sil");
    if (!onay) return;
    const { error } = await supabaseClient.from('activities').delete().eq('id', id);
    if (error) showToast("Silinirken hata!", "error"); else fetchActivities();
};

// ÜCRETSİZ THUMBNAIL MOTORU (ETKİNLİKLER İÇİN)
function getActivityThumbnail(link, category) {
    if (category === 'video') {
        const ytMatch = link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch && ytMatch[1]) {
            return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
        }
        return 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=400'; // Fallback Video
    }
    if (category === 'game') {
        return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400'; // High-end Gaming Background
    }
    if (category === 'pdf') {
        return 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=400'; // Clean Document Background
    }
    return '';
}

async function fetchActivities() {
    const { data, error } = await supabaseClient.from('activities').select('*').eq('teacher_id', currentTeacherId).order('created_at', { ascending: false });
    const container = document.getElementById('activityCards');
    if (!container || error) return;

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-400 italic font-medium p-10 text-center col-span-full">Kütüphane henüz boş.</p>';
        return;
    }

    container.innerHTML = '';

    data.forEach(act => {
        const thumb = getActivityThumbnail(act.link, act.category);
        const icon = act.category === 'video' ? '📽️' : (act.category === 'game' ? '🎮' : '📄');

        container.innerHTML += `
            <div class="activity-card group relative bg-white dark:bg-slate-800 rounded-[30px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 h-64" data-category="${act.category}">
                <!-- Background Preview -->
                ${thumb ? `
                <div class="absolute inset-0 z-0">
                    <img src="${thumb}" class="w-full h-full object-cover opacity-20 dark:opacity-30 group-hover:scale-105 transition-transform duration-700">
                    <div class="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-800 dark:via-slate-800/80 dark:to-transparent"></div>
                </div>` : ''}

                <div class="relative z-10 p-6 h-full flex flex-col justify-between">
                    <div>
                        <div class="flex justify-between items-start mb-4">
                            <span class="text-2xl">${icon}</span>
                            <div class="flex gap-2">
                                <button onclick="editActivity('${act.id}')" class="p-2.5 bg-white/80 dark:bg-slate-700/80 backdrop-blur-md rounded-xl text-gray-500 hover:text-indigo-600 transition shadow-sm border border-gray-100 dark:border-slate-600" title="Düzenle">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                </button>
                                <button onclick="deleteActivity('${act.id}')" class="p-2.5 bg-white/80 dark:bg-slate-700/80 backdrop-blur-md rounded-xl text-gray-400 hover:text-rose-500 transition shadow-sm border border-gray-100 dark:border-slate-600" title="Sil">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                            </div>
                        </div>
                        <h4 class="font-black text-gray-800 dark:text-white text-sm tracking-tight leading-tight mb-2">${escapeHTML(act.title)}</h4>
                        <span class="text-[10px] font-black text-indigo-500 uppercase tracking-widest">${act.category}</span>
                    </div>
                    
                    <a href="${escapeHTML(act.link)}" target="_blank" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-2xl text-center text-xs tracking-widest shadow-lg shadow-indigo-600/20 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                        AÇ <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                </div>
            </div>`;
    });
}

// ETKİNLİK DÜZENLEME MOTORU
window.editActivity = async (id) => {
    const { data: act, error } = await supabaseClient.from('activities').select('*').eq('id', id).single();
    if (error || !act) return;

    document.getElementById('editActId').value = act.id;
    document.getElementById('editActTitle').value = act.title;
    document.getElementById('editActCategory').value = act.category;
    document.getElementById('editActLink').value = act.link;

    const modal = document.getElementById('activityEditModal');
    const box = document.getElementById('activityEditBox');
    
    // Suggestion check
    const editSug = document.getElementById('editWordwallSuggestion');
    if (editSug) {
        if (act.category === 'game') editSug.classList.remove('hidden');
        else editSug.classList.add('hidden');
    }

    modal.classList.remove('hidden');
    setTimeout(() => { modal.classList.remove('opacity-0'); box.classList.remove('scale-95'); }, 10);
};

window.saveActivityUpdate = async () => {
    const id = document.getElementById('editActId').value;
    const title = document.getElementById('editActTitle').value;
    const category = document.getElementById('editActCategory').value;
    const link = document.getElementById('editActLink').value;

    if (!title || !link) { showToast("Alanları boş bırakma!", "error"); return; }

    const { error } = await supabaseClient.from('activities').update({ title, category, link }).eq('id', id);
    if (error) showToast("Güncellenemedi!", "error");
    else {
        showToast("Etkinlik başarıyla güncellendi.", "success");
        document.getElementById('activityEditModal').classList.add('hidden');
        fetchActivities();
    }
};

// ==========================================
// 6. SINAV MOTORU VE AKILLI SÜRE SEÇİCİ
// ==========================================
let currentActiveQuizId = null;

document.getElementById('addQuizBtn')?.addEventListener('click', () => {
    if (!isPremiumTeacher && currentQuizCount >= 2) {
        openPaywall("Maksimum Sınav Limitine Ulaştınız (2/2)");
        return;
    }
    const modalQuiz = document.getElementById('quizNameModal');
    if (modalQuiz) modalQuiz.classList.remove('hidden');
});

const timeBtns = document.querySelectorAll('.time-btn');
const customTimeContainer = document.getElementById('customTimeContainer');
const finalQuizTime = document.getElementById('finalQuizTime');
const customTimeInput = document.getElementById('quizTimeInput');

if (timeBtns) {
    timeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            timeBtns.forEach(b => {
                b.classList.remove('bg-indigo-600', 'text-white', 'border-indigo-600', 'shadow-md');
                b.classList.add('bg-gray-50', 'text-gray-500', 'border-gray-100', 'dark:bg-slate-700', 'dark:text-gray-300', 'dark:border-slate-600');
            });
            btn.classList.remove('bg-gray-50', 'text-gray-500', 'border-gray-100', 'dark:bg-slate-700', 'dark:text-gray-300', 'dark:border-slate-600');
            btn.classList.add('bg-indigo-600', 'text-white', 'border-indigo-600', 'shadow-md');

            const val = btn.getAttribute('data-time');
            if (val === 'custom') {
                if (customTimeContainer) customTimeContainer.classList.remove('hidden');
                if (customTimeInput) customTimeInput.focus();
                if (finalQuizTime) finalQuizTime.value = 'custom';
            } else {
                if (customTimeContainer) customTimeContainer.classList.add('hidden');
                if (finalQuizTime) finalQuizTime.value = val;
            }
        });
    });
}

const saveQuizTitleBtn = document.getElementById('saveQuizTitleBtn');
if (saveQuizTitleBtn) {
    saveQuizTitleBtn.addEventListener('click', async () => {
        const titleInput = document.getElementById('quizTitleInput');
        const title = titleInput ? titleInput.value : '';
        const timeLimitVal = document.getElementById('finalQuizTime') ? document.getElementById('finalQuizTime').value : '0';

        let timeLimit = 0;

        if (timeLimitVal === 'custom') {
            timeLimit = parseInt(document.getElementById('quizTimeInput').value) || 0;
        } else {
            timeLimit = parseInt(timeLimitVal) || 0;
        }

        if (!title) { showToast("Sınav ismini yazmayı unuttun!", "error"); return; }

        saveQuizTitleBtn.innerText = "Bekle...";

        const { data, error } = await supabaseClient.from('quizzes').insert([{ title, time_limit: timeLimit, teacher_id: currentTeacherId }]).select();

        if (error) { showToast("Hata!", "error"); }
        else {
            showToast("Sınav oluşturuldu! Hadi soru ekleyelim.", "success");
            const modal = document.getElementById('quizNameModal');
            if (modal) modal.classList.add('hidden');
            if (titleInput) titleInput.value = '';
            if (customTimeInput) customTimeInput.value = '';
            fetchQuizzes();
            fetchDashboardStats();
            openQuestionEditor(data[0].id, data[0].title);
        }
        saveQuizTitleBtn.innerHTML = `Oluştur <svg class="w-4 h-4 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>`;
    });
}

window.openQuestionEditor = function (id, title) {
    currentActiveQuizId = id;
    const titleHeader = document.getElementById('currentQuizTitle');
    if (titleHeader) titleHeader.innerText = title;

    const qModal = document.getElementById('questionModal');
    if (qModal) qModal.classList.remove('hidden');

    fetchQuestionsForQuiz(id);
};

async function fetchQuestionsForQuiz(quizId) {
    const { data, error } = await supabaseClient.from('questions').select('*').eq('quiz_id', quizId).order('created_at', { ascending: true });
    const listContainer = document.getElementById('addedQuestionsList');
    const countDisplay = document.getElementById('questionCount');

    if (!listContainer) return;

    if (!data || data.length === 0) {
        if (countDisplay) countDisplay.innerText = "0";
        listContainer.innerHTML = '<div class="text-center py-20 text-gray-300 dark:text-gray-600 font-bold italic">Henüz hiç soru eklenmemiş.</div>';
        return;
    }

    if (countDisplay) countDisplay.innerText = data.length;
    listContainer.innerHTML = '';

    data.forEach((q, index) => {
        listContainer.innerHTML += `
            <div class="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm relative group hover:border-indigo-200 transition">
                <div class="flex items-start">
                    <span class="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black mr-3 mt-1">${index + 1}</span>
                                        <div class="flex-1" lang="en">
                        <p class="text-sm font-black text-gray-800 dark:text-white leading-tight mb-3">${escapeHTML(q.question_text)}</p>
                        <div class="grid grid-cols-2 gap-2 text-xs font-bold">
                            <span class="p-2 rounded-xl ${q.correct_option === 'A' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-300'}">A: ${escapeHTML(q.option_a)}</span>
                            <span class="p-2 rounded-xl ${q.correct_option === 'B' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-300'}">B: ${escapeHTML(q.option_b)}</span>
                            <span class="p-2 rounded-xl ${q.correct_option === 'C' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-300'}">C: ${escapeHTML(q.option_c)}</span>
                            <span class="p-2 rounded-xl ${q.correct_option === 'D' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-300'}">D: ${escapeHTML(q.option_d)}</span>
                        </div>
                    </div>

                </div>
                <button onclick="deleteQuestion('${q.id}')" class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition text-rose-300 hover:text-rose-500 text-2xl font-black">&times;</button>
            </div>`;
    });
}

const questionFormEl = document.getElementById('newQuestionForm');
if (questionFormEl) {
    questionFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = questionFormEl.querySelector('button[type="submit"]');
        btn.innerText = "Kaydediliyor...";

        const { error } = await supabaseClient.from('questions').insert([{
            quiz_id: currentActiveQuizId,
            question_text: document.getElementById('qText').value,
            option_a: document.getElementById('optA').value,
            option_b: document.getElementById('optB').value,
            option_c: document.getElementById('optC').value,
            option_d: document.getElementById('optD').value,
            correct_option: document.getElementById('correctOpt').value
        }]);

        if (error) showToast("Soru kaydedilirken hata: " + error.message, "error");
        else {
            showToast("Soru başarıyla eklendi!", "success");
            questionFormEl.reset();
            fetchQuestionsForQuiz(currentActiveQuizId);
        }
        btn.innerText = "SORUYU KAYDET";
    });
}

window.deleteQuestion = async (id) => {
    const onay = await customConfirm("Bu soruyu sileyim mi?", "Evet, Sil");
    if (!onay) return;
    await supabaseClient.from('questions').delete().eq('id', id);
    showToast("Soru silindi.", "success");
    fetchQuestionsForQuiz(currentActiveQuizId);
};

async function fetchQuizzes() {
    const { data, error } = await supabaseClient.from('quizzes').select('*').eq('teacher_id', currentTeacherId).order('created_at', { ascending: false });
    const container = document.getElementById('quizList');
    if (!container || error) return;

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="col-span-full bg-white dark:bg-slate-800 p-20 rounded-[30px] text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 dark:border-slate-700">Henüz hiç sınav hazırlamamışsın. Yukarıdan ilk sınavını oluştur!</div>`;
        return;
    }

    container.innerHTML = '';
    data.forEach(quiz => {
        container.innerHTML += `
            <div class="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-300 flex justify-between items-center group hover:shadow-md">
                <div class="flex-1 mr-4 overflow-hidden flex items-center gap-4">
                    <div class="hidden sm:flex w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 items-center justify-center text-xl shadow-inner border border-indigo-100 dark:border-indigo-800/50 shrink-0">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    </div>
                    <div class="overflow-hidden">
                        <h4 class="text-base md:text-lg font-black text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">${escapeHTML(quiz.title)}</h4>
                        <p class="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Yayında
                        </p>
                    </div>
                </div>
                <div class="flex items-center space-x-2 shrink-0">
                    <button onclick="openQuestionEditor('${quiz.id}', '${quiz.title.replace(/'/g, "\\'")}')" class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> YÖNET
                    </button>
                        <button onclick="deleteQuiz('${quiz.id}', '${escapeHTML(quiz.title)}')" class="bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2.5 rounded-xl transition border border-gray-100 dark:border-slate-600" title="Sınavı Sil">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                </div>
            </div>`;
    });
}

window.deleteQuiz = async (id, title) => {
    const onay = await safeDelete(`"${escapeHTML(title)}" sınavını ve içindeki TÜM soruları silmek istediğinize emin misiniz?`);
    if (!onay) return;
    const { error } = await supabaseClient.from('quizzes').delete().eq('id', id);
    if (error) { showToast("Hata: " + error.message, "error"); return; }
    showToast("Sınav tamamen silindi.", "success");
    saveLog("Sınav Silindi", `"${title}" sınavı ve içeriği silindi.`);
    fetchQuizzes();
    fetchDashboardStats();
};

// ==========================================
// 7. SONUÇLAR VE ÖĞRETMEN ANALİZ MOTORU
// ==========================================
let currentResultsData = {};

async function fetchResults() {
    const { data, error } = await supabaseClient.from('quiz_results')
        .select(`*, profiles!inner(id, full_name, teacher_id), quizzes(title)`)
        .eq('profiles.teacher_id', currentTeacherId)
        .order('created_at', { ascending: false });

    const tbody = document.getElementById('resultsList');
    if (!tbody || error) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-10 text-center text-gray-400 dark:text-gray-500 italic font-bold">Henüz hiç sınav çözen öğrenci yok.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    currentResultsData = {};

    data.forEach(res => {
        currentResultsData[res.id] = res;
        const dateObj = new Date(res.created_at);
        const date = dateObj.toLocaleDateString('tr-TR') + ' ' + dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        let scoreColor = 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
        if (res.score < 50) scoreColor = 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
        else if (res.score < 80) scoreColor = 'text-yellow-600 bg-yellow-50 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';

        tbody.innerHTML += `
            <tr class="border-b border-gray-50 dark:border-slate-700/50 hover:bg-indigo-50/30 dark:hover:bg-slate-800 transition text-sm">
                <td class="p-4 font-black text-gray-800 dark:text-white">${res.profiles ? escapeHTML(res.profiles.full_name) : 'Bilinmeyen Öğrenci'}</td>
                <td class="p-4 text-gray-600 dark:text-gray-300 font-bold">${res.quizzes ? escapeHTML(res.quizzes.title) : 'Silinmiş Sınav'}</td>
                <td class="p-4 text-center"><span class="px-3 py-1 rounded-xl font-black text-xs uppercase tracking-wider border ${scoreColor}">${res.score} PUAN</span></td>
                <td class="p-4 text-gray-400 dark:text-gray-500 text-xs font-bold">${date}</td>
                <td class="p-4 text-right flex items-center justify-end space-x-2">
                    <button onclick="openTeacherAnalysis('${res.id}')" class="bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1">GÖZ AT <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></button>
                    <button onclick="deleteResult('${res.id}')" class="text-gray-300 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 p-2 rounded-xl transition" title="Sonucu Sil"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </td>
            </tr>`;
    });
}

window.deleteResult = async function (id) {
    const onay = await safeDelete("Bu öğrencinin sınav sonucunu kalıcı olarak silmek istediğinizden emin misiniz?");
    if (!onay) return;
    const { error } = await supabaseClient.from('quiz_results').delete().eq('id', id);
    if (error) { showToast("Hata: " + error.message, "error"); return; }
    showToast("Sınav sonucu silindi.", "success");
    saveLog("Sınav Sonucu Silindi", `Bir sınav sonucu kaydı silindi.`);
    fetchResults();
};

window.openTeacherAnalysis = function (resultId) {
    const res = currentResultsData[resultId];
    if (!res) return;

    document.getElementById('taStudentName').innerText = res.profiles?.full_name || 'Bilinmeyen';
    document.getElementById('taQuizTitle').innerText = res.quizzes?.title || 'Silinmiş';
    document.getElementById('taScoreDisplay').innerText = res.score;
    const taCont = document.getElementById('taDetailsContainer');

    if (taCont) {
        taCont.innerHTML = '';
        const details = res.details || [];
        if (details.length === 0) {
            taCont.innerHTML = '<p class="text-center text-gray-400 font-bold mt-10">Bu sınav için detaylı analiz bulunmuyor.</p>';
        } else {
            details.forEach(detail => {
                const boxStyle = detail.is_correct ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800' : 'border-rose-300 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-800';
                const iconInfo = detail.is_correct
                    ? '<span class="bg-emerald-500 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-sm"><svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></span>'
                    : '<span class="bg-rose-500 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-sm"><svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></span>';
                taCont.innerHTML += `
                    <div class="p-4 md:p-6 rounded-[20px] md:rounded-[30px] border-2 mb-4 md:mb-6 ${boxStyle} shadow-sm">
                        <div class="flex items-start gap-3 md:gap-4 mb-3 md:mb-4">
                            <span class="shrink-0">${iconInfo}</span>
                            <h4 class="text-sm md:text-lg font-black text-gray-800 dark:text-white pt-0.5 md:pt-1 leading-snug">${detail.q_no}. ${escapeHTML(detail.q_text)}</h4>
                        </div>
                        <div class="pl-9 md:pl-12 text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400">
                            Cevabı: ${escapeHTML(detail.selected_opt)} | Doğru: ${escapeHTML(detail.correct_opt)}
                        </div>
                    </div>`;
            });
        }
    }
    document.getElementById('teacherAnalysisModal').classList.remove('hidden');
}

window.closeTeacherAnalysisModal = () => document.getElementById('teacherAnalysisModal').classList.add('hidden');

// ==========================================
// 9. VIP ÖĞRENCİ PROFİLİ VE PDF KARNE MOTORU (ULTRA HIZLI FİX)
// ==========================================
window.openStudentProfile = async function (id, name, phone) {
    document.getElementById('profStudentId').value = id;
    document.getElementById('profParentPhone').value = phone || '';
    document.getElementById('profileStudentName').innerText = name;

    // 🌟 AVATAR YÜKLE: Öğrencinin güncel avatarını çek ve göster
    const avatarPreview = document.getElementById('profileAvatarPreview');
    if (avatarPreview) {
        avatarPreview.innerHTML = '<div class="w-12 h-12 rounded-2xl bg-indigo-50 animate-pulse shrink-0"></div>';
        const { data: profile } = await supabaseClient.from('profiles').select('avatar_config').eq('id', id).single();
        if (profile) {
            avatarPreview.innerHTML = getAvatarPreviewHTML(profile.avatar_config, "w-16 h-16 md:w-20 md:h-20");
        }
    }

    // 🌟 VIP KONTROLÜ: Modal açıldığı anda kilitleri kontrol et
    updatePremiumUI();

    const today = new Date().toLocaleDateString('tr-TR');
    document.getElementById('pdfDate').innerText = today;

    const certDateEl = document.getElementById('certDate');
    if (certDateEl) certDateEl.innerText = today;

    document.getElementById('lessonDate').value = new Date().toISOString().split('T')[0];

    // Modalı göster
    document.getElementById('studentProfileModal').classList.remove('hidden');

    // Ağır işlemleri çok hafif erteleyip işlemciyi rahatlatıyoruz
    setTimeout(() => {
        fetchStudentLessons(id);
    }, 50);
}

const newLessonForm = document.getElementById('newLessonForm');
if (newLessonForm) {
    newLessonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('profStudentId').value;
        const lDate = document.getElementById('lessonDate').value;
        const lTime = document.getElementById('lessonTime').value;
        const lDuration = document.getElementById('lessonDuration').value;
        const lTopic = document.getElementById('lessonTopic').value;
        const lPrice = document.getElementById('lessonPrice').value;
        const lIsPaid = document.getElementById('lessonIsPaid').value === 'true';

        const { error } = await supabaseClient.from('private_lessons').insert([{
            student_id: studentId, lesson_date: lDate, lesson_time: lTime, duration_hours: lDuration, topic: lTopic, price: lPrice, is_paid: lIsPaid, teacher_id: currentTeacherId
        }]);

        if (error) showToast("Ders kaydedilemedi!", "error");
        else {
            showToast("Ders başarıyla profile işlendi.", "success");
            document.getElementById('lessonTopic').value = '';
            document.getElementById('lessonDuration').value = '';
            document.getElementById('lessonPrice').value = '';
            fetchStudentLessons(studentId);
            fetchStudents();
        }
    });
}

let profileChartInstance = null;
let pdfChartInstance = null;

async function fetchStudentLessons(studentId) {
    const { data: lessons } = await supabaseClient.from('private_lessons').select('*').eq('student_id', studentId).order('lesson_date', { ascending: false });
    const list = document.getElementById('lessonList');
    const pdfList = document.getElementById('pdfLessonList');
    if (!list || !pdfList) return;

    if (!lessons || lessons.length === 0) {
        list.innerHTML = '<p class="text-gray-400 dark:text-gray-500 text-sm italic p-4 text-center">Henüz seans kaydı girilmemiş.</p>';
        pdfList.innerHTML = '<p class="text-gray-500 italic">Bu dönem kayıtlı seans bulunmamaktadır.</p>';
        const badgeEl = document.getElementById('unpaidTotalBadge');
        if (badgeEl) badgeEl.classList.add('hidden');
    } else {
        let totalUnpaid = 0;

        // 🚀 PERFORMANS FİX: Döngü içinde innerHTML yapmayı YASAKLADIK! Veriyi hafızada topluyoruz.
        let tempLessonHtml = '';
        let tempPdfLessonHtml = '';

        lessons.forEach(l => {
            const date = new Date(l.lesson_date).toLocaleDateString('tr-TR');
            const time = l.lesson_time ? l.lesson_time : '';
            const duration = l.duration_hours ? `${l.duration_hours} Ders` : '';

            if (!l.is_paid) totalUnpaid += Number(l.price || 0);

            const payBadge = l.is_paid
                ? `<span class="text-[10px] font-black bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md">ÖDENDİ</span>`
                : `<button onclick="markAsPaid('${l.id}', '${studentId}')" class="text-[10px] font-black bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-500 hover:text-white border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-md transition shadow-sm">ÖDENMEDİ (Tahsil Et)</button>`;

            const priceText = l.price ? `<span class="text-[10px] font-black bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-gray-200 px-2 py-1 rounded-md">₺${l.price}</span>` : '';

            tempLessonHtml += `
                <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col hover:border-indigo-200 transition">
                    <div class="flex justify-between items-start">
                        <div class="flex flex-wrap gap-2 mb-2">
                            <span class="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-md flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> ${date}</span>
                            ${time ? `<span class="text-[10px] font-black bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-md flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${time}</span>` : ''}
                            ${duration ? `<span class="text-[10px] font-black bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-md flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg> ${duration}</span>` : ''}
                            ${priceText}
                        </div>
                        <div class="flex gap-2">
                            <button onclick="editLesson('${l.id}')" class="text-gray-300 dark:text-gray-600 hover:text-indigo-500 transition" title="Dersi Düzenle"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                            <button onclick="deleteLesson('${l.id}')" class="text-gray-300 dark:text-gray-600 hover:text-rose-500 transition" title="Kaydı Sil"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                        </div>
                    </div>
                    <p class="text-sm font-bold text-gray-700 dark:text-white mt-1 leading-snug">${escapeHTML(l.topic)}</p>
                    <div class="mt-3 border-t border-gray-50 dark:border-slate-700 pt-2 flex justify-between items-center">
                        ${payBadge}
                    </div>
                </div>`;

            tempPdfLessonHtml += `<div class="mb-4 border-b border-gray-100 pb-3"><p class="text-xs font-black text-indigo-600 tracking-wider">${date}</p><p class="text-sm font-bold text-gray-800 mt-1">${escapeHTML(l.topic)}</p></div>`;
        });

        // Topladığımız HTML'i TEK SEFERDE ekrana basıyoruz!
        list.innerHTML = tempLessonHtml;
        pdfList.innerHTML = tempPdfLessonHtml;

        const badgeEl = document.getElementById('unpaidTotalBadge');
        if (totalUnpaid > 0) { badgeEl.innerText = `Bekleyen: ₺${totalUnpaid}`; badgeEl.classList.remove('hidden'); }
        else { badgeEl.classList.add('hidden'); }
    }

    const { data: results } = await supabaseClient.from('quiz_results').select('score, quizzes(title)').eq('student_id', studentId).order('created_at', { ascending: true });
    const pdfQuizList = document.getElementById('pdfQuizList');
    let labels = [], scores = [];

    if (!results || results.length === 0) {
        if (pdfQuizList) pdfQuizList.innerHTML = '<p class="text-gray-500 italic">Öğrenci henüz sınava girmemiştir.</p>';
        labels = ['Sınav Yok']; scores = [0];
    } else {
        let tempQuizHtml = '';
        results.forEach(r => {
            labels.push(r.quizzes.title); scores.push(r.score);
            let color = r.score >= 80 ? 'text-emerald-600' : (r.score >= 50 ? 'text-yellow-600' : 'text-rose-600');
            tempQuizHtml = `<div class="flex justify-between items-center mb-2 border-b border-gray-100 pb-2"><span class="text-sm font-bold text-gray-700">${escapeHTML(r.quizzes.title)}</span><span class="text-sm font-black ${color}">${r.score} Puan</span></div>` + tempQuizHtml;
        });
        if (pdfQuizList) pdfQuizList.innerHTML = tempQuizHtml;
    }

    // Grafikleri çizmeyi ayrı bir sıraya alıyoruz ki arayüz donmasın!
    setTimeout(() => {
        const chartConfig = (isPdf) => ({
            type: 'line',
            data: { labels: labels, datasets: [{ label: 'Sınav Puanı', data: scores, borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', borderWidth: 3, tension: 0.4, fill: true, pointRadius: 5 }] },
            options: {
                responsive: isPdf ? false : true,
                maintainAspectRatio: false,
                animation: false,
                scales: { y: { beginAtZero: true, max: 100 } },
                plugins: { legend: { display: false } }
            }
        });

        if (profileChartInstance) profileChartInstance.destroy();
        if (pdfChartInstance) pdfChartInstance.destroy();

        const ctxProf = document.getElementById('profileChart');
        const ctxPdf = document.getElementById('pdfChart');
        if (ctxProf) profileChartInstance = new Chart(ctxProf.getContext('2d'), chartConfig(false));
        if (ctxPdf) pdfChartInstance = new Chart(ctxPdf.getContext('2d'), chartConfig(true));
    }, 50);
}

window.deleteLesson = async function (id) {
    if (!await customConfirm("Ders kaydını silmek istediğine emin misin?", "Evet, Sil")) return;
    await supabaseClient.from('private_lessons').delete().eq('id', id);
    fetchStudentLessons(document.getElementById('profStudentId').value);
    fetchStudents();
}

// DERS DÜZENLEME MOTORU
window.editLesson = async (id) => {
    const { data: l, error } = await supabaseClient.from('private_lessons').select('*').eq('id', id).single();
    if (error || !l) return;

    document.getElementById('editLessonId').value = l.id;
    document.getElementById('editLessonDate').value = l.lesson_date;
    document.getElementById('editLessonTime').value = l.lesson_time || '';
    document.getElementById('editLessonDuration').value = l.duration_hours || '';
    document.getElementById('editLessonPrice').value = l.price || '';
    document.getElementById('editLessonIsPaid').value = l.is_paid ? 'true' : 'false';
    document.getElementById('editLessonTopic').value = l.topic || '';

    const modal = document.getElementById('lessonEditModal');
    const box = document.getElementById('lessonEditBox');
    modal.classList.remove('hidden', 'opacity-0');
    box.classList.remove('scale-95');
};

window.saveLessonUpdate = async () => {
    const id = document.getElementById('editLessonId').value;
    const lDate = document.getElementById('editLessonDate').value;
    const lTime = document.getElementById('editLessonTime').value;
    const lDuration = document.getElementById('editLessonDuration').value;
    const lPrice = document.getElementById('editLessonPrice').value;
    const lIsPaid = document.getElementById('editLessonIsPaid').value === 'true';
    const lTopic = document.getElementById('editLessonTopic').value;

    if (!lDate || !lTopic) { showToast("Tarih ve Ders Konusu zorunludur!", "error"); return; }

    const { error } = await supabaseClient.from('private_lessons').update({
        lesson_date: lDate, lesson_time: lTime, duration_hours: lDuration, price: lPrice, is_paid: lIsPaid, topic: lTopic
    }).eq('id', id);

    if (error) showToast("Güncellenemedi!", "error");
    else {
        showToast("Ders kaydı başarıyla güncellendi.", "success");
        document.getElementById('lessonEditModal').classList.add('hidden');
        fetchStudentLessons(document.getElementById('profStudentId').value);
        fetchStudents();
    }
};

window.markAsPaid = async function (lessonId, studentId) {
    showToast("Tahsilat işleniyor...", "info");
    const { error } = await supabaseClient.from('private_lessons').update({ is_paid: true }).eq('id', lessonId);
    if (error) showToast("Hata oluştu: " + error.message, "error");
    else {
        showToast("Para kasaya girdi, ders ödendi olarak işaretlendi!", "success");
        fetchStudentLessons(studentId);
        fetchStudents();
    }
}

// ==========================================
// 10. YENİ DÜZELTİLMİŞ PDF VE SERTİFİKA MOTORU
// ==========================================
window.generatePDF = function () {
    if (!isPremiumTeacher) { openPaywall("PDF Gelişim Raporu VIP Bir Özelliktir"); return; }
    showToast("PDF hazırlanıyor, lütfen bekleyin...", "info");
    const element = document.getElementById('pdfTemplate');
    const sName = document.getElementById('profileStudentName').innerText;
    const opt = { margin: 0, filename: `${sName}_Gelisim_Raporu.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };

    html2pdf().set(opt).from(element).save().then(() => {
        showToast("PDF Başarıyla İndirildi!", "success");
    });
}

window.generateCertificate = function () {
    if (!isPremiumTeacher) { openPaywall("Altın Sertifika VIP Bir Özelliktir"); return; }
    showToast("Altın Sertifika Hazırlanıyor...", "info");
    const element = document.getElementById('certificateTemplate');
    const sName = document.getElementById('profileStudentName').innerText;

    const certNameEl = document.getElementById('certStudentName');
    if (certNameEl) certNameEl.innerText = sName;

    const certTeacherEl = document.getElementById('certTeacherName');
    if (certTeacherEl) certTeacherEl.innerText = currentTeacherName;

    const opt = { margin: 0, filename: `${sName}_VIP_Sertifika.pdf`, image: { type: 'jpeg', quality: 1 }, html2canvas: { scale: 3, useCORS: true, letterRendering: true }, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } };

    html2pdf().set(opt).from(element).save().then(() => {
        showToast("Sertifika Başarıyla İndirildi!", "success");
    });
}

// ==========================================
// 11. YENİ NESİL WHATSAPP VELİ RAPORU MOTORU
// ==========================================
window.sendWhatsAppReport = function () {
    if (!isPremiumTeacher) { openPaywall("Canlı Veli Linki VIP Bir Özelliktir"); return; }
    const studentName = document.getElementById('profileStudentName').innerText;
    const studentId = document.getElementById('profStudentId').value;
    let rawPhone = document.getElementById('profParentPhone').value;

    if (!rawPhone || rawPhone.trim() === '') {
        showToast("Bu öğrencinin veli numarası sisteme kayıtlı değil!", "error");
        return;
    }

    let phone = rawPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (phone.length === 10) phone = '90' + phone;

    const currentUrl = window.location.href.split('/').slice(0, -1).join('/');
    const magicLink = `${currentUrl}/veli.html?id=${studentId}`;

    const message = `Merhaba Sayın Velimiz,\n\nÖğrencimiz *${studentName}*'ın İngilizce derslerindeki güncel gelişim raporu, sınav sonuçları ve ödev durumunu aşağıdaki akıllı linkten inceleyebilirsiniz:\n\n ${magicLink}\n\nİyi günler dilerim!`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
    showToast("Veli sohbeti açılıyor...", "success");
}

// ==========================================
// 12. DİNAMİK KARŞILAMA MESAJI MOTORU
// ==========================================
function setDynamicMotivations() {
    const welcomeMsgs = [
        "Bugün yeni başarı hikayeleri yazmak ve geleceği şekillendirmek için harika bir gün. İyi çalışmalar dileriz!",
        "Öğrencilerinizin hayatında bıraktığınız iz, geleceği aydınlatıyor. Harika bir ders günü olsun!",
        "Bilgi paylaştıkça çoğalır. Bugünün size ve öğrencilerinize yeni ilhamlar getirmesini dileriz.",
        "Sizin rehberliğinizde büyüyen zihinler, yarının umudu. Keyifli ve verimli bir gün geçirmeniz dileğiyle!",
        "İngilizce bir dil değil, dünyaya açılan bir kapıdır. O kapının en iyi anahtarı sizsiniz!",
        "Masanızdaki her not, bir öğrencinin hayallerine giden bir basamak. Emeklerinize sağlık!",
        "Sadece bir dil değil, bir vizyon öğretiyorsunuz. Enerjinizin hiç bitmeyeceği bir gün dileriz.",
        "Gülümsemeniz sınıfın en iyi motivasyonudur. Bugün de harikalar yaratacağınıza eminiz!",
        "VIP eğitim kalitesini her gün zirveye taşıyorsunuz. Sisteminiz sizin için hazır, kolay gelsin!",
        "Öğretmek bir sanattır, siz de bu sanatın en büyük ustalarındansınız. Enerji dolu dersler!"
    ];
    const randomMsg = welcomeMsgs[Math.floor(Math.random() * welcomeMsgs.length)];
    const msgEl = document.getElementById('dynamicWelcomeMsg');
    if (msgEl) msgEl.innerText = randomMsg;
}

// ==========================================
// 13. GECE MODU (DARK MODE) MOTORU
// ==========================================
const dmToggleBtn = document.getElementById('darkModeToggle');
const htmlElement = document.documentElement;
const iconMoon = document.getElementById('icon-moon');
const iconSun = document.getElementById('icon-sun');

if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    htmlElement.classList.add('dark');
    if (iconMoon) iconMoon.classList.add('hidden');
    if (iconSun) iconSun.classList.remove('hidden');
}

if (dmToggleBtn) {
    dmToggleBtn.addEventListener('click', () => {
        htmlElement.classList.toggle('dark');
        if (htmlElement.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
            if (iconMoon) iconMoon.classList.add('hidden');
            if (iconSun) iconSun.classList.remove('hidden');
            showToast("Gece Modu Aktif", "success");
        } else {
            localStorage.setItem('theme', 'light');
            if (iconMoon) iconMoon.classList.remove('hidden');
            if (iconSun) iconSun.classList.add('hidden');
            showToast("Gündüz Modu Aktif", "success");
        }
    });
}

// ==========================================
// 14. GERÇEK ZAMANLI ÖĞRENCİ ARAMA MOTORU
// ==========================================
const searchStudentInput = document.getElementById('searchStudentInput');

if (searchStudentInput) {
    searchStudentInput.addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLocaleLowerCase('tr-TR');
        const studentCards = document.querySelectorAll('#studentList > div.group');
        let visibleCount = 0;

        studentCards.forEach(card => {
            const studentNameEl = card.querySelector('h4');
            if (studentNameEl) {
                const studentName = studentNameEl.innerText.toLocaleLowerCase('tr-TR');
                if (studentName.includes(searchTerm)) {
                    card.style.display = '';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            }
        });

        let noResultMsg = document.getElementById('noSearchResultInfo');

        if (visibleCount === 0 && studentCards.length > 0) {
            if (!noResultMsg) {
                noResultMsg = document.createElement('div');
                noResultMsg.id = 'noSearchResultInfo';
                noResultMsg.className = 'w-full text-center py-10 text-gray-400 dark:text-gray-500 font-bold shrink-0 flex flex-col items-center gap-2';
                noResultMsg.innerHTML = '<svg class="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> <span>Böyle bir öğrenci bulunamadı</span>';
                document.getElementById('studentList').appendChild(noResultMsg);
            } else {
                noResultMsg.style.display = '';
            }
        } else if (noResultMsg) {
            noResultMsg.style.display = 'none';
        }
    });
}

// ==========================================
// 15. YAPAY ZEKA (AI) OTOMATİK SINAV MOTORU (GÜNCELLENDİ)
// ==========================================
const btnGenerateAI = document.getElementById('btnGenerateAI');
if (btnGenerateAI) {
    btnGenerateAI.addEventListener('click', async () => {
        // PREMIUM KONTROLÜ
        if (!isPremiumTeacher) {
            openPaywall("Yapay Zeka Sınav Üreticisi VIP Bir Özelliktir");
            return;
        }

        if (!currentActiveQuizId) { showToast('Önce bir sınav seçmelisin!', 'error'); return; }

        const topicInput = document.getElementById('aiTopicInput');
        const countInput = document.getElementById('aiQuestionCount');

        const topic = topicInput ? topicInput.value.trim() : '';
        let qCount = countInput ? parseInt(countInput.value) : 5;

        if (!topic) { showToast('Lütfen yapay zeka için bir konu yazın!', 'error'); return; }
        if (isNaN(qCount) || qCount < 1) qCount = 5;
        if (qCount > 20) qCount = 20;

        const originalText = btnGenerateAI.innerHTML;
        btnGenerateAI.innerHTML = '<svg class="animate-spin h-5 w-5 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
        btnGenerateAI.disabled = true;

        // NOT: Artık API key önyüzde çekilmiyor.
        /*
        const { data: godProfile, error: godErr } = await supabaseClient.from('profiles').select('openai_key').eq('role', 'god').single();
        if (godErr || !godProfile || !godProfile.openai_key) {
            showToast("Sistem hatası: API şifresi bulunamadı! Lütfen patrona bildirin.", "error");
            btnGenerateAI.innerHTML = originalText;
            btnGenerateAI.disabled = false;
            return;
        }
        const apiKey = godProfile.openai_key;
        */

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: `Sen uzman bir İngilizce öğretmenisin. Verilen konuya göre tam ${qCount} adet çoktan seçmeli (A, B, C, D) İngilizce sorusu hazırla. Çıktıyı SADECE ve KESİNLİKLE geçerli bir JSON dizisi formatında ver. Soru ve şıklardaki İngilizce kelimelerde kesinlikle Türkçe karakter (İ, ı, ş, ğ vb.) kullanma, sadece standart İngilizce alfabesi kullan. Markdown kullanma. Format: [{"q": "Soru", "a": "A", "b": "B", "c": "C", "d": "D", "correct": "A"}]` },
                        { role: 'user', content: `Konu: ${topic}` }
                    ],
                    temperature: 0.7
                })
            });

            const data = await response.json();
            if (data.error) throw data.error;

            let jsonStr = data.choices[0].message.content.trim();
            if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace('```json', '');
            if (jsonStr.endsWith('```')) jsonStr = jsonStr.replace('```', '');
            jsonStr = jsonStr.trim();

            const questions = JSON.parse(jsonStr);
            showToast(`Yapay zeka ${questions.length} soru yazdı! Yükleniyor...`, 'info');

            const inserts = questions.map(q => ({
                quiz_id: currentActiveQuizId, question_text: q.q, option_a: q.a, option_b: q.b, option_c: q.c, option_d: q.d, correct_option: q.correct
            }));

            const { error } = await supabaseClient.from('questions').insert(inserts);
            if (error) throw error;

            showToast(`Sihir gerçekleşti! ${questions.length} soru eklendi.`, 'success');
            if (topicInput) topicInput.value = '';
            fetchQuestionsForQuiz(currentActiveQuizId);

        } catch (err) {
            console.error(err);
            showToast('Sorular üretilemedi. Patronun API şifresi geçersiz olabilir.', 'error');
        }

        btnGenerateAI.innerHTML = originalText;
        btnGenerateAI.disabled = false;
    });
}

// ==========================================
// 16. PAYWALL (ÖDEME DUVARI) MOTORU
// ==========================================
window.openPaywall = function (reasonText) {
    const reasonEl = document.getElementById('paywallReason');
    if (reasonEl) reasonEl.innerText = reasonText;
    const modal = document.getElementById('paywallModal');
    const box = document.getElementById('paywallBox');
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); if (box) box.classList.remove('scale-95'); }, 10);
    }
}

window.closePaywall = function () {
    const modal = document.getElementById('paywallModal');
    const box = document.getElementById('paywallBox');
    if (modal) {
        modal.classList.add('opacity-0');
        if (box) box.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

// ==========================================
// 17. DİNAMİK FİYAT VE ÖDEME LİNKİ ÇEKME MOTORU
// ==========================================
async function fetchGodVipPrice() {
    const { data } = await supabaseClient.from('profiles').select('vip_price').eq('role', 'god').single();

    // Fiyat etiketleri
    const el1 = document.getElementById('displayPrice1');
    const el3 = document.getElementById('displayPrice3');
    const el12 = document.getElementById('displayPrice12');

    // Satın al butonları (panel.html'de bu id'leri eklediğinden emin ol)
    const btn1 = document.getElementById('buyBtn1');
    const btn3 = document.getElementById('buyBtn3');
    const btn12 = document.getElementById('buyBtn12');

    if (data && data.vip_price) {
        try {
            const parsed = JSON.parse(data.vip_price);

            // Fiyatları yazdır
            if (el1) el1.innerText = "₺" + (parsed.p1 || "250");
            if (el3) el3.innerText = "₺" + (parsed.p3 || "600");
            if (el12) el12.innerText = "₺" + (parsed.p12 || "2000");

            // Buton linklerini dinamik olarak tanımla
            if (btn1) {
                btn1.onclick = () => { window.open(parsed.l1 || '#', '_blank'); closePaywall(); showToast("Ödeme sayfasına yönlendiriliyorsunuz...", "info"); };
            }
            if (btn3) {
                btn3.onclick = () => { window.open(parsed.l3 || '#', '_blank'); closePaywall(); showToast("Ödeme sayfasına yönlendiriliyorsunuz...", "info"); };
            }
            if (btn12) {
                btn12.onclick = () => { window.open(parsed.l12 || '#', '_blank'); closePaywall(); showToast("Ödeme sayfasına yönlendiriliyorsunuz...", "info"); };
            }

        } catch (e) {
            console.log("Fiyat ve link verisi okunamadı.");
        }
    }
}
fetchGodVipPrice();



// ==========================================
// 18. YAPAY ZEKA KELİME KARTLARI (FLASHCARD) MOTORU (GÜNCELLENDİ)
// ==========================================
let generatedFlashcards = [];

window.openFlashcardSihirbazi = async function () {
    // PREMIUM KONTROLÜ
    if (!isPremiumTeacher) {
        openPaywall("Yapay Zeka Kelime Sihirbazı VIP Bir Özelliktir");
        return;
    }

    const { data } = await supabaseClient.from('profiles').select('id, full_name').eq('role', 'student').eq('teacher_id', currentTeacherId);
    const select = document.getElementById('fcStudentSelect');
    if (data && select) {
        select.innerHTML = '<option value="">Öğrenci Seçin...</option><option value="all" class="text-purple-600 font-black">🌟 TÜM SINIFA GÖNDER 🌟</option>';
        data.forEach(s => { select.innerHTML += `<option value="${s.id}">${s.full_name}</option>`; });
    }
    document.getElementById('aiFlashcardModal').classList.remove('hidden');
}

const btnGenerateFlashcards = document.getElementById('btnGenerateFlashcards');
if (btnGenerateFlashcards) {
    btnGenerateFlashcards.addEventListener('click', async () => {
        const topic = document.getElementById('fcTopic').value.trim();
        const count = document.getElementById('fcCount').value;

        if (!topic) { showToast('Lütfen bir konu yazın!', 'error'); return; }

        const originalText = btnGenerateFlashcards.innerHTML;
        btnGenerateFlashcards.innerHTML = 'Üretiliyor... Bekleyin ⏳';
        btnGenerateFlashcards.disabled = true;

        // NOT: API Key artık sunucuda gizli tutuluyor.
        /*
        const { data: godProfile, error: godErr } = await supabaseClient.from('profiles').select('openai_key').eq('role', 'god').single();
        if (godErr || !godProfile || !godProfile.openai_key) {
            showToast("Sistem hatası: API şifresi bulunamadı! Lütfen patrona bildirin.", "error");
            btnGenerateFlashcards.innerHTML = originalText;
            btnGenerateFlashcards.disabled = false;
            return;
        }
        const apiKey = godProfile.openai_key;
        */

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: `Sen bir İngilizce öğretmenisin. Verilen konuyla ilgili tam ${count} adet İngilizce kelime, Türkçe çevirisi ve IPA fonetik yazılışını üret. Çıktıyı SADECE JSON formatında dizi olarak ver. IPA yazılışı kısa ve basit olsun, slash olmadan yaz. Format: [{"en":"Apple", "tr":"Elma", "ph":"ˈæp.əl"}, {"en":"Run", "tr":"Koşmak", "ph":"rʌn"}]` },
                        { role: 'user', content: `Konu: ${topic}` }
                    ],
                    temperature: 0.7
                })
            });

            const data = await response.json();
            if (data.error) throw data.error;

            let jsonStr = data.choices[0].message.content.trim();
            if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace('```json', '').replace('```', '');

            generatedFlashcards = JSON.parse(jsonStr.trim());

            const listContainer = document.getElementById('fcWordsList');
            listContainer.innerHTML = '';
            generatedFlashcards.forEach((word, index) => {
                listContainer.innerHTML += `
                    <div class="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                        <span class="font-black text-indigo-600 dark:text-indigo-400 text-sm">${index + 1}. ${word.en}</span>
                        <span class="font-bold text-gray-500 dark:text-gray-400 text-xs">${word.tr}</span>
                    </div>`;
            });

            document.getElementById('fcPreviewContainer').classList.remove('hidden');
            showToast('Kelimeler başarıyla üretildi!', 'success');

        } catch (err) {
            console.error(err);
            showToast('API Hatası! Patronun şifresi geçersiz olabilir.', 'error');
        }

        btnGenerateFlashcards.innerHTML = originalText;
        btnGenerateFlashcards.disabled = false;
    });
}

const btnAssignFlashcards = document.getElementById('btnAssignFlashcards');
if (btnAssignFlashcards) {
    btnAssignFlashcards.addEventListener('click', async () => {
        const studentId = document.getElementById('fcStudentSelect').value;
        const topic = document.getElementById('fcTopic').value.trim();

        if (!studentId) { showToast('Bir öğrenci seçmelisin!', 'error'); return; }
        if (generatedFlashcards.length === 0) { showToast('Önce kelime üretmelisin!', 'error'); return; }

        btnAssignFlashcards.innerText = "Gönderiliyor...";

        // Zekice taktik: Ödev başlığına gizli kod ekliyoruz. 
        const taskTitle = `[KELİME_KARTI] ${topic}`;
        const taskData = JSON.stringify(generatedFlashcards);

        // Gelecek ayın tarihini verelim süre dolmasın
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        const dueDateStr = dueDate.toISOString().split('T')[0];

        let inserts = [];
        if (studentId === 'all') {
            // Sınıftaki herkese ata
            const { data: allStudents } = await supabaseClient.from('profiles').select('id').eq('role', 'student').eq('teacher_id', currentTeacherId);
            inserts = allStudents.map(s => ({
                student_id: s.id, title: taskTitle, description: taskData, due_date: dueDateStr, status: 'Bekliyor', teacher_id: currentTeacherId
            }));
        } else {
            // Tek öğrenciye ata
            inserts = [{
                student_id: studentId, title: taskTitle, description: taskData, due_date: dueDateStr, status: 'Bekliyor', teacher_id: currentTeacherId
            }];
        }

        const { error } = await supabaseClient.from('homeworks').insert(inserts);

        if (error) { showToast("Atama hatası!", "error"); }
        else {
            showToast("Kelime Kartları öğrenciye başarıyla gönderildi! 🚀", "success");
            document.getElementById('aiFlashcardModal').classList.add('hidden');
            document.getElementById('fcPreviewContainer').classList.add('hidden');
            document.getElementById('fcTopic').value = '';
            fetchHomeworks(); // Tabloyu güncelle
        }
        btnAssignFlashcards.innerText = "GÖREVİ GÖNDER";
    });
}

// ==========================================
// AKILLI DUYURU ASİSTANI (GLOBAL + KİŞİSEL)
// ==========================================
async function checkAnnouncements() {
    try {
        const { data: godData } = await supabaseClient.from('profiles').select('announcement').eq('role', 'god').single();
        const globalMsg = godData?.announcement?.trim();
        const { data: { user } } = await supabaseClient.auth.getUser();
        const { data: myData } = await supabaseClient.from('profiles').select('announcement').eq('id', user.id).single();
        const personalMsg = myData?.announcement?.trim();

        const dashboardSection = document.getElementById('section-dashboard');
        const header = dashboardSection ? dashboardSection.querySelector('header') : null;

        if (header) {
            function createBannerHTML(msg, title, color, id) {
                return `
                    <div id="${id}" class="max-w-7xl mx-auto w-full px-4 md:px-6 mt-4 transition-all duration-700 transform -translate-y-5 opacity-0 z-0">
                        <div class="bg-gradient-to-r from-${color}-50 to-${color}-100/50 dark:from-${color}-900/20 dark:to-${color}-800/20 border border-${color}-200 dark:border-${color}-700/50 rounded-2xl p-4 md:p-5 shadow-sm flex items-start md:items-center justify-between gap-4 relative overflow-hidden group">
                            <div class="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                                <svg class="w-24 h-24 text-${color}-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clip-rule="evenodd"></path></svg>
                            </div>
                            <div class="flex items-center gap-4 relative z-10">
                                <div class="bg-${color}-100 dark:bg-${color}-900/50 text-${color}-600 dark:text-${color}-400 w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-${color}-200 dark:border-${color}-700 shadow-inner">
                                    <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                </div>
                                <div>
                                    <h4 class="text-[10px] font-black text-${color}-500 dark:text-${color}-400 uppercase tracking-widest mb-0.5">${title}</h4>
                                    <p class="text-sm md:text-base font-bold text-${color}-900 dark:text-${color}-100 leading-snug">${msg}</p>
                                </div>
                            </div>
                            <button onclick="document.getElementById('${id}').style.display='none'" class="text-${color}-400 hover:text-${color}-600 dark:hover:text-${color}-300 transition relative z-10 p-2 bg-${color}-50 dark:bg-${color}-900/30 rounded-xl hover:bg-${color}-100 dark:hover:bg-${color}-900/50" title="Kapat">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    </div>
                `;
            }

            if (globalMsg) {
                header.insertAdjacentHTML('afterend', createBannerHTML(globalMsg, 'SİSTEM DUYURUSU', 'amber', 'globalAnnouncement'));
                setTimeout(() => document.getElementById('globalAnnouncement')?.classList.remove('-translate-y-5', 'opacity-0'), 500);
            }
            if (personalMsg) {
                const target = document.getElementById('globalAnnouncement') || header;
                target.insertAdjacentHTML('afterend', createBannerHTML(personalMsg, 'SİZE ÖZEL BİLDİRİM', 'indigo', 'personalAnnouncement'));
                setTimeout(() => document.getElementById('personalAnnouncement')?.classList.remove('-translate-y-5', 'opacity-0'), 700);
            }
        }
    } catch (e) { console.log("Duyuru asistanı çalıştırılamadı."); }
}
checkAnnouncements(); // Yeni fonksiyonu çağırıyoruz





// ==========================================
// ETKİNLİK FİLTRELEME MOTORU
// ==========================================
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Aktif buton stilini sıfırla ve yeni butona mor efekti ver
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.classList.remove('bg-purple-600', 'text-white', 'shadow-[0_0_15px_rgba(147,51,234,0.4)]');
            b.classList.add('bg-white', 'dark:bg-slate-800', 'text-gray-500', 'dark:text-gray-400');
        });

        const targetBtn = e.currentTarget;
        targetBtn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-gray-500', 'dark:text-gray-400');
        targetBtn.classList.add('bg-purple-600', 'text-white', 'shadow-[0_0_15px_rgba(147,51,234,0.4)]');

        // Kartları filtrele
        const filterValue = targetBtn.getAttribute('data-filter');
        const cards = document.querySelectorAll('#activityCards > div');

        cards.forEach(card => {
            if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});


// ==========================================
// GÖRÜNMEZ RADAR: SON GİRİŞ ZAMANINI GÜNCELLE
// ==========================================
async function pingLastLogin() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
            // Sadece sisteme giren öğretmenin last_login sütununa o anki saati yazar
            await supabaseClient.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', user.id);
        }
    } catch (e) {
        console.log("Radar ping hatası (Önemsiz):", e);
    }
}
// Sayfa yüklendiğinde radarı 1 kez ateşle
setTimeout(pingLastLogin, 2000);


// MOTORLARI ATEŞLE
if (typeof setDynamicMotivations === 'function') setDynamicMotivations();
// checkTeacherSecurity(); // 🌟 KALDIRILDI: Bu fonksiyon tanımlı olmadığı için hata veriyordu.



// ==========================================
// YEPYENİ CTO MOTORLARI (V1.15)
// ==========================================
// 1. SESSİZ TAHSİLAT (WHATSAPP) MOTORU
window.sendDebtReminder = function (lessonDate, price) {
    const studentName = document.getElementById('profileStudentName').innerText;
    let rawPhone = document.getElementById('profParentPhone').value;
    if (!rawPhone || rawPhone.trim() === '') { showToast("Veli numarası kayıtlı değil!", "error"); return; }
    let phone = rawPhone.replace(/\D/g, ''); if (phone.startsWith('0')) phone = phone.substring(1); if (phone.length === 10) phone = '90' + phone;
    const dateObj = new Date(lessonDate); const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const msg = `*SİSTEM BİLGİLENDİRMESİ*\n\nMerhaba Sayın Velimiz,\n\nEnglish Portal VIP sistem kayıtlarına göre, öğrencimiz *${studentName}* ile ${formattedDate} tarihinde işlenen dersimize ait *${price} TL* tutarındaki ödemenin beklemede olduğu görülmektedir.\n\nSistem kayıtlarının güncellenebilmesi adına otomatik olarak hatırlatmak istedik.\n\nİyi günler dileriz.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    showToast("WhatsApp açılıyor...", "success");
}

// ==========================================
// 2. YENİ NESİL WRITING (GRAMER) SİHİRBAZI MOTORU
// ==========================================
window.openWritingModal = async function () {
    if (!isPremiumTeacher) { openPaywall("AI Gramer Asistanı VIP Bir Özelliktir"); return; }

    // Öğrencileri listeye doldur
    const { data } = await supabaseClient.from('profiles').select('id, full_name').eq('role', 'student').eq('teacher_id', currentTeacherId);
    const select = document.getElementById('awStudentSelect');
    if (data && select) {
        select.innerHTML = '<option value="">Öğrenci Seçin...</option><option value="all" class="text-blue-600 font-black">🌟 TÜM SINIFA GÖNDER 🌟</option>';
        data.forEach(s => { select.innerHTML += `<option value="${s.id}">${s.full_name}</option>`; });
    }

    // Tarihi yarına ayarla ve konuyu temizle
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('awDueDate').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('awTopic').value = '';

    // Sihirbazı aç
    document.getElementById('aiWritingModal').classList.remove('hidden');
};

const btnAssignWriting = document.getElementById('btnAssignWriting');
if (btnAssignWriting) {
    btnAssignWriting.addEventListener('click', async () => {
        const topic = document.getElementById('awTopic').value.trim();
        const studentId = document.getElementById('awStudentSelect').value;
        const dueDate = document.getElementById('awDueDate').value;

        if (!topic) { showToast('Lütfen bir konu belirleyin!', 'error'); return; }
        if (!studentId) { showToast('Lütfen kime gideceğini seçin!', 'error'); return; }
        if (!dueDate) { showToast('Lütfen teslim tarihi seçin!', 'error'); return; }

        const originalText = btnAssignWriting.innerHTML;
        btnAssignWriting.innerHTML = '<span class="animate-pulse">⏳ GÖNDERİLİYOR...</span>';
        btnAssignWriting.disabled = true;

        const taskTitle = `[WRITING] ${topic}`;
        const desc = "Yapay Zeka Gramer Koçu metninizi bekliyor...";

        let inserts = [];
        if (studentId === 'all') {
            const { data: allStudents } = await supabaseClient.from('profiles').select('id').eq('role', 'student').eq('teacher_id', currentTeacherId);
            inserts = allStudents.map(s => ({
                student_id: s.id, title: taskTitle, description: desc, due_date: dueDate, status: 'Bekliyor', teacher_id: currentTeacherId
            }));
        } else {
            inserts = [{
                student_id: studentId, title: taskTitle, description: desc, due_date: dueDate, status: 'Bekliyor', teacher_id: currentTeacherId
            }];
        }

        const { error } = await supabaseClient.from('homeworks').insert(inserts);

        if (error) {
            showToast("Görev atanamadı: " + error.message, "error");
            btnAssignWriting.innerHTML = originalText;
            btnAssignWriting.disabled = false;
        } else {
            btnAssignWriting.innerHTML = 'BAŞARILI!';
            btnAssignWriting.classList.remove('from-blue-600', 'to-indigo-600');
            btnAssignWriting.classList.add('from-emerald-500', 'to-green-500');

            showToast("Gramer görevi başarıyla atandı! 🚀", "success");
            fetchHomeworks();
            fetchDashboardStats();

            // 1.5 saniye başarıyı göster ve modalı kapat
            setTimeout(() => {
                document.getElementById('aiWritingModal').classList.add('hidden');
                btnAssignWriting.innerHTML = originalText;
                btnAssignWriting.classList.remove('from-emerald-500', 'to-green-500');
                btnAssignWriting.classList.add('from-blue-600', 'to-indigo-600');
                btnAssignWriting.disabled = false;
            }, 1500);
        }
    });
}




// YENİ: ÖĞRETMEN İÇİN İNCELEME MOTORU (GÜNCELLENDİ)
window.reviewWriting = function (hwId, studentId, descRaw, isCompleted = false) {
    const desc = unescape(descRaw);
    const parts = desc.split('[YAPAY ZEKA DEĞERLENDİRMESİ]');
    let studentText = parts[0].replace('[ÖĞRENCİ METNİ]', '').trim();
    let aiFeedback = parts[1] ? parts[1].trim() : 'Değerlendirme bulunamadı.';

    document.getElementById('rwStudentText').innerText = studentText;
    document.getElementById('rwAiFeedback').innerText = aiFeedback;

    const approveBtn = document.getElementById('rwApproveBtn');
    if (isCompleted) {
        // Eğer ödev zaten onaylandıysa, hocanın karşısına bir daha "Onayla ve XP Ver" butonu çıkarma
        approveBtn.style.display = 'none';
    } else {
        approveBtn.style.display = 'flex';
        approveBtn.onclick = () => {
            approveHomework(hwId, studentId);
            document.getElementById('reviewWritingModal').classList.add('hidden');
        };
    }

    document.getElementById('reviewWritingModal').classList.remove('hidden');
}
window.closeReviewWritingModal = () => document.getElementById('reviewWritingModal').classList.add('hidden');

// 3. TELAFİ SINAVI (SMART REDEMPTION) MOTORU
window.generateRedemptionQuiz = async function () {
    if (!isPremiumTeacher) { openPaywall("Akıllı Telafi Sınavı VIP Bir Özelliktir"); return; }
    const studentId = document.getElementById('profStudentId').value;
    const firstName = document.getElementById('profileStudentName').innerText.split(' ')[0];
    const onay = await customConfirm(`${firstName} isimli öğrencinin geçmiş sınavlardaki tüm yanlışlarından özel bir Telafi Sınavı üretmek istiyor musunuz?`, "Evet, Üret");
    if (!onay) return;
    showToast("Yapay zeka geçmiş hataları tarıyor...", "info");
    const { data: results } = await supabaseClient.from('quiz_results').select('details').eq('student_id', studentId);
    if (!results || results.length === 0) { showToast("Geçmiş sınav verisi yok.", "error"); return; }
    let wrongQs = [];
    results.forEach(res => { if (res.details) res.details.forEach(d => { if (!d.is_correct) wrongQs.push(d); }); });
    const uniqueWrongs = Array.from(new Map(wrongQs.map(item => [item.q_text, item])).values());
    if (uniqueWrongs.length === 0) { showToast("Harika! Bu öğrencinin hiç yanlışı yok.", "success"); return; }
    const selected = uniqueWrongs.slice(0, 10); // Maksimum 10 soru çek
    const { data: quizData, error: quizErr } = await supabaseClient.from('quizzes').insert([{ title: `[TELAFİ] ${firstName} - Eksik Kapatma Sınavı`, time_limit: 15, teacher_id: currentTeacherId }]).select();
    if (quizErr) { showToast("Sınav oluşturulamadı.", "error"); return; }
    const inserts = selected.map(q => ({ quiz_id: quizData[0].id, question_text: q.q_text, option_a: q.optA, option_b: q.optB, option_c: q.optC, option_d: q.optD, correct_option: q.correct_opt }));
    await supabaseClient.from('questions').insert(inserts);
    showToast(`Mükemmel! ${selected.length} soruluk telafi sınavı oluşturuldu.`, "success");
}

// 4. KİŞİYE ÖZEL MESAJ GÖNDERME MOTORU
window.sendPersonalMessage = async function (teacherId) {
    const inputEl = document.getElementById(`ann_${teacherId}`);
    if (!inputEl) return;
    showToast("Özel mesaj iletiliyor...", "info");
    const { error } = await supabaseClient.from('profiles').update({ announcement: inputEl.value }).eq('id', teacherId);
    if (error) showToast("Mesaj gönderilemedi!", "error");
    else showToast("Özel mesaj hocanın paneline sabitlendi!", "success");
};


// ==========================================
// 3. YAPAY ZEKA VELİ RAPORU ASİSTANI
// ==========================================
window.openAIReportModal = async function () {
    if (!isPremiumTeacher) { openPaywall("Yapay Zeka Veli Raporu VIP Bir Özelliktir"); return; }

    const studentId = document.getElementById('profStudentId').value;
    const studentName = document.getElementById('profileStudentName').innerText;
    const parentPhone = document.getElementById('profParentPhone').value;

    if (!parentPhone || parentPhone.trim() === '') {
        showToast("Bu öğrencinin veli numarası kayıtlı değil!", "error");
        return;
    }

    const modal = document.getElementById('aiReportModal');
    const textArea = document.getElementById('aiReportContent');
    const waBtn = document.getElementById('btnSendAiReportWA');

    textArea.value = '';
    textArea.placeholder = "Yapay zeka öğrenci verilerini (Notlar, Ödevler, Borçlar) analiz edip mesajı hazırlıyor. Lütfen bekleyin... ⏳";
    waBtn.disabled = true;
    waBtn.classList.add('opacity-50');
    modal.classList.remove('hidden');

    showToast("Yapay zeka öğrenci verilerini tarıyor...", "info");

    // Veritabanından öğrencinin röntgenini çekiyoruz
    const { data: quizResults } = await supabaseClient.from('quiz_results').select('score').eq('student_id', studentId);
    const { data: homeworks } = await supabaseClient.from('homeworks').select('status').eq('student_id', studentId);
    const { data: lessons } = await supabaseClient.from('private_lessons').select('topic, is_paid, price').eq('student_id', studentId);

    let avg = 0;
    if (quizResults && quizResults.length > 0) avg = Math.round(quizResults.reduce((a, b) => a + b.score, 0) / quizResults.length);

    let hwRate = 0;
    if (homeworks && homeworks.length > 0) {
        const completed = homeworks.filter(h => h.status === 'Tamamlandı').length;
        hwRate = Math.round((completed / homeworks.length) * 100);
    }

    let recentTopics = "";
    let debt = 0;
    if (lessons && lessons.length > 0) {
        recentTopics = lessons.slice(0, 3).map(l => l.topic).join(', ');
        lessons.forEach(l => { if (!l.is_paid) debt += Number(l.price || 0); });
    }

    // NOT: API şifresi backend tarafında tutuluyor.
    /*
    const { data: godProfile } = await supabaseClient.from('profiles').select('openai_key').eq('role', 'god').single();
    if (!godProfile || !godProfile.openai_key) {
        textArea.placeholder = "API şifresi eksik. İşlem başarısız.";
        return;
    }
    */

    // YZ'ye verdiğimiz o efsanevi komut
    const promptText = `Öğrencinin Adı: ${studentName}. İngilizce Sınav Ortalaması: %${avg}. Ödev Yapma Oranı: %${hwRate}. Son işlenen konular: ${recentTopics || 'Genel İngilizce'}. Sen profesyonel, VIP bir İngilizce öğretmenisin. Veliye WhatsApp üzerinden atılmak üzere, öğrencinin bu istatistiklerine dayanarak kibar, motive edici ve pedagojik bir durum değerlendirme raporu yaz. Veliye doğrudan hitap et. Çok uzun olmasın, maksimum 3-4 cümle. ${debt > 0 ? 'Not: Velinin sana ' + debt + ' TL ödenmemiş ders borcu var, bunu da metnin sonuna son derece kibar ve nazik bir dille "gecikmiş ödemeniz bulunuyor" gibi bir ifadeyle iliştir.' : 'Borç yok, paradan kesinlikle bahsetme.'} Sonuna da "Detaylı gelişim raporu ve canlı takip için linke tıklayın:" yazıp bırak (ben linki ekleyeceğim).`;

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: "Sen VIP, profesyonel ve pedagojik dil kullanan bir öğretmensin. Metinlerinde yıldız (**) veya kalın harf kullanma." },
                    { role: 'user', content: promptText }
                ],
                temperature: 0.7
            })
        });

        const resData = await response.json();
        let aiText = resData.choices[0].message.content.trim();

        // Canlı linki sonuna ekle
        const currentUrl = window.location.href.split('/').slice(0, -1).join('/');
        const magicLink = `${currentUrl}/veli.html?id=${studentId}`;
        aiText += `\n\n🔗 Canlı Veli Paneli: ${magicLink}`;

        textArea.value = aiText;
        textArea.placeholder = "";
        waBtn.disabled = false;
        waBtn.classList.remove('opacity-50');
        showToast("Rapor hazır!", "success");

    } catch (e) {
        textArea.placeholder = "Bağlantı hatası oluştu.";
    }
}

// WhatsApp Gönderme Tetikleyicisi
window.sendAiReportWhatsApp = function () {
    let rawPhone = document.getElementById('profParentPhone').value;
    let phone = rawPhone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (phone.length === 10) phone = '90' + phone;

    const text = document.getElementById('aiReportContent').value;
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
    document.getElementById('aiReportModal').classList.add('hidden');
    showToast("WhatsApp açılıyor...", "success");
}
// ==========================================
// 10. BANKA AYARLARI (IBAN YÖNETİMİ)
// ==========================================
window.openBankSettings = function () {
    const modal = document.getElementById('bankSettingsModal');
    const inputIban = document.getElementById('teacherIbanInput');
    const inputReceiver = document.getElementById('teacherBankReceiverInput');
    if (modal) {
        if (inputIban) inputIban.value = currentTeacherIban;
        if (inputReceiver) inputReceiver.value = currentTeacherBankReceiver;
        modal.classList.remove('hidden');
    }
}

window.saveBankSettings = async function () {
    if (!currentTeacherId) return;
    const inputIban = document.getElementById('teacherIbanInput');
    const inputReceiver = document.getElementById('teacherBankReceiverInput');

    const newIban = inputIban.value.trim().toUpperCase();
    const newReceiver = inputReceiver.value.trim();

    showToast("Bilgiler güncelleniyor...", "info");

    const { error } = await supabaseClient
        .from('profiles')
        .update({
            bank_iban: newIban,
            bank_receiver: newReceiver
        })
        .eq('id', currentTeacherId);

    if (error) {
        showToast("Hata oluştu: " + error.message, "error");
    } else {
        currentTeacherIban = newIban;
        currentTeacherBankReceiver = newReceiver;
        showToast("Banka bilgileriniz başarıyla kaydedildi.", "success");
        document.getElementById('bankSettingsModal').classList.add('hidden');
    }
}

// ==========================================
// 14. SINIF YÖNETİM MOTORU (STAGE 2)
// ==========================================
window.openAddClassModal = async function () {
    const modal = document.getElementById('addClassModal');
    const container = document.getElementById('classStudentChoices');
    if (!modal || !container) return;

    modal.classList.remove('hidden');
    container.innerHTML = '<div class="text-center p-4 text-xs text-gray-400">Öğrenciler yükleniyor...</div>';

    const { data: students } = await supabaseClient.from('profiles').select('id, full_name').eq('teacher_id', currentTeacherId).eq('role', 'student');

    if (!students || students.length === 0) {
        container.innerHTML = '<div class="text-center p-4 text-xs text-red-400 font-bold">Henüz kayıtlı öğrenciniz yok.</div>';
        return;
    }

    container.innerHTML = students.map(s => `
        <label class="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition">
            <input type="checkbox" name="classStudents" value="${s.id}" class="w-4 h-4 text-indigo-600 rounded border-gray-300">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${escapeHTML(s.full_name)}</span>
        </label>
    `).join('');
}

window.closeAddClassModal = function () {
    const modal = document.getElementById('addClassModal');
    if (modal) modal.classList.add('hidden');
}

const addClassForm = document.getElementById('addClassForm');
let editingClassId = null;

if (addClassForm) {
    addClassForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('className').value;
        const selectedStudents = Array.from(document.querySelectorAll('input[name="classStudents"]:checked')).map(el => el.value);

        if (!name) return;

        const btn = addClassForm.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.innerText = "İşlem Yapılıyor...";
        btn.disabled = true;

        if (editingClassId) {
            // GÜNCELLEME MODU
            const { error: updateErr } = await supabaseClient.from('classes').update({ name: name }).eq('id', editingClassId);
            if (updateErr) { showToast("Sınıf güncellenemedi!", "error"); btn.innerText = originalText; btn.disabled = false; return; }

            // Eski öğrencileri sil ve yenileri ekle
            await supabaseClient.from('class_students').delete().eq('class_id', editingClassId);
            if (selectedStudents.length > 0) {
                const inserts = selectedStudents.map(sid => ({ class_id: editingClassId, student_id: sid }));
                await supabaseClient.from('class_students').insert(inserts);
            }
            showToast("Sınıf başarıyla güncellendi.", "success");
            saveLog("Sınıf Güncellendi", `"${name}" sınıfı düzenlendi. Toplam ${selectedStudents.length} öğrenci.`);
        } else {
            // YENİ OLUŞTURMA MODU
            const { data: cls, error } = await supabaseClient.from('classes').insert([{ teacher_id: currentTeacherId, name: name }]).select().single();
            if (error) { showToast("Sınıf oluşturulamadı!", "error"); btn.innerText = originalText; btn.disabled = false; return; }

            if (selectedStudents.length > 0) {
                const inserts = selectedStudents.map(sid => ({ class_id: cls.id, student_id: sid }));
                await supabaseClient.from('class_students').insert(inserts);
            }
            showToast("Sınıf başarıyla oluşturuldu.", "success");
            saveLog("Sınıf Oluşturuldu", `${name} isimli sınıf ${selectedStudents.length} öğrenci ile kuruldu.`);
        }

        closeAddClassModal();
        addClassForm.reset();
        fetchClasses();
        btn.innerText = originalText;
        btn.disabled = false;
    });
}

window.manageClassStudents = async function (id) {
    editingClassId = id;
    const { data: cls } = await supabaseClient.from('classes').select('name, class_students(student_id)').eq('id', id).single();
    if (!cls) return;

    document.getElementById('className').value = cls.name;
    const modalTitle = document.querySelector('#addClassModal h3');
    if (modalTitle) modalTitle.innerText = "Sınıfı Düzenle";

    const submitBtn = document.querySelector('#addClassForm button[type="submit"]');
    if (submitBtn) submitBtn.innerText = "Değişiklikleri Kaydet";

    // Öğrenci listesini yükle ve checked yap
    await openAddClassModal();

    const currentStudentIds = cls.class_students.map(cs => cs.student_id);
    document.querySelectorAll('input[name="classStudents"]').forEach(input => {
        if (currentStudentIds.includes(input.value)) {
            input.checked = true;
        }
    });

    document.getElementById('addClassModal').classList.remove('hidden');
};

// Sınıf Verilerini Çek
async function fetchClasses() {
    const container = document.getElementById('classList');
    if (!container) return;
    container.innerHTML = '<div class="col-span-full text-center py-20 animate-pulse text-indigo-400 font-bold uppercase tracking-widest leading-relaxed">Sınıf Yapıları Hazırlanıyor...</div>';

    const { data: classes, error } = await supabaseClient.from('classes').select('*, class_students(student_id, profiles(full_name))').eq('teacher_id', currentTeacherId);

    if (error || !classes || classes.length === 0) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center p-20 bg-gray-50 dark:bg-slate-800/50 rounded-[40px] border-4 border-dashed border-gray-200 dark:border-slate-700">
                <div class="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mb-6">
                    <svg class="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m4 0h1m-5 4h1m4 0h1m-5 4h1m4 0h1"></path></svg>
                </div>
                <p class="text-xl font-black text-gray-400 uppercase tracking-widest italic">Henüz Bir Sınıf Oluşturmadınız</p>
                <button onclick="openAddClassModal()" class="mt-4 text-indigo-600 font-bold hover:underline">İlk Sınıfınızı Oluşturun &rarr;</button>
            </div>
        `;
        return;
    }

    container.innerHTML = classes.map(c => {
        const studentCount = c.class_students?.length || 0;
        const studentNames = c.class_students?.map(cs => cs.profiles?.full_name).filter(Boolean).join(', ') || 'Henüz öğrenci yok';

        return `
            <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-2xl transition-all group relative overflow-hidden">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg font-black text-xl">
                            ${c.name.charAt(0).toUpperCase()}
                        </div>
                        <button onclick="deleteClass('${c.id}', '${c.name}')" class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                    <h3 class="text-xl font-black text-gray-800 dark:text-white mb-1 uppercase tracking-tight">${escapeHTML(c.name)}</h3>
                    <p class="text-xs font-bold text-indigo-500 dark:text-indigo-400 mb-4">${studentCount} Öğrenci Kayıtlı</p>
                    
                    <div class="space-y-2 mb-6">
                        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-1">Öğrenci Listesi</p>
                        <p class="text-[11px] text-gray-500 dark:text-gray-400 font-medium line-clamp-2 italic">${escapeHTML(studentNames)}</p>
                    </div>

                    <div class="flex gap-2">
                        <button onclick="manageClassStudents('${c.id}')" class="flex-1 py-3 bg-gray-50 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white text-gray-600 dark:text-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-sm border border-gray-100 dark:border-slate-600">Öğrencileri Yönet</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.deleteClass = async function (id, name) {
    const confirmed = await safeDelete(`"${name}" sınıfını silmek üzeresiniz. Bu işlem sınıf listesini temizler ancak öğrencileri silmez.`);
    if (!confirmed) return;

    const { error } = await supabaseClient.from('classes').delete().eq('id', id);
    if (error) { showToast("Sınıf silinemedi!", "error"); return; }

    showToast("Sınıf silindi.", "success");
    saveLog("Sınıf Silindi", `${name} isimli sınıf ve atomik bağları kaldırıldı.`);
    fetchClasses();
}

// 🌟 GÜVENLİ SİLME MEKANİZMASI (STAGE 2) 🌟
async function safeDelete(message) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = "fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[10000] p-4 animate-in fade-in duration-300";

        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-900 rounded-[40px] p-8 w-full max-w-sm shadow-2xl border-4 border-red-500/20 transform animate-in zoom-in duration-300">
                <div class="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h3 class="text-2xl font-black text-center text-slate-800 dark:text-white mb-2 uppercase">KRİTİK ONAY</h3>
                <p class="text-center text-slate-500 dark:text-slate-400 text-sm font-medium mb-8">${message}</p>
                <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-3xl mb-6 border border-slate-100 dark:border-slate-700">
                    <p class="text-[10px] font-black text-slate-400 uppercase text-center mb-3">Onaylamak için aşağıya <span class="text-red-600 font-black">SİL</span> yazın</p>
                    <input type="text" id="deleteConfirmInput" class="w-full bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl text-center font-black uppercase tracking-widest text-red-600 focus:border-red-500 outline-none transition" placeholder="..." autocomplete="off">
                </div>
                <div class="flex gap-3">
                    <button id="sdCancel" class="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition">İPTAL</button>
                    <button id="sdConfirm" class="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-600/30 hover:bg-red-700 transition opacity-50 cursor-not-allowed" disabled>SİL</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const input = modal.querySelector('#deleteConfirmInput');
        const btnOk = modal.querySelector('#sdConfirm');
        const btnCancel = modal.querySelector('#sdCancel');

        input.focus();
        input.addEventListener('input', (e) => {
            if (e.target.value.trim().toUpperCase() === 'SİL') {
                btnOk.disabled = false;
                btnOk.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                btnOk.disabled = true;
                btnOk.classList.add('opacity-50', 'cursor-not-allowed');
            }
        });

        btnOk.onclick = () => { modal.remove(); resolve(true); };
        btnCancel.onclick = () => { modal.remove(); resolve(false); };
    });
}

// 🌟 VERİ YEDEKLEME (CSV EXPORT) 🌟
window.exportDataToCSV = async function () {
    showToast("Veriler derleniyor...", "info");

    // Öğrenciler ve Sınav Sonuçlarını Çek
    const { data: students } = await supabaseClient.from('profiles').select('*').eq('teacher_id', currentTeacherId).eq('role', 'student');
    const { data: results } = await supabaseClient.from('quiz_results').select('*, profiles!inner(*)').eq('profiles.teacher_id', currentTeacherId);

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "English Portal VIP - Sistem Yedegi\n";
    csvContent += "Tarih: " + new Date().toLocaleString() + "\n\n";

    // 1. Öğrenci Listesi
    csvContent += "OGRENCI LISTESI\n";
    csvContent += "Ad Soyad;Email;Veli Telefon;Bakiye\n";
    students.forEach(s => {
        csvContent += `${s.full_name};${s.email};${s.parent_phone};${s.balance || 0} TL\n`;
    });

    csvContent += "\n\nSINAV SONUCLARI\n";
    csvContent += "Ogrenci;Sinav;Puan;Tarih\n";
    results.forEach(r => {
        csvContent += `${r.profiles.full_name};${r.quiz_title || 'Bilinmiyor'};${r.score};${new Date(r.created_at).toLocaleDateString()}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `EnglishPortal_Yedek_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Yedekleme başarıyla tamamlandı.", "success");
    saveLog("Veri Yedekleme", "Tüm sistem verileri CSV formatında indirildi.");
}

// ==========================================
// 🌟 10. DİJİTAL BEYAZ TAHTA & CANLI DERS MOTORU (STAGE 3) 🌟
// ==========================================

async function fetchWhiteboard() {
    const textarea = document.getElementById('whiteboardInput');
    const lessonInput = document.getElementById('lessonUrlInput');
    if (!textarea) return;

    // 1. Beyaz Tahta İçeriğini Çek
    const { data: wb } = await supabaseClient.from('whiteboard').select('content').eq('teacher_id', currentTeacherId).maybeSingle();
    if (wb) {
        textarea.value = wb.content;
    } else {
        textarea.value = "";
    }

    // 2. Canlı Ders Linkini Çek (Profil Tablosundan)
    const { data: prof } = await supabaseClient.from('profiles').select('lesson_url').eq('id', currentTeacherId).single();
    if (prof && lessonInput) {
        lessonInput.value = prof.lesson_url || "";
    }
}

window.saveWhiteboard = async function () {
    const content = document.getElementById('whiteboardInput').value;
    const btn = document.querySelector('[onclick="saveWhiteboard()"]');
    const originalHTML = btn.innerHTML;

    btn.innerHTML = '⏳ YAYINLANIYOR...';
    btn.disabled = true;

    // Önce kaydın olup olmadığını kontrol et
    const { data: existing } = await supabaseClient.from('whiteboard').select('id').eq('teacher_id', currentTeacherId).maybeSingle();

    let error;
    if (existing) {
        const { error: err } = await supabaseClient.from('whiteboard').update({ content: content, updated_at: new Date().toISOString() }).eq('teacher_id', currentTeacherId);
        error = err;
    } else {
        const { error: err } = await supabaseClient.from('whiteboard').insert([{ teacher_id: currentTeacherId, content: content }]);
        error = err;
    }

    if (error) {
        showToast("Tahta güncellenemedi: " + error.message, "error");
    } else {
        showToast("Beyaz Tahta başarıyla güncellendi ve yayınlandı! 🚀", "success");
        saveLog("Beyaz Tahta", "Ders notları güncellendi ve tüm öğrencilere yayınlandı.");
    }

    btn.innerHTML = originalHTML;
    btn.disabled = false;
}

window.saveLessonUrl = async function () {
    const url = document.getElementById('lessonUrlInput').value.trim();
    if (url && !url.startsWith('http')) {
        showToast("Lütfen geçerli bir URL girin (http/https ile başlayan)", "error");
        return;
    }

    const { error } = await supabaseClient.from('profiles').update({ lesson_url: url }).eq('id', currentTeacherId);

    if (error) {
        showToast("Link güncellenemedi!", "error");
    } else {
        showToast("Canlı Ders linki başarıyla kaydedildi.", "success");
        saveLog("Canlı Ders", "Eğitim linki güncellendi: " + (url || "Kaldırıldı"));
    }
}

// ==========================================
// WORDWALL ÖNERİ MOTORU (DİNAMİK)
// ==========================================
function setupWordwallSuggestions() {
    const actCat = document.getElementById('actCategory');
    const actSug = document.getElementById('wordwallSuggestion');
    if (actCat && actSug) {
        actCat.addEventListener('change', () => {
            if (actCat.value === 'game') actSug.classList.remove('hidden');
            else actSug.classList.add('hidden');
        });
    }

    const editCat = document.getElementById('editActCategory');
    const editSug = document.getElementById('editWordwallSuggestion');
    if (editCat && editSug) {
        editCat.addEventListener('change', () => {
            if (editCat.value === 'game') editSug.classList.remove('hidden');
            else editSug.classList.add('hidden');
        });
    }
}

// Sistemi Başlat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        checkActiveSession();
        setupWordwallSuggestions();
    });
} else {
    checkActiveSession();
    setupWordwallSuggestions();
}

// EOF (Stage 3 Ready)
