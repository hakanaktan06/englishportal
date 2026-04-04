// ==========================================
// 1. SUPABASE BAĞLANTISI
// ==========================================
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let currentStudentId = null;
let currentStudentTeacherId = null; // 🌟 GÜVENLİK: Sadece kendi hocasının verilerini görmesi için
let currentQuizQuestions = []; 
let activeTakingQuizId = null;
let quizTimerInterval = null; 

document.querySelector('main')?.addEventListener('touchstart', function() {}, {passive: true});

// ==========================================
// GÜVENLİK: XSS KORUMA MOTORU (ÇELİK YELEK)
// ==========================================
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
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-500' : (type === 'error' ? 'bg-rose-500' : 'bg-indigo-500');
    
    const iconSvg = type === 'success' 
        ? `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>` 
        : (type === 'error' 
            ? `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>` 
            : `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`);

    toast.className = `${bgColor} text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-${bgColor}/30 font-bold text-sm flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0`;
    toast.innerHTML = `<span class="flex-shrink-0">${iconSvg}</span> <span>${escapeHTML(message)}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => { toast.classList.remove('translate-y-10', 'opacity-0'); }, 10);
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
// ÇIKIŞ MOTORU VE MENÜ
// ==========================================
document.addEventListener('click', async (e) => {
    if (e.target.closest('#studentLogoutBtn')) {
        const onay = await customConfirm("Oturumunu kapatmak istediğine emin misin?", "Evet, Çıkış Yap");
        if(!onay) return;
        await saveLog("Sistemden Çıkış Yapıldı");
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
    if(sidebarMain) sidebarMain.classList.toggle('-translate-x-full');
    if(sideOverlay) sideOverlay.classList.toggle('hidden');
}

if(sideOpenBtn) sideOpenBtn.addEventListener('click', toggleMobileSidebar);
if(sideCloseBtn) sideCloseBtn.addEventListener('click', toggleMobileSidebar);
if(sideOverlay) sideOverlay.addEventListener('click', toggleMobileSidebar);

// ==========================================
// TEMA MOTORU
// ==========================================
const dmToggleBtn = document.getElementById('darkModeToggle');
const htmlElement = document.documentElement;
const iconMoon = document.getElementById('icon-moon');
const iconSun = document.getElementById('icon-sun');

if (localStorage.getItem('studentTheme') === 'dark' || (!('studentTheme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    htmlElement.classList.add('dark');
    if (iconMoon) iconMoon.classList.add('hidden');
    if (iconSun) iconSun.classList.remove('hidden');
}

if (dmToggleBtn) {
    dmToggleBtn.addEventListener('click', () => {
        htmlElement.classList.toggle('dark');
        if (htmlElement.classList.contains('dark')) {
            localStorage.setItem('studentTheme', 'dark');
            if (iconMoon) iconMoon.classList.add('hidden');
            if (iconSun) iconSun.classList.remove('hidden');
            showToast("Gece Modu Aktif", "success");
            saveLog("Tema Değiştirildi", "Gece Modu Aktif");
        } else {
            localStorage.setItem('studentTheme', 'light');
            if (iconMoon) iconMoon.classList.remove('hidden');
            if (iconSun) iconSun.classList.add('hidden');
            showToast("Gündüz Modu Aktif", "success");
            saveLog("Tema Değiştirildi", "Gündüz Modu Aktif");
        }
    });
}

// ==========================================
// AKORDEON (AÇILIR) MENÜ MOTORU
// ==========================================
window.toggleSubMenu = function(menuId, iconId) {
    const el = document.getElementById(menuId);
    const icon = document.getElementById(iconId);
    if(el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        el.classList.add('flex');
        if(icon) icon.classList.add('rotate-180');
    } else {
        el.classList.add('hidden');
        el.classList.remove('flex');
        if(icon) icon.classList.remove('rotate-180');
    }
}

// LOG MOTORU (CIHAZ BILGISI ILE)
async function saveLog(action, details = "") {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;
        const device = navigator.userAgent;
        const enrichedDetails = `${details}${details ? ' | ' : ''}Cihaz: ${device}`;
        await supabaseClient.from('audit_logs').insert([{
            user_id: user.id,
            action: action,
            details: enrichedDetails,
            created_at: new Date().toISOString()
        }]);
    } catch (e) { console.error("Log hatası:", e); }
}

// ==========================================
// 2. OTURUM KONTROLÜ VE SPLASH EKRANI KAPATMA
// ==========================================
async function initStudentPortal() {
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

        // Eğer buradaysak yetki TAMAM. Splash'i hemen kapatalım.
        const splash = document.getElementById('splashScreen');
        if (splash) {
            splash.classList.add('opacity-0');
            setTimeout(() => splash.classList.add('hidden'), 700);
        }

        currentStudentId = user.id;
        saveLog("Sisteme Giriş Yapıldı");

        // 🌟 STEP 2: Detaylı Verileri Arkadan Çek (Non-blocking)
        loadExtendedStudentProfile(user.id);
        
        // 🌟 4. AVATAR & SHOP MOUNT
        initShop();
        preloadImages(); 

    } catch (e) {
        console.error("Güvenlik sistemi hatası:", e);
    }
}

async function loadExtendedStudentProfile(userId) {
    try {
        const { data: profile, error } = await supabaseClient.from('profiles').select('*').eq('id', userId).single();
        
        if (error || !profile) {
            console.warn("Profil detayları çekilemedi (Bazı kolonlar eksik olabilir):", error);
            return;
        }

        // UI Güncellemeleri
        const nameEl = document.getElementById('studentNameDisplay');
        if(nameEl) nameEl.innerText = profile.full_name || 'Öğrenci'; 
        
        const welcomeEl = document.getElementById('welcomeStudentName');
        if(welcomeEl) {
            const fullName = profile.full_name || 'Öğrenci';
            const firstName = fullName.split(' ')[0];
            welcomeEl.innerText = firstName;
        }

        // Markalama
        if (profile.school_name) document.querySelectorAll('.school-name-display').forEach(el => el.innerText = profile.school_name);
        if (profile.school_logo) document.querySelectorAll('.school-logo-display').forEach(el => el.src = profile.school_logo);

        // 🌟 İSTATİSTİKLER (Hata vermemesi için korumalı)
        const xp = profile.xp || 0;
        const coins = profile.coins || 0;
        const level = Math.floor(xp / 500) + 1;

        document.querySelectorAll('.xp-display').forEach(el => el.innerText = xp);
        document.querySelectorAll('.coins-display').forEach(el => el.innerText = coins);
        document.querySelectorAll('.level-display').forEach(el => el.innerText = level);

        const elXp = document.getElementById('studentXpText');
        const elLevel = document.getElementById('studentLevelText');
        const elCoins = document.getElementById('studentCoinText');
        const elShopCoins = document.getElementById('shopCoinDisplay');
        
        if (elXp) elXp.innerText = xp;
        if (elLevel) elLevel.innerText = level;
        if (elCoins) elCoins.innerText = coins;
        if (elShopCoins) elShopCoins.innerText = coins;

        // Avatarını Yükle
        if (profile.avatar_config && typeof applyAvatarConfig === 'function') {
            applyAvatarConfig(profile.avatar_config);
        }

        // 🌟 GÜVENLİK: Hoca ID'sini sabitle
        currentStudentTeacherId = profile.teacher_id;

        // 🌟 STAGE 3: BEYAZ TAHTA VE CANLI DERS 🌟
        if (profile.teacher_id) {
            console.log("Hoca ID Tespit Edildi, Beyaz Tahta ve Canlı Ders Başlatılıyor ID:", profile.teacher_id);
            initWhiteboardRealtime(profile.teacher_id);
            checkLiveLesson(profile.teacher_id);
        }

        // 🌟 BAŞLANGIÇ SEKİMESİNİ YÜKLE
        switchTab('homeworks');

    } catch (e) { 
        console.error("Öğrenci profil detay yükleme hatası:", e); 
    }
}



// ==========================================
// 3. SEKMELER ARASI GEÇİŞ
// ==========================================
function switchTab(target) {
    if(window.innerWidth < 768 && sidebarMain && !sidebarMain.classList.contains('-translate-x-full')) {
        toggleMobileSidebar();
    }

    const sections = ['section-homeworks', 'section-activities', 'section-quizzes', 'section-results', 'section-shop'];
    sections.forEach(sec => {
        const el = document.getElementById(sec);
        if(el) el.classList.add('hidden');
    });

    const activeBtns = document.querySelectorAll('.menu-btn');
    activeBtns.forEach(btn => {
        btn.classList.remove('bg-indigo-800', 'shadow-inner', 'text-white');
        if(btn.id !== 'btn-homeworks') btn.classList.add('text-indigo-300');
    });

    const targetSec = document.getElementById(`section-${target}`);
    const targetBtn = document.getElementById(`btn-${target}`);

    if(targetSec) targetSec.classList.remove('hidden');
    if(targetBtn) {
        if(targetBtn.id === 'btn-homeworks') {
            targetBtn.classList.add('bg-indigo-800', 'shadow-inner');
        } else {
            targetBtn.classList.remove('text-indigo-300');
            targetBtn.classList.add('text-white');
        }
    }

    if (target === 'homeworks') fetchMyHomeworks();
    if (target === 'activities') fetchActivities();
    if (target === 'quizzes') fetchQuizzes();
    if (target === 'results') fetchMyResults();
    if (target === 'shop') initShop();

    // 🌟 LOG: Sekme Geçişini Kaydet
    const tabNames = { 'homeworks': 'Ödevler', 'activities': 'Etkinlikler', 'quizzes': 'Sınavlar', 'results': 'Sonuçlar', 'shop': 'Market' };
    saveLog("Sekme Değiştirildi", `Gidilen Sekme: ${tabNames[target] || target}`);
}

document.getElementById('btn-homeworks')?.addEventListener('click', (e) => { e.preventDefault(); switchTab('homeworks'); });
document.getElementById('btn-quizzes')?.addEventListener('click', (e) => { e.preventDefault(); switchTab('quizzes'); });
document.getElementById('btn-results')?.addEventListener('click', (e) => { e.preventDefault(); switchTab('results'); });
document.getElementById('btn-shop')?.addEventListener('click', (e) => { e.preventDefault(); switchTab('shop'); });

// ==========================================
// 3.1 SES EFEKTLERİ YARDIMCISI
// ==========================================
function playSound(type) {
    const sounds = {
        'success': 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
        'click': 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        'error': 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
        'buy': 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'
    };
    if (sounds[type]) {
        const audio = new Audio(sounds[type]);
        audio.volume = 0.5;
        audio.play().catch(() => {}); // Autoplay blokajı için catch
    }
}

// ==========================================
// 4. AVATAR & SHOP (RPG SİSTEMİ)
// ==========================================
let currentAvatarConfig = { base: 0, skin: -1, inventory: [] };

const SHOP_DATA = {
    bases: [
        { id: 0, name: "Kâşif", price: 0, img: "/assets/avatars/base_0_v1.png", desc: "Yeni dünyalar keşfetmeye hazır, meraklı bir gezgin." },
        { id: 1, name: "Savaşçı", price: 100, img: "/assets/avatars/base_1_v1.png", desc: "Cesareti ve kılıcıyla adalet dağıtan bir şövalye." },
        { id: 2, name: "Büyücü", price: 250, img: "/assets/avatars/base_2_v1.png", desc: "Kadim büyülerin ve elementlerin gizemli efendisi." },
        { id: 3, name: "Robot", price: 500, img: "/assets/avatars/base_3_v1.png", desc: "Geleceğin teknolojisiyle donatılmış yapay zeka." },
        { id: 4, name: "Ninja", price: 750, img: "/assets/avatars/base_4_v1.png", desc: "Gölgelerin içinde sessizce hareket eden usta bir suikastçı." },
        { id: 5, name: "Kral", price: 1000, img: "/assets/avatars/base_5_v1.png", desc: "Halkını koruyan ve ordulara hükmeden yüce bir hükümdar." }
    ],
    skins: [
        // Kâşif Serisi (Base 0)
        { id: 101, baseId: 0, name: "Kâşif V1 (Standart)", price: 0, img: "/assets/avatars/base_0_v1.png", desc: "Maceraya yeni başlayanlar için temel donanım." },
        { id: 102, baseId: 0, name: "Kâşif V2 (Safari)", price: 250, img: "/assets/avatars/base_0_v2.png", desc: "Vahşi doğada gizlenmek ve hayatta kalmak için özel giysi." },
        { id: 103, baseId: 0, name: "Kâşif V3 (Derin Deniz)", price: 750, img: "/assets/avatars/base_0_v3.png", desc: "Okyanusun karanlık derinliklerini keşfetmek için üretildi." },
        { id: 104, baseId: 0, name: "Kâşif V4 (Kutup)", price: 1500, img: "/assets/avatars/base_0_v4.png", desc: "Dondurucu soğuklarda bile sıcak tutan termal teknoloji." },
        { id: 105, baseId: 0, name: "Kâşif V5 (Uzay)", price: 3000, img: "/assets/avatars/base_0_v5.png", desc: "Yıldızlararası yolculuklar için tasarlanmış son seviye astronot zırhı." },
        
        // Savaşçı Serisi (Base 1)
        { id: 111, baseId: 1, name: "Savaşçı V1 (Bronz)", price: 0, img: "/assets/avatars/base_1_v1.png", desc: "Eğitimini yeni tamamlamış bir piyade zırhı." },
        { id: 112, baseId: 1, name: "Savaşçı V2 (Gümüş Şövalye)", price: 250, img: "/assets/avatars/base_1_v2.png", desc: "Parlayan gümüş zırhıyla sahanın en asil savaşçısı." },
        { id: 113, baseId: 1, name: "Savaşçı V3 (Paladin)", price: 750, img: "/assets/avatars/base_1_v3.png", desc: "Kutsal ışıkla kutsanmış, kötülüğe karşı yıkılmaz bir kale." },
        { id: 114, baseId: 1, name: "Savaşçı V4 (Ejderha Avcısı)", price: 1500, img: "/assets/avatars/base_1_v4.png", desc: "Kanatlı devleri dize getirenlerin giydiği obsidyen zırh." },
        { id: 115, baseId: 1, name: "Savaşçı V5 (Gök Savaşçısı)", price: 3000, img: "/assets/avatars/base_1_v5.png", desc: "Galaksiyi koruduğu için gökyüzünün enerjisiyle ödüllendirildi." },

        // Büyücü Serisi (Base 2)
        { id: 121, baseId: 2, name: "Büyücü V1 (Çırak)", price: 0, img: "/assets/avatars/base_2_v1.png", desc: "Temel büyü sanatlarını öğrenen bir başlangıç asası." },
        { id: 122, baseId: 2, name: "Büyücü V2 (Simyacı)", price: 250, img: "/assets/avatars/base_2_v2.png", desc: "İksirlerin ve metal dönüşümlerinin uzmanı." },
        { id: 123, baseId: 2, name: "Büyücü V3 (Druid)", price: 750, img: "/assets/avatars/base_2_v3.png", desc: "Doğanın ve hayvanların ruhuyla konuşan yeşil büyücü." },
        { id: 124, baseId: 2, name: "Büyücü V4 (Ölüm Büyücüsü)", price: 1500, img: "/assets/avatars/base_2_v4.png", desc: "Karanlık diyarlardan gelen, ruhlara hükmeden korkutucu güç." },
        { id: 125, baseId: 2, name: "Büyücü V5 (Bilge Arş-Büyücü)", price: 3000, img: "/assets/avatars/base_2_v5.png", desc: "Evrenin tüm sırlarını çözmüş, zamanı durdurabilen yüce bilge." },

        // Robot Serisi (Base 3)
        { id: 131, baseId: 3, name: "Robot V1 (Keşif Botu)", price: 0, img: "/assets/avatars/base_3_v1.png", desc: "Veri toplamak ve etrafı gözlemek için programlandı." },
        { id: 132, baseId: 3, name: "Robot V2 (Endüstriyel Titan)", price: 250, img: "/assets/avatars/base_3_v2.png", desc: "Ağır yükleri taşımak ve kaleleri yıkmak için üretilen dev." },
        { id: 133, baseId: 3, name: "Robot V3 (Tıbbi Ünite)", price: 750, img: "/assets/avatars/base_3_v3.png", desc: "Gelişmiş lazer teknolojisiyle yaraları anında iyileştirir." },
        { id: 134, baseId: 3, name: "Robot V4 (Savaş Mekası)", price: 1500, img: "/assets/avatars/base_3_v4.png", desc: "Lazer toplarıyla orduyu tek başına durdurabilen bir savaş canavarı." },
        { id: 135, baseId: 3, name: "Robot V5 (Mekanik Tiran)", price: 3000, img: "/assets/avatars/base_3_v5.png", desc: "Duygulardan yoksun, sadece mutlak güç için programlanmış karanlık zeka." },

        // Ninja Serisi (Base 4)
        { id: 141, baseId: 4, name: "Ninja V1 (Klasik)", price: 0, img: "/assets/avatars/base_4_v1.png", desc: "Sessiz adımlar ve temel ninjutsu eğitimi." },
        { id: 142, baseId: 4, name: "Ninja V2 (Kızıl El)", price: 250, img: "/assets/avatars/base_4_v2.png", desc: "Ateş elementini kullanan, hızıyla rakiplerini şaşırtan ninja." },
        { id: 143, baseId: 4, name: "Ninja V3 (Siber Ninjutsu)", price: 750, img: "/assets/avatars/base_4_v3.png", desc: "Neon ışıklarıyla kaplı, teknolojiyle harmanlanmış bir gölge suikastçı." },
        { id: 144, baseId: 4, name: "Ninja V4 (Hayalet)", price: 1500, img: "/assets/avatars/base_4_v4.png", desc: "Duvarların içinden geçebilen, varlığıyla yokluğu bir olan efsane." },
        { id: 145, baseId: 4, name: "Ninja V5 (Büyük Üstat)", price: 3000, img: "/assets/avatars/base_4_v5.png", desc: "Binlerce yıllık gizli tekniklerin yaşayan son temsilcisi." },

        // Kral Serisi (Base 5)
        { id: 151, baseId: 5, name: "Kral V1 (Genç Prens)", price: 0, img: "/assets/avatars/base_5_v1.png", desc: "Tahtı devralmaya hazırlanan asil bir varis." },
        { id: 152, baseId: 5, name: "Kral V2 (Firavun)", price: 250, img: "/assets/avatars/base_5_v2.png", desc: "Antik Mısır'ın kumlarından gelen ölümsüz hükümdar." },
        { id: 153, baseId: 5, name: "Kral V3 (Viking Kral Kralı)", price: 750, img: "/assets/avatars/base_5_v3.png", desc: "Kuzeyin sert rüzgarlarını ve denizlerini dize getiren savaşçı kral." },
        { id: 154, baseId: 5, name: "Kral V4 (İmparator)", price: 1500, img: "/assets/avatars/base_5_v4.png", desc: "Yedi iklim ve dört bucağa hükmeden kudretli lider." },
        { id: 155, baseId: 5, name: "Kral V5 (Gök Tanrısı)", price: 3000, img: "/assets/avatars/base_5_v5.png", desc: "Yeryüzünden gökyüzüne yükselmiş, artık kadere hükmeden ilahi varlık." }
    ],
    pets: []
};

// 🌟 RESİM ÖN YÜKLEME (PRELOADING)
function preloadImages() {
    const urls = [
        ...SHOP_DATA.bases.map(b => b.img),
        ...SHOP_DATA.skins.filter(s => s.img).map(s => s.img)
    ];
    urls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
    console.log("Avatar görselleri ön yüklendi.");
}

function applyAvatarConfig(config) {
    if(!config) return;
    // Eğer dışarıdan config geldiyse globali güncelle (mevcut yapıya uyum için)
    if (config !== currentAvatarConfig) {
        currentAvatarConfig = { ...currentAvatarConfig, ...config };
    }
    if(!currentAvatarConfig.inventory) currentAvatarConfig.inventory = [];

    // 1. ANA KATMAN (BASE + SKIN)
    const baseLayer = document.getElementById('avatarBaseLayer');
    if (baseLayer) {
        let displayImg = "";
        const activeSkin = SHOP_DATA.skins.find(s => s.id == currentAvatarConfig.skin);
        if (activeSkin) {
            displayImg = activeSkin.img;
        } else {
            const baseItem = SHOP_DATA.bases.find(b => b.id == currentAvatarConfig.base);
            displayImg = baseItem ? baseItem.img : "";
        }

        if (displayImg) {
            baseLayer.style.backgroundImage = `url('${displayImg}')`;
            baseLayer.style.backgroundSize = "contain";
            baseLayer.style.backgroundPosition = "center bottom";
            
            // 🌟 AGRESİF ZOOM VE HİZALAMA: Ninja (4) ve Kral (5) için Warrior profilini yakalama
            // Not: Mage (2) artık yeni görseliyle kadrajı doldurduğu için ona zoom yapmıyoruz.
            // Tüm karakterler artık senin attığın yeni geniş görsellerle kadrajı doldurduğu için 
            // ekstra zoom yapmaya gerek kalmadı, hepsini standart 1:1 ölçeğe çekiyoruz.
            baseLayer.style.transform = "scale(1)";
            baseLayer.style.marginTop = "0";
            baseLayer.style.height = "100%";
            
            const baseItem = SHOP_DATA.bases.find(b => b.id == (activeSkin ? activeSkin.baseId : currentAvatarConfig.base));
            if (baseItem) document.getElementById('avatarNameDisplay').innerText = baseItem.name;
        }

        // Önizleme Rozeti Kontrolü
        const isSkinOwned = !currentAvatarConfig.skin || currentAvatarConfig.skin === -1 || currentAvatarConfig.inventory.includes(currentAvatarConfig.skin) || (SHOP_DATA.skins.find(s => s.id === currentAvatarConfig.skin)?.price === 0);
        
        
        // 🌟 MANTIK GÜNCELLEMESİ: 0'dan 5'e kadar olan 6 ana karakter HER ZAMAN "owned" sayılır, önizleme rozeti çıkartmaz.
        const isBaseOwned = (currentAvatarConfig.base >= 0 && currentAvatarConfig.base <= 5);

        let previewBadge = document.getElementById('previewBadge');
        if (!isSkinOwned || !isBaseOwned) {
            if (!previewBadge) {
                previewBadge = document.createElement('div');
                previewBadge.id = 'previewBadge';
                previewBadge.className = 'preview-badge';
                previewBadge.innerText = 'ÖNİZLEME';
                baseLayer.parentElement.appendChild(previewBadge);
            }
        } else if (previewBadge) {
            previewBadge.remove();
        }
    }



    // Level Display
    const xp = parseInt(document.getElementById('studentXpText').innerText) || 0;
    const level = Math.floor(xp / 500) + 1;
    const levelNames = ["Çaylak", "Girişken", "Usta", "Efsane", "VIP Star"];
    if (document.getElementById('avatarLevelDisplay')) {
        document.getElementById('avatarLevelDisplay').innerText = levelNames[Math.min(level-1, 4)] + " Seviye";
    }
}

async function initShop() {
    renderShopItems('bases');
    
    // Tab eventleri
    document.querySelectorAll('.shop-filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.shop-filter-btn').forEach(b => b.classList.remove('active-shop-tab', 'bg-indigo-100', 'text-indigo-900'));
            btn.classList.add('active-shop-tab', 'bg-indigo-100', 'text-indigo-900');
            renderShopItems(btn.dataset.category);
            playSound('click');
        };
    });
}

function renderShopItems(category) {
    const container = document.getElementById('shopItemsContainer');
    if(!container) return;
    container.innerHTML = '';

    let items = [];
    if (category === 'inventory') {
        const allItems = [...SHOP_DATA.bases, ...SHOP_DATA.skins, ...SHOP_DATA.pets];
        // 🌟 MANTIK GÜNCELLEMESİ: 6 Ana Karakter her zaman var, diğerleri envanterde olmalı
        items = allItems.filter(item => {
            const isBase = item.id >= 0 && item.id <= 5; // İlk 6 karakter (v1'ler)
            return isBase || currentAvatarConfig.inventory.includes(item.id);
        });
    } else if (category === 'skins') {
        items = SHOP_DATA.skins.filter(s => s.baseId === (currentAvatarConfig.base || 0));
    } else {
        items = SHOP_DATA[category];
    }

    if(!items || items.length === 0) {
        const msg = category === 'skins' ? "Bu karakter için henüz özel kostüm yok. Yakında gelecek!" : "Burada henüz bir şey yok :(";
        container.innerHTML = `<p class="col-span-full text-center text-gray-400 py-10 font-bold italic opacity-60">${msg}</p>`;
        return;
    }

    items.forEach(item => {
        // 🌟 MANTIK GÜNCELLEMESİ: 0-5 arası ana karakterler HER YERDE (market, envanter, kostüm sekmeleri) SAHİP olunmuş sayılır.
        const isDefaultBase = (item.id >= 0 && item.id <= 5);
        const isOwned = isDefaultBase || category === 'inventory' || category === 'bases' || currentAvatarConfig.inventory.includes(item.id) || item.price === 0;
        const isActive = (category === 'bases' && currentAvatarConfig.base == item.id) || 
                         (category === 'skins' && currentAvatarConfig.skin == item.id) || 
                         (category === 'pets' && currentAvatarConfig.pet == item.id);

        const card = document.createElement('div');
        card.className = `shop-item-card bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 ${isActive ? 'border-indigo-500 shadow-lg' : 'border-gray-50 dark:border-slate-700'} flex flex-col items-center group hover:scale-[1.02] transition cursor-pointer relative`;
        
        // Market/Envanter önizlemelerinde de zoom karmaşasını bitirip standart hizalamaya geçtik.
        let zoomClass = "";

        let thumbnailClasses = `w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 ${category === 'pets' ? 'animate-bounce' : ''} ${zoomClass}`;
        if (!isOwned) thumbnailClasses += " locked-image";

        let lockOverlay = !isOwned ? `
            <div class="lock-overlay">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" /></svg>
            </div>
        ` : '';

        card.innerHTML = `
            <div class="w-full aspect-square bg-white rounded-3xl mb-4 p-4 flex items-center justify-center overflow-hidden relative border border-gray-100 dark:border-slate-700/50" style="background-color: white !important;">
                ${lockOverlay}
                <img src="${item.img}" class="${thumbnailClasses}">
            </div>
            <h5 class="font-black text-gray-800 dark:text-white text-sm mb-1">${item.name}</h5>
            <p class="item-lore text-gray-400 mb-3">${item.desc || ''}</p>
            <p class="text-[10px] font-bold text-amber-600 mb-4">${isOwned ? 'SAHİPSİN' : item.price + ' EP-COIN'}</p>
            
            <div class="w-full flex gap-2">
                ${!isOwned ? `
                    <button onclick="selectItem('${category}', ${item.id}, true)" 
                        class="flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition whitespace-nowrap">
                        ÖNİZLEME
                    </button>
                    <button onclick="buyItem('${category}', ${item.id})" 
                        class="flex-[2] py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-500 text-white hover:bg-amber-600 shadow-md">
                        SATIN AL
                    </button>
                ` : `
                    <button onclick="selectItem('${category}', ${item.id})" 
                        class="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${isActive ? 'bg-indigo-600 text-white shadow-inner' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 hover:bg-indigo-500 hover:text-white shadow-sm'}">
                        ${isActive ? 'SEÇİLDİ' : 'GİY / SEÇ'}
                    </button>
                `}
            </div>
        `;
        container.appendChild(card);
    });
}

function selectItem(category, itemId, isPreview = false) {
    if (category === 'bases') {
        currentAvatarConfig.base = itemId;
        currentAvatarConfig.skin = -1; 
    }
    
    // Skin seçimi
    const skin = SHOP_DATA.skins.find(s => s.id === itemId);
    if (skin) {
        currentAvatarConfig.skin = itemId;
        currentAvatarConfig.base = skin.baseId;
    }
    
    // Base seçimi (Farklı kategoriden gelirse)
    const base = SHOP_DATA.bases.find(b => b.id === itemId);
    if (base) {
        currentAvatarConfig.base = itemId;
        currentAvatarConfig.skin = -1;
    }
    
    applyAvatarConfig(currentAvatarConfig);
    
    const activeTab = document.querySelector('.active-shop-tab');
    if (activeTab) renderShopItems(activeTab.dataset.category);
    
    if (isPreview) {
        showToast("Önizleme modu: Bu öğeye sahip değilsin!", "info");
    }
    playSound('click');
}

async function buyItem(category, itemId) {
    const item = SHOP_DATA[category].find(i => i.id === itemId);
    const balance = parseInt(document.getElementById('shopCoinDisplay').innerText);

    if (balance < item.price) {
        showToast("Yeterli EP-COIN bakiyen yok! Ödev yaparak kazanabilirsin.", "error");
        playSound('error');
        return;
    }

    // 1. Önce envanteri güncelle
    const { error } = await supabaseClient.from('profiles').update({ 
        avatar_config: { ...currentAvatarConfig, inventory: [...currentAvatarConfig.inventory, itemId] }
    }).eq('id', currentStudentId);

    // 2. Eğer başarılıysa RPC üzerinden güvenli şekilde Coin düş (Hile koruması)
    if (!error) {
        await supabaseClient.rpc('add_student_xp', {
            target_student_id: currentStudentId,
            xp_amount: 0,
            coin_amount: -item.price
        });
    }

    if (error) {
        showToast("Satın alma sırasında bir hata oluştu.", "error");
    } else {
        currentAvatarConfig.inventory.push(itemId);
        document.getElementById('shopCoinDisplay').innerText = balance - item.price;
        document.getElementById('studentCoinText').innerText = balance - item.price;
        showToast(`${item.name} başarıyla satın alındı!`, "success");
        playSound('buy');
        saveLog("Market Alışverişi", `Satın Alınan: ${item.name} | Kategori: ${category} | Fiyat: ${item.price} EP-COIN`);
        renderShopItems(category);
    }
}

async function saveAvatarConfig() {
    // Sahip olunmayan öğe kontrolü
    const skin = SHOP_DATA.skins.find(s => s.id === currentAvatarConfig.skin);
    const base = SHOP_DATA.bases.find(b => b.id === currentAvatarConfig.base);

    const isSkinLocked = skin && skin.price > 0 && !currentAvatarConfig.inventory.includes(skin.id);
    const isBaseLocked = base && (base.id < 0 || base.id > 5) && base.price > 0 && !currentAvatarConfig.inventory.includes(base.id);

    if (isSkinLocked || isBaseLocked) {
        showToast("Sahip olmadığın bir öğeyi kaydedemezsin! Lütfen önce satın al.", "error");
        playSound('error');
        return;
    }

    const { error } = await supabaseClient.from('profiles').update({ avatar_config: currentAvatarConfig }).eq('id', currentStudentId);
    if (error) {
        showToast("Hata oluştu!", "error");
    } else {
        showToast("Avatar görünümü başarıyla kaydedildi!", "success");
        playSound('success');
        saveLog("Avatar Güncellendi", "Görünüm detayları kaydedildi.");
        
        // Önizleme badge'ini kaldır (eğer varsa)
        const pb = document.getElementById('previewBadge');
        if (pb) pb.remove();
    }
}

// ==========================================
// 4. ÖDEVLER
// ==========================================
async function fetchMyHomeworks() {
    const { data } = await supabaseClient.from('homeworks').select('*').eq('student_id', currentStudentId).order('due_date', { ascending: true });
    const container = document.getElementById('myHomeworksList');
    if (!container) return;

    if (!data || data.length === 0) { 
        container.innerHTML = '<div class="col-span-full bg-white dark:bg-slate-800 p-10 rounded-[30px] text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 dark:border-slate-700">Bekleyen veya teslim edilen ödevin yok.</div>'; 
        return; 
    }
    
    let newHwHtml = '';
    let doneHwHtml = '';

    data.forEach(hw => {
        const dueDate = new Date(hw.due_date).toLocaleDateString('tr-TR');
        const isCompleted = hw.status === 'Tamamlandı';
        const isReviewing = hw.status === 'İnceleniyor';
        
        let cardTitle = hw.title;
        let isFlashcard = false;
        let isWriting = false;
        let flashcardDataStr = "[]";
        
        if (hw.title.includes('[KELİME_KARTI]')) {
            isFlashcard = true;
            cardTitle = hw.title.replace('[KELİME_KARTI]', '🚀 Telaffuz Görevi:');
            flashcardDataStr = hw.description.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
        } else if (hw.title.includes('[WRITING]')) {
            isWriting = true;
            cardTitle = hw.title.replace('[WRITING]', 'Gramer Görevi:');
        }

        const card = `
            <div class="bg-white dark:bg-slate-800 p-6 rounded-[30px] shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all flex flex-col h-full relative overflow-hidden group">
                ${isCompleted ? '<div class="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>' : (isReviewing ? '<div class="absolute top-0 left-0 w-full h-1.5 bg-blue-400"></div>' : (isFlashcard ? '<div class="absolute top-0 left-0 w-full h-1.5 bg-purple-500"></div>' : (isWriting ? '<div class="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>' : '<div class="absolute top-0 left-0 w-full h-1.5 bg-amber-400"></div>')))}
                
                <h4 class="text-base font-black ${isFlashcard ? 'text-purple-600 dark:text-purple-400' : (isWriting ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-white')} mb-2 mt-1 line-clamp-2 leading-tight">${escapeHTML(cardTitle)}</h4>
                
                ${isFlashcard 
                    ? `<p class="text-gray-500 dark:text-gray-400 text-xs mb-5 flex-1 bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl font-medium border border-purple-100 dark:border-purple-800/50">Yapay zeka ile üretilmiş ${isCompleted ? 'tamamlanmış' : 'yeni'} kelime telaffuz görevi.</p>` 
                    : (isWriting 
                        ? `<p class="text-gray-500 dark:text-gray-400 text-xs mb-5 flex-1 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl font-medium border border-blue-100 dark:border-blue-800/50 line-clamp-4">${escapeHTML(hw.description)}</p>`
                        : `<p class="text-gray-500 dark:text-gray-400 text-xs mb-5 flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl leading-relaxed font-medium border border-gray-100 dark:border-slate-700/50 line-clamp-4">${escapeHTML(hw.description)}</p>`
                    )
                }

                <div class="flex justify-between items-center mt-auto border-t border-gray-50 dark:border-slate-700 pt-4">
                    <span class="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1 bg-gray-50 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-600"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Son: ${dueDate}</span>
                    
                    ${isCompleted 
                        ? '<span class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> ONAYLANDI</span>' 
                        : (isReviewing
                            ? '<span class="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-1">İNCELEMEDE</span>'
                            : (isFlashcard 
                                ? `<button onclick="startFlashcardTask('${hw.id}', '${flashcardDataStr}', '${hw.title.replace(/'/g, "\\'")}')" class="text-[10px] font-black text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 px-4 py-2 rounded-lg shadow-md transform active:scale-95 transition flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> BAŞLA</button>`
                                : (isWriting 
                                    ? `<button onclick="openWritingTask('${hw.id}', '${hw.title.replace(/'/g, "\\'")}')" class="text-[10px] font-black text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 px-4 py-2 rounded-lg shadow-md transform active:scale-95 transition flex items-center gap-1">YAZMAYA BAŞLA</button>`
                                    : '<span class="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> BEKLİYOR</span>'
                                )
                            )
                        )
                    }
                </div>
            </div>`;

        if(isCompleted) doneHwHtml += card;
        else newHwHtml += card;
    });

    container.innerHTML = `
        <div class="col-span-full mb-1"><h4 class="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-xs flex items-center gap-2"><svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Yeni / Bekleyen Ödevler</h4></div>
        ${newHwHtml || '<div class="col-span-full text-sm text-gray-400 italic mb-6">Bekleyen ödevin yok, harikasın!</div>'}
        
        <div class="col-span-full mt-8 mb-1"><h4 class="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-xs flex items-center gap-2"><svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Onaylananlar</h4></div>
        ${doneHwHtml || '<div class="col-span-full text-sm text-gray-400 italic">Henüz onaylanan ödevin yok.</div>'}
    `;
}



// ==========================================
// 5. ETKİNLİKLER VE SOL MENÜ FİLTRELEME
// ==========================================
let currentActivityFilter = 'all';

// ÜCRETSİZ THUMBNAIL MOTORU (ETKİNLİKLER İÇİN)
function getActivityThumbnail(link, category) {
    if (category === 'video') {
        const ytMatch = link.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch && ytMatch[1]) {
            return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
        }
        return 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=400';
    }
    if (category === 'game') return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400';
    if (category === 'pdf') return 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&q=80&w=400';
    return '';
}

async function fetchActivities() {
    if (!currentStudentTeacherId) return;

    const { data } = await supabaseClient.from('activities').select('*').eq('teacher_id', currentStudentTeacherId).order('created_at', { ascending: false });
    const container = document.getElementById('myActivitiesList');
    if (!container) return;

    if (!data || data.length === 0) { 
        container.innerHTML = '<div class="col-span-full bg-white dark:bg-slate-800 p-10 rounded-[30px] text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 dark:border-slate-700">Etkinlik bulunmuyor.</div>'; 
        return; 
    }
    
    container.innerHTML = ''; 
    data.forEach(act => {
        const displayStyle = (currentActivityFilter === 'all' || act.category === currentActivityFilter) ? 'flex' : 'none';
        const thumb = getActivityThumbnail(act.link, act.category);
        const icon = act.category === 'video' ? '📽️' : (act.category === 'game' ? '🎮' : '📄');

        container.innerHTML += `
            <div class="activity-card group relative bg-white dark:bg-slate-800 rounded-[30px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300 h-64 flex-col" data-category="${act.category}" style="display: ${displayStyle};">
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
                            <span class="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-white/50 dark:bg-slate-700/50 px-2 py-1 rounded-lg backdrop-blur-sm border border-indigo-100/30 dark:border-slate-600/30">${act.category}</span>
                        </div>
                        <h4 class="font-black text-gray-800 dark:text-white text-base tracking-tight leading-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-white transition">${escapeHTML(act.title)}</h4>
                    </div>
                    
                    <button onclick="openActivity('${escapeHTML(act.link)}', '${escapeHTML(act.title)}')" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-2xl text-center text-xs tracking-widest shadow-lg shadow-indigo-600/20 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                        AÇ VE İNCELE <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </button>
                </div>
            </div>`;
    });
}

document.querySelectorAll('.sidebar-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        
        document.querySelectorAll('.sidebar-filter-btn').forEach(b => {
            b.classList.remove('text-white');
            b.classList.add('text-indigo-300');
        });
        e.currentTarget.classList.remove('text-indigo-300');
        e.currentTarget.classList.add('text-white');

        currentActivityFilter = e.currentTarget.getAttribute('data-filter');

        const actSection = document.getElementById('section-activities');
        if (actSection && actSection.classList.contains('hidden')) {
            switchTab('activities'); 
        } else {
            document.querySelectorAll('.activity-card').forEach(card => {
                card.style.display = (currentActivityFilter === 'all' || card.getAttribute('data-category') === currentActivityFilter) ? 'flex' : 'none';
            });
        }

        if(window.innerWidth < 768 && sidebarMain && !sidebarMain.classList.contains('-translate-x-full')) {
            toggleMobileSidebar();
        }
    });
});


// ==========================================
// 6. SINAV MOTORU VE SONUÇLAR
// ==========================================
async function fetchQuizzes() {
    if (!currentStudentTeacherId) return;

    const { data } = await supabaseClient.from('quizzes').select('*').eq('teacher_id', currentStudentTeacherId).order('created_at', { ascending: false });
    const container = document.getElementById('myQuizzesList');
    if (!container) return;

    if (!data || data.length === 0) { 
        container.innerHTML = '<div class="col-span-full bg-white dark:bg-slate-800 p-10 rounded-[30px] text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 dark:border-slate-700">Çözülecek sınav bulunmuyor.</div>'; 
        return; 
    }
    
    container.innerHTML = '';

    // 🌟 YENİ: Başkasının Telafi Sınavını Gizleme Mantığı İçin Öğrenci Adını Çekiyoruz 🌟
    const currentFirstNameEl = document.getElementById('welcomeStudentName');
    const currentFirstName = currentFirstNameEl ? currentFirstNameEl.innerText : '';

    data.forEach(quiz => {
        // 🌟 EĞER SINAV TELAFİ İSE VE BU ÖĞRENCİNİN ADINI İÇERMİYORSA EKRANA BASMA (GİZLE) 🌟
        if (quiz.title.startsWith('[TELAFİ]') && !quiz.title.includes(currentFirstName)) return;

        container.innerHTML += `
            <div class="bg-white dark:bg-slate-800 p-6 rounded-[30px] shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:border-red-300 dark:hover:border-red-800 transition flex flex-col h-full group">
                <div class="flex items-center gap-4 mb-5">
                    <div class="bg-red-50 dark:bg-red-900/30 p-3.5 rounded-2xl border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 shadow-inner group-hover:scale-110 transition transform">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    </div>
                    <h4 class="text-sm md:text-base font-black text-gray-800 dark:text-white flex-1 line-clamp-2 leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition">${escapeHTML(quiz.title)}</h4>
                </div>
                <button onclick="startQuiz('${quiz.id}', '${escapeHTML(quiz.title.replace(/'/g, "\\'"))}')" class="mt-auto w-full bg-slate-50 dark:bg-slate-900 hover:bg-red-500 text-gray-500 hover:text-white border border-gray-200 dark:border-slate-700 hover:border-red-500 transition font-black py-3 rounded-xl text-xs uppercase tracking-widest shadow-sm">SINAVA BAŞLA</button>
            </div>`;
    });
}


async function fetchMyResults() {
    const { data } = await supabaseClient.from('quiz_results').select('*, quizzes(title)').eq('student_id', currentStudentId).order('created_at', { ascending: false });
    const container = document.getElementById('myResultsList');
    if(!container) return;

    if(!data || data.length === 0){
        container.innerHTML = '<div class="col-span-full bg-white dark:bg-slate-800 p-10 rounded-[30px] text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 dark:border-slate-700">Henüz çözdüğün bir sınav yok.</div>'; 
        return;
    }
    
    container.innerHTML = '';
    data.forEach(res => {
        const dateObj = new Date(res.created_at);
        const dateStr = dateObj.toLocaleDateString('tr-TR');
        
        let scoreColor = 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
        if (res.score < 50) scoreColor = 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
        else if (res.score < 80) scoreColor = 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';

        container.innerHTML += `
            <div class="bg-white dark:bg-slate-800 p-6 rounded-[30px] shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl transition flex flex-col justify-between">
                <div class="flex justify-between items-start mb-4">
                    <h4 class="text-sm font-black text-gray-800 dark:text-white line-clamp-2 pr-2">${res.quizzes ? escapeHTML(res.quizzes.title) : 'Silinmiş Sınav'}</h4>
                    <span class="px-3 py-1 rounded-xl font-black text-lg border ${scoreColor} shrink-0">${res.score}</span>
                </div>
                <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                    <span class="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        ${dateStr}
                    </span>
                    <button onclick='renderAnalysisScreen(${JSON.stringify(res.details).replace(/'/g, "&#39;")}, ${res.score})' class="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 transition">İncele ↗</button>
                </div>
            </div>`;
    });
}

window.startQuiz = async function(quizId, quizTitle) {
    activeTakingQuizId = quizId;
    saveLog("Sınav Başlatıldı", `Sınav: ${quizTitle}`);
    document.getElementById('takingQuizTitle').innerText = quizTitle;
    const container = document.getElementById('questionsContainer');
    const timerContainer = document.getElementById('quizTimerContainer');
    const timerDisplay = document.getElementById('quizTimerDisplay');
    
    if(quizTimerInterval) clearInterval(quizTimerInterval);
    if(timerContainer) timerContainer.classList.add('hidden');

    container.innerHTML = '<p class="text-center text-gray-400 font-medium text-sm py-10 animate-pulse">Sınav Yükleniyor...</p>';
    document.getElementById('quizTakingModal').classList.remove('hidden');

    const { data: quizInfo } = await supabaseClient.from('quizzes').select('time_limit').eq('id', quizId).single();
    const { data: questions, error } = await supabaseClient.from('questions').select('*').eq('quiz_id', quizId).order('created_at', { ascending: true });
    
    if (error || !questions || questions.length === 0) {
        container.innerHTML = '<p class="text-center text-red-500 font-bold text-sm py-10">Öğretmeniniz bu sınava henüz soru eklememiş.</p>';
        return;
    }

    currentQuizQuestions = questions; 
    container.innerHTML = '';
    
    questions.forEach((q, index) => {
        container.innerHTML += `
            <div class="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[30px] border border-gray-100 dark:border-slate-700 shadow-sm question-block" data-question-id="${q.id}" data-correct="${q.correct_option}">
                <h4 class="text-base md:text-lg font-black text-gray-800 dark:text-white mb-6 leading-relaxed"><span class="text-indigo-500 mr-2">${index + 1}.</span> ${escapeHTML(q.question_text)}</h4>
                <div class="space-y-3">
                    <label class="flex items-center p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition group">
                        <input type="radio" name="q_${q.id}" value="A" class="w-5 h-5 text-indigo-600 mr-4" required>
                        <span class="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">A) ${escapeHTML(q.option_a)}</span>
                    </label>
                    <label class="flex items-center p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition group">
                        <input type="radio" name="q_${q.id}" value="B" class="w-5 h-5 text-indigo-600 mr-4" required>
                        <span class="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">B) ${escapeHTML(q.option_b)}</span>
                    </label>
                    <label class="flex items-center p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition group">
                        <input type="radio" name="q_${q.id}" value="C" class="w-5 h-5 text-indigo-600 mr-4" required>
                        <span class="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">C) ${escapeHTML(q.option_c)}</span>
                    </label>
                    <label class="flex items-center p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition group">
                        <input type="radio" name="q_${q.id}" value="D" class="w-5 h-5 text-indigo-600 mr-4" required>
                        <span class="text-sm md:text-base font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">D) ${escapeHTML(q.option_d)}</span>
                    </label>
                </div>
            </div>`;
    });

    if (quizInfo && quizInfo.time_limit > 0 && timerContainer) {
        let timeLeft = quizInfo.time_limit * 60; 
        timerContainer.classList.remove('hidden');
        
        quizTimerInterval = setInterval(() => {
            let m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
            let s = (timeLeft % 60).toString().padStart(2, '0');
            timerDisplay.innerText = `${m}:${s}`;
            
            if (timeLeft <= 0) {
                clearInterval(quizTimerInterval);
                showToast("SÜRE DOLDU! Sınav otomatik olarak gönderiliyor...", "error");
                document.getElementById('quizForm').dispatchEvent(new Event('submit')); 
            }
            timeLeft--;
        }, 1000);
    }
};

window.closeQuizModal = async function() {
    const onay = await customConfirm("Sınavdan çıkarsan verilerin kaydedilmez. Emin misin?", "Evet, Çık");
    if(onay) { 
        if(quizTimerInterval) clearInterval(quizTimerInterval); 
        document.getElementById('quizTakingModal').classList.add('hidden'); 
    }
}

const quizFormEl = document.getElementById('quizForm');
if(quizFormEl) {
    quizFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(quizTimerInterval) clearInterval(quizTimerInterval); 

        let correctAnswers = 0;
        let examDetails = [];

        currentQuizQuestions.forEach((q, index) => {
            const selectedRadio = document.querySelector(`input[name="q_${q.id}"]:checked`);
            const selectedValue = selectedRadio ? selectedRadio.value : 'Boş';
            const isCorrect = (selectedValue === q.correct_option);
            if (isCorrect) correctAnswers++;

            examDetails.push({
                q_no: index + 1, q_text: q.question_text, correct_opt: q.correct_option, selected_opt: selectedValue, is_correct: isCorrect,
                optA: q.option_a, optB: q.option_b, optC: q.option_c, optD: q.option_d
            });
        });

        const totalQuestions = currentQuizQuestions.length;
        const score = Math.round((correctAnswers / totalQuestions) * 100);

        showToast("Cevapların öğretmene iletiliyor...", "info");

        const { error } = await supabaseClient.from('quiz_results').insert([{
            quiz_id: activeTakingQuizId, student_id: currentStudentId, score: score, details: examDetails
        }]);

        if (error) { 
            showToast("Hata oluştu: " + error.message, "error"); 
            return; 
        }

        await supabaseClient.rpc('add_student_xp', { 
            target_student_id: currentStudentId, 
            xp_amount: score, 
            coin_amount: 20 
        });

        showToast(`Tebrikler! ${score} Puan, +${score} XP ve +20 EP-Coin kazandın! 🪙`, "success");
        saveLog("Sınav Tamamlandı", `Sonuç: ${score} Puan | Doğru: ${correctAnswers}/${totalQuestions}`);
        
        document.getElementById('quizTakingModal').classList.add('hidden');
        window.renderAnalysisScreen(examDetails, score);
        initStudentPortal(); 
    });
}

window.renderAnalysisScreen = function(details, score) {
    document.getElementById('analysisScoreDisplay').innerText = score;
    const container = document.getElementById('analysisDetailsContainer');
    container.innerHTML = '';

    details.forEach(detail => {
        const boxStyle = detail.is_correct ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800' : 'border-rose-300 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800';
        const iconInfo = detail.is_correct ? '<span class="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-sm"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></span>' : '<span class="bg-rose-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black shadow-sm"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg></span>';
        
        container.innerHTML += `
            <div class="p-6 rounded-[20px] border-2 mb-6 ${boxStyle} shadow-sm">
                <div class="flex items-start gap-4 mb-4">
                    <span class="shrink-0">${iconInfo}</span>
                    <h4 class="text-sm md:text-base font-black text-gray-800 dark:text-white pt-1"><span class="text-gray-400 mr-1">${detail.q_no}.</span> ${escapeHTML(detail.q_text)}</h4>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12 text-sm font-bold">
                    <div class="p-3 rounded-xl ${detail.correct_opt === 'A' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-400' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700'}">A) ${escapeHTML(detail.optA)}</div>
                    <div class="p-3 rounded-xl ${detail.correct_opt === 'B' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-400' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700'}">B) ${escapeHTML(detail.optB)}</div>
                    <div class="p-3 rounded-xl ${detail.correct_opt === 'C' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-400' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700'}">C) ${escapeHTML(detail.optC)}</div>
                    <div class="p-3 rounded-xl ${detail.correct_opt === 'D' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border-2 border-emerald-400' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700'}">D) ${escapeHTML(detail.optD)}</div>
                </div>
                ${!detail.is_correct ? `<div class="mt-4 pl-12 flex flex-col sm:flex-row gap-3"><span class="inline-block bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Senin Cevabın: ${escapeHTML(detail.selected_opt)}</span><span class="inline-block bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Doğru Cevap: ${escapeHTML(detail.correct_opt)}</span></div>` : ''}
            </div>`;
    });
    document.getElementById('analysisModal').classList.remove('hidden');
}

window.closeAnalysisModal = function() {
    document.getElementById('analysisModal').classList.add('hidden'); 
    switchTab('quizzes');
}


// ==========================================
// 7. 3D KELİME KARTI VE TELAFFUZ MOTORU (GÖRSEL VE GEÇİŞ FİX)
// ==========================================
let currentFcWords = [];
let currentFcIndex = 0;
let currentFcTaskId = null;
let isCardFlipped = false;
let currentRecognition = null;

window.startFlashcardTask = function(taskId, dataStr, title) {
    currentFcTaskId = taskId;
    const rawData = dataStr.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    try { currentFcWords = JSON.parse(rawData); } 
    catch(e) { showToast("Kelime verisi okunamadı!", "error"); return; }

    if(currentFcWords.length === 0) return;
    currentFcIndex = 0;
    document.getElementById('fcModalTitle').innerText = title.replace('[KELİME_KARTI]', '').trim();
    document.getElementById('flashcardModal').classList.remove('hidden');
    saveLog("Kelime Pratiği Başlatıldı", `Görev: ${title}`);
    window.updateFlashcardUI();
}

window.closeFlashcardModal = function() {
    document.getElementById('flashcardModal').classList.add('hidden');
}

window.flipCard = function() {
    const card = document.getElementById('fcInner');
    isCardFlipped = !isCardFlipped;
    if (isCardFlipped) card.classList.add('rotate-y-180');
    else card.classList.remove('rotate-y-180');
}

// 🌟 GÖRSEL VE ARAYÜZ GÜNCELLEME MOTORU (KUSURSUZ 3 KATMANLI SİSTEM) 🌟
window.updateFlashcardUI = function() {
    try {
        if (currentRecognition) {
            try { currentRecognition.abort(); } catch(e) {}
            currentRecognition = null;
        }

        const word = currentFcWords[currentFcIndex];
        document.getElementById('fcWordTr').innerText = word.tr;
        document.getElementById('fcWordEn').innerText = word.en;

        const phEl = document.getElementById('fcWordPh');
        if (phEl) {
            phEl.innerText = word.ph ? `/${escapeHTML(word.ph)}/` : '';
            phEl.style.display = word.ph ? 'block' : 'none';
        }

        // 🌟 3 KATMANLI KUSURSUZ GÖRSEL MOTORU 🌟
        const imgEl = document.getElementById('fcWordImage');
        if (imgEl) {
            imgEl.style.opacity = '0'; // Resim inene kadar gizle
            
            // Kelimeyi temizle (Örn: "Get up" -> "get")
            const cleanWord = word.en.toLowerCase().split(' ')[0].replace(/[^\w]/gi, '');
            
            // 1. KATMAN: Wikipedia API (Ücretsiz, Kusursuz Doğruluk, Işık Hızında)
            fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${cleanWord}&prop=pageimages&format=json&pithumbsize=800&origin=*`)
            .then(res => res.json())
            .then(data => {
                const pages = data.query.pages;
                const pageId = Object.keys(pages)[0];
                
                if (pageId !== "-1" && pages[pageId].thumbnail) {
                    imgEl.src = pages[pageId].thumbnail.source; // Wikipedia Resmi
                } else {
                    // 2. KATMAN: Wikipedia Bulamazsa Microsoft Bing Gizli Arama Motoru
                    imgEl.src = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(cleanWord + " real photo")}&w=600&h=800&c=7&pid=Api`;
                }
            })
            .catch(() => {
                // Fetch patlarsa direkt Bing'e geç
                imgEl.src = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(cleanWord + " real photo")}&w=600&h=800&c=7&pid=Api`;
            });

            // Resim yüklendiğinde cam gibi göster
            imgEl.onload = () => { imgEl.style.opacity = '1'; }; 
            
            // 3. KATMAN: Olur da her şey çökerse, siyah ekran yerine şık bir manzara koy
            imgEl.onerror = () => { 
                if (!imgEl.src.includes('picsum')) {
                    imgEl.src = `https://picsum.photos/seed/${cleanWord}/600/800`; 
                }
            };
        }

        document.getElementById('fcProgress').innerText = `Kelime ${currentFcIndex + 1} / ${currentFcWords.length}`;
        isCardFlipped = false;
        document.getElementById('fcInner').classList.remove('rotate-y-180');

        const micStatus = document.getElementById('micStatus');
        const micIcon = document.getElementById('micIcon');
        const ripple = document.getElementById('micRipple');
        
        if (micStatus) {
            micStatus.innerText = "Mikrofona Dokun ve Oku";
            micStatus.className = "text-xs text-white font-black uppercase tracking-widest mt-5 drop-shadow-md bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10";
        }
        if (micIcon) micIcon.className = "w-10 h-10 text-purple-600 transition-colors";
        if (ripple) ripple.classList.remove('animate-ping', 'opacity-100');

        if (currentFcIndex === currentFcWords.length - 1) {
            document.getElementById('btnFinishFlashcard').classList.remove('hidden');
        } else {
            document.getElementById('btnFinishFlashcard').classList.add('hidden');
        }
    } catch (err) {
        console.error("UI Güncelleme Hatası:", err);
    }
}




window.nextCard = function() {
    if (currentFcIndex < currentFcWords.length - 1) {
        currentFcIndex++;
        window.updateFlashcardUI();
    }
}

window.prevCard = function() {
    if (currentFcIndex > 0) {
        currentFcIndex--;
        window.updateFlashcardUI();
    }
}

// 🌟 ANDROID MİKROFON VE OTOMATİK GEÇİŞ MOTORU 🌟
window.startListening = async function() {
    const micStatus = document.getElementById('micStatus');
    const micIcon = document.getElementById('micIcon');
    const ripple = document.getElementById('micRipple');

    const targetWordOriginal = currentFcWords[currentFcIndex].en;
    const targetWord = targetWordOriginal.toLowerCase().split(' ')[0].replace(/[^\w]/gi, '').trim();
    const targetWordFull = targetWordOriginal.toLowerCase().replace(/[^\w\s]/gi, '').trim();

    function resetMicUI(msg, isError = true) {
        micStatus.innerText = msg;
        micStatus.className = `text-xs font-black uppercase tracking-widest mt-5 drop-shadow-md bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm ${isError ? 'text-rose-300' : 'text-emerald-300'}`;
        micIcon.className = "w-10 h-10 text-purple-600 transition-colors";
        ripple.classList.remove('animate-ping', 'opacity-100');
    }

    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch(err) {
        resetMicUI("Mikrofon İzni Reddedildi Veya Açılamadı");
        return;
    }

    micStatus.innerText = "Sisteme Bağlanıyor...";
    micStatus.className = "text-xs text-indigo-200 font-black uppercase tracking-widest mt-5 drop-shadow-md bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm animate-pulse";
    
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' :
                     MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
                     MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/ogg';

    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks = [];

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

    recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        micStatus.innerText = "Analiz ediliyor...";
        micStatus.className = "text-xs text-amber-200 font-black uppercase tracking-widest mt-5 drop-shadow-md bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm animate-pulse";
        ripple.classList.remove('animate-ping', 'opacity-100');

        const audioBlob = new Blob(chunks, { type: mimeType });
        const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'ogg';

        // 🌟 Blob'u Base64 formatına çevirip asenkron olarak arka plana paslama 🌟
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async function() {
            const base64Audio = reader.result.split(',')[1];

            try {
                const response = await fetch('/api/transcribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        audioBase64: base64Audio, 
                        ext: ext, 
                        prompt: targetWordOriginal 
                    })
                });

                const data = await response.json();

                if (data.error) {
                    resetMicUI("Yapay Zeka Hatası, tekrar dene.");
                    return;
                }

            const spoken = (data.text || '').toLowerCase().replace(/[^\w\s]/gi, '').trim();

            let isMatch = false;
            if (spoken === targetWordFull) isMatch = true;
            if (spoken === targetWord) isMatch = true;
            if (spoken.includes(targetWord) && targetWord.length > 2) isMatch = true;
            if (targetWord.includes(spoken) && spoken.length > 2) isMatch = true;

            const homophones = {
                'red': ['read'], 'read': ['red'], 'two': ['to','too'], 'to': ['two','too'], 'too': ['to','two'],
                'write': ['right'], 'right': ['write'], 'eight': ['ate'], 'ate': ['eight'], 'buy': ['by','bye'], 
                'by': ['buy','bye'], 'see': ['sea'], 'sea': ['see'], 'hear': ['here'], 'here': ['hear'],
                'one': ['won'], 'won': ['one'], 'sun': ['son'], 'son': ['sun'], 'meet': ['meat'], 'meat': ['meet'],
                'week': ['weak'], 'weak': ['week'], 'whole': ['hole'], 'hole': ['whole'], 'peace': ['piece'], 'piece': ['peace']
            };
            if (homophones[targetWord]?.includes(spoken)) isMatch = true;

            if (isMatch) {
                micStatus.innerText = "HARİKA! DOĞRU TELAFFUZ! 🎉";
                micStatus.className = "text-xs text-emerald-300 font-black uppercase tracking-widest mt-5 drop-shadow-md bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm";
                micIcon.className = "w-10 h-10 text-emerald-400 transition-colors";

                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {});

                // 🌟 GEÇİŞ KİLİDİNİ ÇÖZEN YER 🌟
                setTimeout(() => {
                    if (currentFcIndex < currentFcWords.length - 1) {
                        window.nextCard(); 
                    } else {
                        micStatus.innerText = "TÜM KELİMELER TAMAM! 🏆";
                        micStatus.className = "text-xs text-amber-400 font-black uppercase tracking-widest mt-5 drop-shadow-md bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm";
                        document.getElementById('btnFinishFlashcard').classList.remove('hidden');
                    }
                }, 1500);

            } else {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3');
                audio.volume = 0.3;
                audio.play().catch(() => {});
                resetMicUI(`Yanlış! "${spoken || '?'}" duyduk. Tekrar dene.`);
            }

        } catch(err) {
            resetMicUI("Bağlantı hatası, tekrar dene.");
        }
    }; // reader.onloadend BİTİŞ
    }; // recorder.onstop BİTİŞ

    recorder.start();
    micStatus.innerText = "Dinliyor... Konuşun! 🎤";
    micStatus.className = "text-xs text-white font-black uppercase tracking-widest mt-5 drop-shadow-md bg-rose-500/80 px-4 py-2 rounded-full backdrop-blur-sm animate-pulse";
    micIcon.className = "w-10 h-10 text-rose-400 animate-pulse transition-colors";
    ripple.classList.add('animate-ping', 'opacity-100');

    setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
    }, 3000);
}

window.finishFlashcardTask = async function() {
    const onay = await customConfirm("Kelime pratiğini tamamladın mı?", "Evet, Bitir");
    if (!onay) return;

    showToast("Görev tamamlanıyor...", "info");

    const { error } = await supabaseClient.from('homeworks').update({ status: 'Tamamlandı' }).eq('id', currentFcTaskId);
    if (error) { showToast("Hata: " + error.message, "error"); return; }

    await supabaseClient.rpc('add_student_xp', {
        target_student_id: currentStudentId,
        xp_amount: 50,
        coin_amount: 10
    });

    showToast("Tebrikler! +50 XP ve +10 EP-Coin kazandın! 🪙", "success");
    saveLog("Kelime Pratiği Tamamlandı", "Görev başarıyla bitirildi.");
    window.closeFlashcardModal();
    initStudentPortal();
}

// ==========================================
// 8. ANTI-CHEAT (HİLE KORUMASI VE GÜVENLİK)
// ==========================================
document.addEventListener('contextmenu', event => event.preventDefault()); // Sağ tık iptal
document.onkeydown = function(e) {
    // F12 Engeli
    if (e.keyCode === 123) return false; 
    // Ctrl+Shift+I / J / C (Geliştirici Araçları Engeli)
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 'I'.charCodeAt(0) || e.keyCode === 'J'.charCodeAt(0) || e.keyCode === 'C'.charCodeAt(0))) return false; 
    // Ctrl+U (Kaynak Kodu Engeli)
    if (e.ctrlKey && e.keyCode === 'U'.charCodeAt(0)) return false; 
};

// Sistemi Başlat (GÜMRÜK VE SPLASH)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudentPortal);
} else {
    initStudentPortal();
}

// ==========================================
// YENİ: AI WRITING (GRAMER) MOTORU
// ==========================================
window.openWritingTask = function(hwId, title) {
    document.getElementById('writingHomeworkId').value = hwId;
    document.getElementById('writingTopicDisplay').innerText = title.replace('[WRITING]', 'Konu:').trim();
    document.getElementById('studentWritingInput').value = '';
    document.getElementById('writingTaskModal').classList.remove('hidden');
    saveLog("Yazma Görevi Başlatıldı", `Konu: ${title}`);
}

window.submitWritingTask = async function() {
    const hwId = document.getElementById('writingHomeworkId').value;
    const text = document.getElementById('studentWritingInput').value.trim();
    if (text.length < 10) { showToast("Lütfen biraz daha uzun ve mantıklı cümleler kur!", "error"); return; }

    const btn = document.getElementById('btnSubmitWriting');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Okunuyor ve Değerlendiriliyor... ⏳';
    btn.disabled = true;

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: "Sen uzman, cesaret verici bir İngilizce öğretmenisin. Öğrencinin yazdığı metni incele. 1) Hataları göster 2) Doğrusunu yaz 3) 100 üzerinden bir puan ver. Çıktıyı düz metin olarak, samimi bir dille ver. Markdown, yıldız veya kalın harf kullanma." },
                    { role: 'user', content: `Öğrencinin Metni: ${text}` }
                ], 
                temperature: 0.6
            })
        });

        const data = await response.json();
        const aiFeedback = (data.choices && data.choices[0] && data.choices[0].message.content) ? data.choices[0].message.content.trim() : "Yapay Zeka şu an yanıt veremiyor.";

        // Sonucu öğretmenin görebilmesi için DB'ye açıklama olarak atıyoruz.
        // DURUMU "Tamamlandı" değil, "İnceleniyor" yapıyoruz. XP falan da vermiyoruz, hoca onaylayınca alacak!
        const finalDesc = `[ÖĞRENCİ METNİ]\n${text}\n\n[YAPAY ZEKA DEĞERLENDİRMESİ]\n${aiFeedback}`;
        await supabaseClient.from('homeworks').update({ status: 'İnceleniyor', description: finalDesc }).eq('id', hwId);
        
        showToast("Ödev, incelemesi için öğretmenine gönderildi!", "success");
        saveLog("Yazma Görevi İncelemeye Gönderildi", `Konu: ${document.getElementById('writingTopicDisplay').innerText}`);
        document.getElementById('writingTaskModal').classList.add('hidden');
        initStudentPortal(); 
    } catch (err) {
        showToast('Bağlantı hatası, tekrar dene.', 'error');
    }
    btn.innerHTML = originalText; btn.disabled = false;
}

window.openActivity = function(link, title) {
    saveLog("Etkinlik Görüntülendi", `Etkinlik: ${title}`);
    window.open(link, '_blank');
}

// ==========================================
// 10. CANLI DERS VE BEYAZ TAHTA MOTORLARI
// ==========================================
window.initWhiteboardRealtime = async function(teacherId) {
    const display = document.getElementById('whiteboardDisplay');
    const container = document.getElementById('whiteboard-container');
    if (!display || !container) {
        console.error("Beyaz tahta elementleri bulunamadı!");
        return;
    }

    const fetchWhiteboard = async () => {
        try {
            console.log("Beyaz Tahta Güncelleniyor... Hoca ID:", teacherId);
            const { data, error } = await supabaseClient.from('whiteboard').select('content').eq('teacher_id', teacherId).maybeSingle();
            
            if (data) {
                console.log("Beyaz Tahta Verisi Geldi:", data.content ? "Veri Var" : "Veri Boş");
                if (data.content && data.content.trim() !== "") {
                    display.innerText = data.content.trim();
                    container.classList.remove('hidden');
                } else {
                    container.classList.add('hidden');
                }
            } else {
                console.log("Beyaz Tahta Sorgusu Sonuç Döndürmedi.");
                container.classList.add('hidden');
            }
        } catch (err) {
            console.error("Whiteboard fetch error:", err);
        }
    };

    fetchWhiteboard();
    setInterval(fetchWhiteboard, 5000); // 5 saniyede bir kontrol et (Hızlı senkron)
}

window.checkLiveLesson = async function(teacherId) {
    const btn = document.getElementById('btnLiveLesson');
    if (!btn) return;

    const fetchLiveStatus = async () => {
        try {
            const { data, error } = await supabaseClient.from('profiles').select('lesson_url').eq('id', teacherId).single();
            if (data && data.lesson_url) {
                btn.href = data.lesson_url;
                btn.classList.remove('hidden');
                
                // 🌟 LOG: Derse Katılım Tıklamasını Yakala
                if (!btn.dataset.logAttached) {
                    btn.addEventListener('click', () => saveLog("Canlı Derse Katılım Sağlandı"));
                    btn.dataset.logAttached = "true";
                }
            } else {
                btn.classList.add('hidden');
            }
        } catch (err) {
            console.error("Live lesson check error:", err);
        }
    };

    fetchLiveStatus();
    setInterval(fetchLiveStatus, 10000); // 10 saniyede bir kontrol et
}

// Sistemi Başlat (GÜMRÜK VE SPLASH)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudentPortal);
} else {
    // SPLASH GÜVENLİK (Safety Timeout: 5sn içinde açılmazsa zorla aç)
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 500);
            console.warn("Splash screen safety timeout triggered.");
        }
    }, 5000);
    initStudentPortal();
}

// ==========================================
// PROD LOG CLEARING
// ==========================================
window.IS_DEV = false; // Production ortamında burayı false tutun
if (!window.IS_DEV) {
    console.log = function() {}; // Logları sustur
    // console.warn = function() {}; // Gerekirse uyarıları da sustur
}

