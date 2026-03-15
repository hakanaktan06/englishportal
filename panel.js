// ==========================================
// 1. SUPABASE BAĞLANTISI (Sistem Anahtarı)
// ==========================================
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 🌟 YENİ: SİSTEMDEKİ AKTİF ÖĞRETMENİN HAFIZASI VE LİMİT BEKÇİLERİ 🌟
let currentTeacherId = null;
let currentTeacherName = '';
let isPremiumTeacher = false;
let currentStudentCount = 0;
let currentQuizCount = 0;

// ==========================================
// UI ULTRA: ŞIK BİLDİRİM VE ONAY MOTORU
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;

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
    
    toast.innerHTML = `<span class="flex-shrink-0">${iconSvg}</span> <span class="toast-msg">${message}</span>`;
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
// GÜVENLİK (FEDAİ) MOTORU VE SÜRE KONTROLÜ
// ==========================================
async function checkTeacherSecurity() {
    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) { window.location.href = 'index.html'; return; } 
        
        // 🌟 is_premium ve premium_until verisini çekiyoruz
        const { data: profile, error: profileError } = await supabaseClient.from('profiles').select('full_name, role, is_premium, premium_until').eq('id', user.id).single();
        if (profileError || !profile || profile.role !== 'teacher') {
            showToast("Erişim Engellendi! Yönetici yetkiniz yok.", "error");
            setTimeout(() => { window.location.href = 'student.html'; }, 1500); 
            return;
        }

        currentTeacherId = user.id;
        currentTeacherName = profile.full_name;

        // 🌟 TARİH KONTROLÜ (SÜRESİ BİTMİŞ Mİ?) 🌟
        if (profile.is_premium && profile.premium_until) {
            const today = new Date();
            const expiry = new Date(profile.premium_until);
            if (today > expiry) {
                isPremiumTeacher = false; // Süre doldu, hoca Freemium'a düştü!
            } else {
                isPremiumTeacher = true; // Hala süresi var
            }
        } else {
            isPremiumTeacher = profile.is_premium; 
        }

        // 🌟 KİLİT VE ROZET GÖRÜNÜMÜ KONTROLÜ 🌟
        if (isPremiumTeacher) {
            document.getElementById('premiumBadge')?.classList.remove('hidden');
            document.getElementById('lockIconVeli')?.classList.add('hidden');
            document.getElementById('lockIconKarne')?.classList.add('hidden');
            document.getElementById('lockIconSertifika')?.classList.add('hidden');
        } else {
            document.getElementById('premiumBadge')?.classList.add('hidden');
            document.getElementById('lockIconVeli')?.classList.remove('hidden');
            document.getElementById('lockIconKarne')?.classList.remove('hidden');
            document.getElementById('lockIconSertifika')?.classList.remove('hidden');
        }

        const welcomeNameEl = document.getElementById('welcomeTeacherName');
        if(welcomeNameEl) welcomeNameEl.innerText = currentTeacherName + " Öğretmenim";

        const agendaNameEl = document.getElementById('agendaTeacherName');
        if(agendaNameEl) agendaNameEl.innerText = currentTeacherName + " Öğretmenim, şimdi kafa dinleme vakti!";

        switchTab('dashboard'); 

        setTimeout(() => {
            const splash = document.getElementById('splashScreen');
            if(splash) {
                splash.classList.add('opacity-0');
                setTimeout(() => splash.classList.add('hidden'), 700);
            }

            // 🌟 TEK SEFERLİK PREMİUM KUTLAMASI 🌟
            if (isPremiumTeacher) {
                const isCelebrated = localStorage.getItem('premium_celebrated_' + user.id);
                if (!isCelebrated) {
                    const modal = document.getElementById('premiumCelebrationModal');
                    const box = document.getElementById('premiumCelebrationBox');
                    if (modal) {
                        modal.classList.remove('hidden');
                        setTimeout(() => {
                            modal.classList.remove('opacity-0');
                            box.classList.remove('scale-95');
                        }, 50);
                        localStorage.setItem('premium_celebrated_' + user.id, 'true'); // Hafızaya yaz ki bir daha göstermesin
                    }
                }
            }

        }, 400);
    } catch (err) {
        console.error(err);
        window.location.href = 'index.html';
    }
}

// Premium Kapatma Fonksiyonu
window.closePremiumCelebration = function() {
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
        if(!onay) return;
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
// 2. SEKMELER ARASI GEÇİŞ VE NAVİGASYON
// ==========================================
const btnDashboard = document.getElementById('btn-dashboard'); 
const btnStudents = document.getElementById('btn-students');
const btnHomeworks = document.getElementById('btn-homeworks');
const btnActivities = document.getElementById('btn-activities'); 
const btnQuizzes = document.getElementById('btn-quizzes'); 
const btnResults = document.getElementById('btn-results'); 

const sectionDashboard = document.getElementById('section-dashboard'); 
const sectionStudents = document.getElementById('section-students');
const sectionHomeworks = document.getElementById('section-homeworks');
const sectionActivities = document.getElementById('section-activities');
const sectionQuizzes = document.getElementById('section-quizzes');
const sectionResults = document.getElementById('section-results'); 

function switchTab(target) {
    if(window.innerWidth < 768 && sidebarMain && !sidebarMain.classList.contains('-translate-x-full')) {
        toggleMobileSidebar();
    }

    if (sectionDashboard) sectionDashboard.classList.add('hidden');
    if (sectionStudents) sectionStudents.classList.add('hidden');
    if (sectionHomeworks) sectionHomeworks.classList.add('hidden');
    if (sectionActivities) sectionActivities.classList.add('hidden');
    if (sectionQuizzes) sectionQuizzes.classList.add('hidden');
    if (sectionResults) sectionResults.classList.add('hidden'); 
    
    if (btnDashboard) btnDashboard.classList.remove('bg-indigo-800', 'shadow-inner');
    if (btnStudents) btnStudents.classList.remove('bg-indigo-800', 'shadow-inner');
    if (btnHomeworks) btnHomeworks.classList.remove('bg-indigo-800', 'shadow-inner');
    if (btnActivities) btnActivities.classList.remove('bg-indigo-800', 'shadow-inner');
    if (btnQuizzes) btnQuizzes.classList.remove('bg-indigo-800', 'shadow-inner');
    if (btnResults) btnResults.classList.remove('bg-indigo-800', 'shadow-inner'); 

    if (target === 'dashboard') {
        if(sectionDashboard) sectionDashboard.classList.remove('hidden');
        if(btnDashboard) btnDashboard.classList.add('bg-indigo-800', 'shadow-inner');
        fetchDashboardStats();
    } else if (target === 'homeworks') {
        if(sectionHomeworks) sectionHomeworks.classList.remove('hidden');
        if(btnHomeworks) btnHomeworks.classList.add('bg-indigo-800', 'shadow-inner');
        fillStudentSelect();
        fetchHomeworks();
    } else if (target === 'activities') {
        if(sectionActivities) sectionActivities.classList.remove('hidden');
        if(btnActivities) btnActivities.classList.add('bg-indigo-800', 'shadow-inner');
        fetchActivities();
    } else if (target === 'quizzes') {
        if(sectionQuizzes) sectionQuizzes.classList.remove('hidden');
        if(btnQuizzes) btnQuizzes.classList.add('bg-indigo-800', 'shadow-inner');
        fetchQuizzes();
    } else if (target === 'results') { 
        if(sectionResults) sectionResults.classList.remove('hidden');
        if(btnResults) btnResults.classList.add('bg-indigo-800', 'shadow-inner');
        fetchResults(); 
    } else {
        if(sectionStudents) sectionStudents.classList.remove('hidden');
        if(btnStudents) btnStudents.classList.add('bg-indigo-800', 'shadow-inner');
        fetchStudents();
    }
}

if(btnDashboard) btnDashboard.addEventListener('click', (e) => { e.preventDefault(); switchTab('dashboard'); });
if(btnHomeworks) btnHomeworks.addEventListener('click', (e) => { e.preventDefault(); switchTab('homeworks'); });
if(btnStudents) btnStudents.addEventListener('click', (e) => { e.preventDefault(); switchTab('students'); });
if(btnActivities) btnActivities.addEventListener('click', (e) => { e.preventDefault(); switchTab('activities'); });
if(btnQuizzes) btnQuizzes.addEventListener('click', (e) => { e.preventDefault(); switchTab('quizzes'); });
if(btnResults) btnResults.addEventListener('click', (e) => { e.preventDefault(); switchTab('results'); });

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
    if(results && results.length > 0) {
        const total = results.reduce((sum, r) => sum + r.score, 0);
        avgScore = Math.round(total / results.length);
    }
    const dAvg = document.getElementById('dashAvgScore');
    if (dAvg) dAvg.innerText = avgScore ? `%${avgScore}` : '%0';

    fetchAgenda();
}

async function fetchAgenda() {
    const agendaContainer = document.getElementById('agendaList');
    if (!agendaContainer || !currentTeacherId) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const { data: lessons } = await supabaseClient.from('private_lessons')
        .select('lesson_date, lesson_time, topic, profiles!inner(full_name)')
        .gte('lesson_date', todayStr)
        .eq('teacher_id', currentTeacherId); 

    const { data: homeworks } = await supabaseClient.from('homeworks')
        .select('due_date, title, status, profiles!inner(full_name)')
        .gte('due_date', todayStr)
        .eq('teacher_id', currentTeacherId); 

    let agendaItems = [];

    if (lessons) {
        lessons.forEach(l => {
            agendaItems.push({
                type: 'lesson',
                dateStr: l.lesson_date,
                timeStr: l.lesson_time || 'Belirtilmedi',
                dateObj: new Date(`${l.lesson_date}T${l.lesson_time || '00:00'}:00`),
                title: `${l.profiles?.full_name || 'Öğrenci'} ile Özel Ders`,
                desc: l.topic
            });
        });
    }

    if (homeworks) {
        homeworks.forEach(h => {
            if(h.status !== 'Tamamlandı') {
                agendaItems.push({
                    type: 'homework',
                    dateStr: h.due_date,
                    timeStr: '23:59',
                    dateObj: new Date(`${h.due_date}T23:59:00`),
                    title: `${h.profiles?.full_name || 'Öğrenci'} - Ödev Teslimi`,
                    desc: h.title
                });
            }
        });
    }

    agendaItems.sort((a, b) => a.dateObj - b.dateObj);
    agendaContainer.innerHTML = '';

    if (agendaItems.length === 0) {
        agendaContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-gray-400">
                <svg class="w-16 h-16 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                <p class="text-sm font-bold text-gray-500">Yaklaşan bir programınız yok.</p>
                <p id="agendaTeacherName" class="text-xs mt-1">${currentTeacherName} Öğretmenim, şimdi kafa dinleme vakti!</p>
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
            : `<div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div>`;

        const timeHtml = item.type === 'lesson' && item.timeStr !== 'Belirtilmedi' 
            ? `<span class="ml-2 text-xs font-black text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${item.timeStr}</span>` 
            : '';

        agendaContainer.innerHTML += `
            <div class="flex items-center gap-4 p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-700 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition group cursor-default">
                ${icon}
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1.5">
                        ${dateBadge}
                        ${timeHtml}
                    </div>
                    <h4 class="text-sm font-black text-gray-800 dark:text-white leading-tight group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition">${item.title}</h4>
                    <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[250px] sm:max-w-md">${item.desc}</p>
                </div>
            </div>`;
    });
}

// ==========================================
// 3. YENİ NESİL: VIP ÖĞRENCİ İSTİHBARAT MOTORU (LİMİTLİ)
// ==========================================
const studentModalEl = document.getElementById('addStudentModal');
const openStudBtn = document.getElementById('addStudentBtn');
const closeStudBtn = document.getElementById('closeModalBtn');
const studentFormEl = document.getElementById('newStudentForm');

if(openStudBtn) {
    openStudBtn.addEventListener('click', () => { 
        if (!isPremiumTeacher && currentStudentCount >= 3) {
            openPaywall("Maksimum Öğrenci Limitine Ulaştınız (3/3)");
            return;
        }
        if(studentModalEl) studentModalEl.classList.remove('hidden'); 
    });
}
if(closeStudBtn) closeStudBtn.addEventListener('click', () => { if(studentModalEl) studentModalEl.classList.add('hidden'); });

if(studentFormEl) {
    studentFormEl.addEventListener('submit', async function(e) {
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
                role: 'student', 
                parent_phone: parentPhone,
                teacher_id: currentTeacherId 
            }]);
            
            if (profileError) showToast("Hata: " + profileError.message, "error");
            else {
                showToast("Öğrenci başarıyla eklendi.", "success");
                if(studentModalEl) studentModalEl.classList.add('hidden'); 
                studentFormEl.reset(); 
                fetchStudents();
                fetchDashboardStats(); 
            }
        }
        submitBtn.innerText = originalText;
    });
}

window.deleteStudent = async function(id) {
    const onay = await customConfirm("Bu öğrenciyi kalıcı olarak silmek istediğine emin misin? Dönüşü yok!", "Evet, Sil");
    if (!onay) return; 
    const { error } = await supabaseClient.from('profiles').delete().eq('id', id);
    if (error) showToast("Silerken hata oldu: " + error.message, "error"); 
    else { showToast("Öğrenci silindi.", "success"); fetchStudents(); fetchDashboardStats(); }
};

// ===============================================
// VIP KARTLAR VE METRİKLER 
// ===============================================
async function fetchStudents() {
    const listContainer = document.getElementById('studentList');
    if(!listContainer || !currentTeacherId) return;
    
    listContainer.innerHTML = '<div class="w-full py-10 text-center text-gray-500 dark:text-gray-400 font-bold animate-pulse">İstihbarat verileri toplanıyor...</div>';

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
    if(quizResults && quizResults.length > 0) {
        quizResults.forEach(r => totalScore += r.score);
        document.getElementById('statClassAvg').innerText = `%${Math.round(totalScore / quizResults.length)}`;
    } else { document.getElementById('statClassAvg').innerText = `%0`; }

    let totalDebt = 0;
    if(lessons) { lessons.forEach(l => { if(!l.is_paid) totalDebt += Number(l.price || 0); }); }
    document.getElementById('statTotalDebt').innerText = `₺${totalDebt}`;

    if(homeworks && homeworks.length > 0) {
        const completedHw = homeworks.filter(h => h.status === 'Tamamlandı').length;
        const hwRate = Math.round((completedHw / homeworks.length) * 100);
        document.getElementById('statHwRate').innerText = `%${hwRate}`;
    } else { document.getElementById('statHwRate').innerText = `%0`; }

    listContainer.innerHTML = ''; 

    students.forEach(student => {
        const studentQuizzes = quizResults ? quizResults.filter(q => q.student_id === student.id) : [];
        const studentLessons = lessons ? lessons.filter(l => l.student_id === student.id) : [];
        
        let studAvg = 0;
        if(studentQuizzes.length > 0) {
            const sum = studentQuizzes.reduce((a, b) => a + b.score, 0);
            studAvg = Math.round(sum / studentQuizzes.length);
        }

        let studDebt = 0;
        studentLessons.forEach(l => { if(!l.is_paid) studDebt += Number(l.price || 0); });

        let avgColor = 'bg-gray-200 dark:bg-slate-700'; 
        let avgWidth = studAvg > 0 ? studAvg : 0;
        let badgeHtml = '';

        if(studAvg >= 85) {
            avgColor = 'bg-emerald-500';
            badgeHtml = `<span class="bg-gradient-to-r from-amber-400 to-yellow-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800" title="Parlayan Yıldız">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
            </span>`;
        } else if(studAvg >= 50) {
            avgColor = 'bg-yellow-500';
        } else if(studAvg > 0) {
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
                    <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-lg font-black shadow-inner border border-indigo-50 dark:border-slate-600">
                        ${student.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 class="font-black text-gray-800 dark:text-white text-base leading-tight">${student.full_name}</h4>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Kayıt: ${dateStr}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    ${badgeHtml}
                    <button onclick="deleteStudent('${student.id}')" class="text-gray-300 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 transition" title="Öğrenciyi Sil">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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
                <button onclick="openStudentProfile('${student.id}', '${student.full_name.replace(/'/g, "\\'")}', '${student.parent_phone || ''}')" class="bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-600 dark:hover:bg-indigo-500 text-indigo-600 dark:text-indigo-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-sm flex items-center gap-1">
                    PROFİLİ AÇ
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </button>
            </div>
        `;
        listContainer.appendChild(card);
    });

    const searchInput = document.getElementById('searchStudentInput');
    if(searchInput && searchInput.value.trim() !== '') {
        searchInput.dispatchEvent(new Event('input'));
    }
}

// ==========================================
// 4. ÖDEV MOTORLARI 
// ==========================================
window.deleteHomework = async function(id) {
    const onay = await customConfirm("Bu ödevi tamamen siliyorum, emin misin?", "Evet, Sil");
    if (!onay) return;
    const { error } = await supabaseClient.from('homeworks').delete().eq('id', id);
    if (error) showToast("Ödev silinirken hata oldu!", "error");
    else { showToast("Ödev silindi.", "success"); fetchHomeworks(); fetchStudents(); }
};

async function fillStudentSelect() {
    const { data } = await supabaseClient.from('profiles').select('id, full_name').eq('role', 'student').eq('teacher_id', currentTeacherId);
    const select = document.getElementById('hwStudentSelect');
    if (data && select) {
        select.innerHTML = '<option value="">Öğrenci Seçin...</option>';
        data.forEach(s => { select.innerHTML += `<option value="${s.id}">${s.full_name}</option>`; });
    }
}

const homeworkFormEl = document.getElementById('newHomeworkForm');
if(homeworkFormEl) {
    homeworkFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('hwStudentSelect').value;
        if (!studentId) { showToast("Önce öğrenciyi seçmelisin!", "error"); return; }

        const btn = homeworkFormEl.querySelector('button');
        const originalBtnHTML = btn.innerHTML;
        btn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Gönderiliyor...`;

        const { error } = await supabaseClient.from('homeworks').insert([{
            student_id: studentId,
            title: document.getElementById('hwTitle').value,
            description: document.getElementById('hwDesc').value,
            due_date: document.getElementById('hwDueDate').value,
            status: 'Bekliyor',
            teacher_id: currentTeacherId
        }]);

        if (error) showToast("Ödev hatası: " + error.message, "error"); 
        else { showToast("Ödev başarıyla verildi!", "success"); homeworkFormEl.reset(); fetchHomeworks(); fetchStudents(); }
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
            tbodyPending.innerHTML += `
                <tr class="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-800 transition">
                    <td class="p-4 font-bold text-gray-800 dark:text-white text-sm">${hw.profiles ? hw.profiles.full_name : 'Bilinmeyen'}</td>
                    <td class="p-4 text-gray-600 dark:text-gray-300 text-sm truncate max-w-[200px]" title="${hw.title}">${hw.title}</td>
                    <td class="p-4 text-amber-600 dark:text-amber-400 font-bold text-xs">${date}</td>
                    <td class="p-4 text-right flex items-center justify-end gap-2">
                        <button onclick="approveHomework('${hw.id}', '${hw.student_id}')" class="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white p-2.5 rounded-xl transition shadow-sm border border-emerald-100 dark:border-emerald-800" title="Ödevi Onayla ve +50 XP Ver">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                        </button>
                        <button onclick="deleteHomework('${hw.id}')" class="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white p-2.5 rounded-xl transition shadow-sm border border-rose-100 dark:border-rose-800" title="Ödevi Sil">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                </tr>`;
        });
    }

    if (completed.length === 0) {
        tbodyCompleted.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-gray-400 dark:text-gray-500 italic text-sm">Henüz onaylanmış ödev yok.</td></tr>';
    } else {
        completed.forEach(hw => {
            const date = new Date(hw.due_date).toLocaleDateString('tr-TR');
            tbodyCompleted.innerHTML += `
                <tr class="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-800 transition">
                    <td class="p-4 font-bold text-gray-800 dark:text-white text-sm">${hw.profiles ? hw.profiles.full_name : 'Bilinmeyen'}</td>
                    <td class="p-4 text-gray-600 dark:text-gray-300 text-sm truncate max-w-[200px]" title="${hw.title}">${hw.title}</td>
                    <td class="p-4 text-emerald-600 dark:text-emerald-400 font-bold text-xs">${date}</td>
                    <td class="p-4 text-right flex items-center justify-end gap-2">
                        <span class="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-700">ONAYLI</span>
                        <button onclick="deleteHomework('${hw.id}')" class="bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2 rounded-xl transition border border-gray-100 dark:border-slate-600" title="Kayıtlardan Sil">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                </tr>`;
        });
    }
}

window.approveHomework = async function(hwId, studentId) {
    const onay = await customConfirm("Ödevi onaylayıp öğrenciye +50 XP kazandırmak istediğinize emin misiniz?", "Evet, Onayla");
    if (!onay) return;

    showToast("Ödev onaylanıyor...", "info");

    const { error } = await supabaseClient.from('homeworks').update({ status: 'Tamamlandı' }).eq('id', hwId);
    if (error) {
        showToast("Hata oluştu: " + error.message, "error");
        return;
    }

    const { data: prof } = await supabaseClient.from('profiles').select('xp').eq('id', studentId).single();
    if (prof) {
        const newXp = (prof.xp || 0) + 50;
        await supabaseClient.from('profiles').update({ xp: newXp }).eq('id', studentId);
    }

    showToast("Ödev onaylandı! Öğrenciye +50 XP eklendi.", "success");
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

async function fetchActivities() {
    const { data, error } = await supabaseClient.from('activities').select('*').eq('teacher_id', currentTeacherId).order('created_at', { ascending: false });
    const container = document.getElementById('activityCards');
    if (!container || error) return;

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-400 italic font-medium p-10">Kütüphane henüz boş.</p>';
        return;
    }

    container.innerHTML = '';
    const icons = { 
        video: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>', 
        game: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>', 
        pdf: '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>' 
    };

    data.forEach(act => {
        container.innerHTML += `
            <div class="activity-card bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between hover:shadow-md transition" data-category="${act.category}">
                <div>
                    <span class="text-indigo-500 dark:text-indigo-400 block mb-3">${icons[act.category] || '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>'}</span>
                    <h4 class="font-black text-gray-800 dark:text-white uppercase text-xs tracking-widest">${act.title}</h4>
                </div>
                <div class="mt-5 flex justify-between items-center border-t border-gray-100 dark:border-slate-700 pt-3">
                    <a href="${act.link}" target="_blank" class="text-indigo-600 dark:text-indigo-400 font-black text-[10px] hover:underline uppercase tracking-tighter flex items-center gap-1">AÇ <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></a>
                    <button onclick="deleteActivity('${act.id}')" class="text-gray-300 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 transition" title="Sil"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
            </div>`;
    });
}

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

window.openQuestionEditor = function(id, title) {
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
        if(countDisplay) countDisplay.innerText = "0";
        listContainer.innerHTML = '<div class="text-center py-20 text-gray-300 dark:text-gray-600 font-bold italic">Henüz hiç soru eklenmemiş.</div>';
        return;
    }

    if(countDisplay) countDisplay.innerText = data.length;
    listContainer.innerHTML = '';

    data.forEach((q, index) => {
        listContainer.innerHTML += `
            <div class="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm relative group hover:border-indigo-200 transition">
                <div class="flex items-start">
                    <span class="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black mr-3 mt-1">${index + 1}</span>
                                        <div class="flex-1" lang="en">
                        <p class="text-sm font-black text-gray-800 dark:text-white leading-tight mb-3">${q.question_text}</p>
                        <div class="grid grid-cols-2 gap-2 text-xs font-bold">
                            <span class="p-2 rounded-xl ${q.correct_option === 'A' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-300'}">A: ${q.option_a}</span>
                            <span class="p-2 rounded-xl ${q.correct_option === 'B' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-300'}">B: ${q.option_b}</span>
                            <span class="p-2 rounded-xl ${q.correct_option === 'C' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-300'}">C: ${q.option_c}</span>
                            <span class="p-2 rounded-xl ${q.correct_option === 'D' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-300'}">D: ${q.option_d}</span>
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
                        <h4 class="text-base md:text-lg font-black text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition truncate">${quiz.title}</h4>
                        <p class="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span> Yayında
                        </p>
                    </div>
                </div>
                <div class="flex items-center space-x-2 shrink-0">
                    <button onclick="openQuestionEditor('${quiz.id}', '${quiz.title.replace(/'/g, "\\'")}')" class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg> YÖNET
                    </button>
                    <button onclick="deleteQuiz('${quiz.id}')" class="bg-gray-50 dark:bg-slate-700 text-gray-400 dark:text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2.5 rounded-xl transition border border-gray-100 dark:border-slate-600" title="Sınavı Sil">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </div>`;
    });
}

window.deleteQuiz = async (id) => {
    const onay = await customConfirm("Bu sınavı ve içindeki TÜM soruları siliyorum, emin misin?", "Evet, Sil");
    if (!onay) return;
    await supabaseClient.from('quizzes').delete().eq('id', id);
    showToast("Sınav tamamen silindi.", "success");
    fetchQuizzes();
    fetchDashboardStats();
};

// ==========================================
// 7. SONUÇLAR VE ÖĞRETMEN ANALİZ MOTORU
// ==========================================
let currentResultsData = {}; 

async function fetchResults() {
    const { data, error } = await supabaseClient.from('quiz_results')
        .select(`*, profiles!inner(full_name, teacher_id), quizzes(title)`)
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
        const date = dateObj.toLocaleDateString('tr-TR') + ' ' + dateObj.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
        
        let scoreColor = 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
        if (res.score < 50) scoreColor = 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
        else if (res.score < 80) scoreColor = 'text-yellow-600 bg-yellow-50 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';

        tbody.innerHTML += `
            <tr class="border-b border-gray-50 dark:border-slate-700/50 hover:bg-indigo-50/30 dark:hover:bg-slate-800 transition text-sm">
                <td class="p-4 font-black text-gray-800 dark:text-white">${res.profiles ? res.profiles.full_name : 'Bilinmeyen Öğrenci'}</td>
                <td class="p-4 text-gray-600 dark:text-gray-300 font-bold">${res.quizzes ? res.quizzes.title : 'Silinmiş Sınav'}</td>
                <td class="p-4 text-center"><span class="px-3 py-1 rounded-xl font-black text-xs uppercase tracking-wider border ${scoreColor}">${res.score} PUAN</span></td>
                <td class="p-4 text-gray-400 dark:text-gray-500 text-xs font-bold">${date}</td>
                <td class="p-4 text-right flex items-center justify-end space-x-2">
                    <button onclick="openTeacherAnalysis('${res.id}')" class="bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1">GÖZ AT <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg></button>
                    <button onclick="deleteResult('${res.id}')" class="text-gray-300 dark:text-gray-600 hover:text-rose-500 dark:hover:text-rose-400 p-2 rounded-xl transition" title="Sonucu Sil"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </td>
            </tr>`;
    });
}

window.deleteResult = async function(id) {
    const onay = await customConfirm("Bu öğrencinin sınav sonucunu kalıcı olarak siliyorum, emin misin?", "Evet, Sil");
    if (!onay) return;
    await supabaseClient.from('quiz_results').delete().eq('id', id);
    fetchResults(); 
};

window.openTeacherAnalysis = function(resultId) {
    const res = currentResultsData[resultId];
    if(!res) return;

    document.getElementById('taStudentName').innerText = res.profiles?.full_name || 'Bilinmeyen';
    document.getElementById('taQuizTitle').innerText = res.quizzes?.title || 'Silinmiş';
    document.getElementById('taScoreDisplay').innerText = res.score;
    const taCont = document.getElementById('taDetailsContainer');

    if(taCont) {
        taCont.innerHTML = '';
        const details = res.details || [];
        if(details.length === 0) {
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
                            <h4 class="text-sm md:text-lg font-black text-gray-800 dark:text-white pt-0.5 md:pt-1 leading-snug">${detail.q_no}. ${detail.q_text}</h4>
                        </div>
                        <div class="pl-9 md:pl-12 text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400">
                            Cevabı: ${detail.selected_opt} | Doğru: ${detail.correct_opt}
                        </div>
                    </div>`;
            });
        }
    }
    document.getElementById('teacherAnalysisModal').classList.remove('hidden');
}

window.closeTeacherAnalysisModal = () => document.getElementById('teacherAnalysisModal').classList.add('hidden');

// ==========================================
// 9. VIP ÖĞRENCİ PROFİLİ VE PDF KARNE MOTORU
// ==========================================
window.openStudentProfile = async function(id, name, phone) {
    document.getElementById('profStudentId').value = id;
    document.getElementById('profParentPhone').value = phone || ''; 
    document.getElementById('profileStudentName').innerText = name;

    const today = new Date().toLocaleDateString('tr-TR');
    document.getElementById('pdfDate').innerText = today;
    
    const certDateEl = document.getElementById('certDate');
    if (certDateEl) certDateEl.innerText = today;
    
    document.getElementById('lessonDate').value = new Date().toISOString().split('T')[0]; 

    document.getElementById('studentProfileModal').classList.remove('hidden');
    fetchStudentLessons(id);
}

const newLessonForm = document.getElementById('newLessonForm');
if(newLessonForm) {
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
    if(!list || !pdfList) return;
    
    list.innerHTML = ''; pdfList.innerHTML = '';

    if (!lessons || lessons.length === 0) {
        list.innerHTML = '<p class="text-gray-400 dark:text-gray-500 text-sm italic p-4 text-center">Henüz seans kaydı girilmemiş.</p>';
        pdfList.innerHTML = '<p class="text-gray-500 italic">Bu dönem kayıtlı seans bulunmamaktadır.</p>';
    } else {
        let totalUnpaid = 0; 
        lessons.forEach(l => {
            const date = new Date(l.lesson_date).toLocaleDateString('tr-TR');
            const time = l.lesson_time ? l.lesson_time : '';
            const duration = l.duration_hours ? `${l.duration_hours} Saat` : '';
            if (!l.is_paid) totalUnpaid += Number(l.price || 0);

            const payBadge = l.is_paid 
                ? `<span class="text-[10px] font-black bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md">ÖDENDİ</span>`
                : `<button onclick="markAsPaid('${l.id}', '${studentId}')" class="text-[10px] font-black bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-500 hover:text-white border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-md transition shadow-sm">ÖDENMEDİ (Tahsil Et)</button>`;

            const priceText = l.price ? `<span class="text-[10px] font-black bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-gray-200 px-2 py-1 rounded-md">₺${l.price}</span>` : '';

            list.innerHTML += `
                <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col hover:border-indigo-200 transition">
                    <div class="flex justify-between items-start">
                        <div class="flex flex-wrap gap-2 mb-2">
                            <span class="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-md flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> ${date}</span>
                            ${time ? `<span class="text-[10px] font-black bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-md flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${time}</span>` : ''}
                            ${duration ? `<span class="text-[10px] font-black bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-md flex items-center gap-1"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg> ${duration}</span>` : ''}
                            ${priceText}
                        </div>
                        <button onclick="deleteLesson('${l.id}')" class="text-gray-300 dark:text-gray-600 hover:text-rose-500 transition ml-3" title="Kaydı Sil"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                    <p class="text-sm font-bold text-gray-700 dark:text-white mt-1 leading-snug">${l.topic}</p>
                    <div class="mt-3 border-t border-gray-50 dark:border-slate-700 pt-2 flex justify-between items-center">
                        ${payBadge}
                    </div>
                </div>`;
            
            pdfList.innerHTML += `<div class="mb-4 border-b border-gray-100 pb-3"><p class="text-xs font-black text-indigo-600 tracking-wider">${date}</p><p class="text-sm font-bold text-gray-800 mt-1">${l.topic}</p></div>`;
        });

        const badgeEl = document.getElementById('unpaidTotalBadge');
        if (totalUnpaid > 0) { badgeEl.innerText = `Bekleyen: ₺${totalUnpaid}`; badgeEl.classList.remove('hidden'); } 
        else { badgeEl.classList.add('hidden'); }
    }

    const { data: results } = await supabaseClient.from('quiz_results').select('score, quizzes(title)').eq('student_id', studentId).order('created_at', { ascending: true });
    const pdfQuizList = document.getElementById('pdfQuizList');
    if(pdfQuizList) pdfQuizList.innerHTML = '';
    let labels = [], scores = [];

    if (!results || results.length === 0) {
        if(pdfQuizList) pdfQuizList.innerHTML = '<p class="text-gray-500 italic">Öğrenci henüz sınava girmemiştir.</p>';
        labels = ['Sınav Yok']; scores = [0];
    } else {
        results.forEach(r => {
            labels.push(r.quizzes.title); scores.push(r.score);
            let color = r.score >= 80 ? 'text-emerald-600' : (r.score >= 50 ? 'text-yellow-600' : 'text-rose-600');
            if(pdfQuizList) {
                pdfQuizList.innerHTML = `<div class="flex justify-between items-center mb-2 border-b border-gray-100 pb-2"><span class="text-sm font-bold text-gray-700">${r.quizzes.title}</span><span class="text-sm font-black ${color}">${r.score} Puan</span></div>` + pdfQuizList.innerHTML; 
            }
        });
    }

    const chartConfig = (isPdf) => ({
        type: 'line',
        data: { labels: labels, datasets: [{ label: 'Sınav Puanı', data: scores, borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', borderWidth: 3, tension: 0.4, fill: true, pointRadius: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, animation: isPdf ? false : { duration: 1000 }, scales: { y: { beginAtZero: true, max: 100 } }, plugins: { legend: { display: false } } }
    });

    if(profileChartInstance) profileChartInstance.destroy();
    if(pdfChartInstance) pdfChartInstance.destroy();

    const ctxProf = document.getElementById('profileChart');
    const ctxPdf = document.getElementById('pdfChart');
    if(ctxProf) profileChartInstance = new Chart(ctxProf.getContext('2d'), chartConfig(false));
    if(ctxPdf) pdfChartInstance = new Chart(ctxPdf.getContext('2d'), chartConfig(true));
}

window.deleteLesson = async function(id) {
    if (!await customConfirm("Ders kaydını silmek istediğine emin misin?", "Evet, Sil")) return;
    await supabaseClient.from('private_lessons').delete().eq('id', id);
    fetchStudentLessons(document.getElementById('profStudentId').value);
    fetchStudents(); 
}

window.markAsPaid = async function(lessonId, studentId) {
    showToast("Tahsilat işleniyor...", "info");
    const { error } = await supabaseClient.from('private_lessons').update({ is_paid: true }).eq('id', lessonId);
    if(error) showToast("Hata oluştu: " + error.message, "error");
    else { 
        showToast("Para kasaya girdi, ders ödendi olarak işaretlendi!", "success"); 
        fetchStudentLessons(studentId); 
        fetchStudents(); 
    }
}

// ==========================================
// YENİ DÜZELTİLMİŞ PDF VE SERTİFİKA MOTORU
// ==========================================
window.generatePDF = function() {
    if (!isPremiumTeacher) { openPaywall("PDF Gelişim Raporu VIP Bir Özelliktir"); return; }
    showToast("PDF hazırlanıyor, lütfen bekleyin...", "info");
    const element = document.getElementById('pdfTemplate');
    const sName = document.getElementById('profileStudentName').innerText;
    const opt = { margin: 0, filename: `${sName}_Gelisim_Raporu.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } };
    
    html2pdf().set(opt).from(element).save().then(() => { 
        showToast("PDF Başarıyla İndirildi!", "success"); 
    });
}

window.generateCertificate = function() {
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
// YENİ NESİL WHATSAPP VELİ RAPORU MOTORU
// ==========================================
window.sendWhatsAppReport = function() {
    if (!isPremiumTeacher) { openPaywall("Canlı Veli Linki VIP Bir Özelliktir"); return; }
    const studentName = document.getElementById('profileStudentName').innerText;
    const studentId = document.getElementById('profStudentId').value;
    let rawPhone = document.getElementById('profParentPhone').value; 
    
    if (!rawPhone || rawPhone.trim() === '') {
        showToast("Bu öğrencinin veli numarası sisteme kayıtlı değil!", "error");
        return;
    }

    let phone = rawPhone.replace(/\D/g, ''); 
    if(phone.startsWith('0')) phone = phone.substring(1); 
    if(phone.length === 10) phone = '90' + phone; 

    const currentUrl = window.location.href.split('/').slice(0, -1).join('/'); 
    const magicLink = `${currentUrl}/veli.html?id=${studentId}`;

    const message = `Merhaba Sayın Velimiz,\n\nÖğrencimiz *${studentName}*'ın İngilizce derslerindeki güncel gelişim raporu, sınav sonuçları ve ödev durumunu aşağıdaki akıllı linkten inceleyebilirsiniz:\n\n ${magicLink}\n\nİyi günler dilerim!`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    showToast("Veli sohbeti açılıyor...", "success");
}

// ==========================================
// 10. DİNAMİK KARŞILAMA MESAJI MOTORU
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
    if(msgEl) msgEl.innerText = randomMsg;
}

// ==========================================
// 11. GECE MODU (DARK MODE) MOTORU
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
// 12. GERÇEK ZAMANLI ÖĞRENCİ ARAMA MOTORU
// ==========================================
const searchStudentInput = document.getElementById('searchStudentInput');

if (searchStudentInput) {
    searchStudentInput.addEventListener('input', function(e) {
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
// 13. YAPAY ZEKA (AI) OTOMATİK SINAV MOTORU
// ==========================================
const btnGenerateAI = document.getElementById('btnGenerateAI');
if (btnGenerateAI) {
    btnGenerateAI.addEventListener('click', async () => {
        if (!currentActiveQuizId) { showToast('Önce bir sınav seçmelisin!', 'error'); return; }

        const topicInput = document.getElementById('aiTopicInput');
        const countInput = document.getElementById('aiQuestionCount');
        
        const topic = topicInput ? topicInput.value.trim() : '';
        let qCount = countInput ? parseInt(countInput.value) : 5;
        
        if (!topic) { showToast('Lütfen yapay zeka için bir konu yazın!', 'error'); return; }
        if (isNaN(qCount) || qCount < 1) qCount = 5;
        if (qCount > 20) { showToast('En fazla 20 soru üretebilirsiniz.', 'error'); return; }

        let apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            apiKey = prompt("Lütfen OpenAI API Şifrenizi (sk-...) girin:\n\n(Sadece sizin cihazınızda kalır, güvendedir.)");
            if (!apiKey) { showToast('İşlem iptal edildi.', 'error'); return; }
            localStorage.setItem('openai_api_key', apiKey.trim());
        }

        const originalText = btnGenerateAI.innerHTML;
        btnGenerateAI.innerHTML = '<svg class="animate-spin h-5 w-5 text-purple-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
        btnGenerateAI.disabled = true;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { 
                            role: 'system', 
                            content: `Sen uzman bir İngilizce öğretmenisin. Verilen konuya göre tam ${qCount} adet çoktan seçmeli (A, B, C, D) İngilizce sorusu hazırla. Çıktıyı SADECE ve KESİNLİKLE geçerli bir JSON dizisi formatında ver. Soru ve şıklardaki İngilizce kelimelerde kesinlikle Türkçe karakter (İ, ı, ş, ğ vb.) kullanma, sadece standart İngilizce alfabesi kullan. Markdown kullanma. Format: [{"q": "Soru", "a": "A", "b": "B", "c": "C", "d": "D", "correct": "A"}]` 
                        },
                        { 
                            role: 'user', 
                            content: `Konu: ${topic}` 
                        }
                    ], 
                    temperature: 0.7
                })
            });

            const data = await response.json();
            
            if (data.error) {
                console.error("OpenAI Hatası:", data.error);
                showToast('API Hatası! Şifreniz yanlış veya krediniz bitmiş.', 'error');
                if(data.error.code === 'invalid_api_key') localStorage.removeItem('openai_api_key');
                btnGenerateAI.innerHTML = originalText;
                btnGenerateAI.disabled = false;
                return;
            }

            let jsonStr = data.choices[0].message.content.trim();
            if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace('```json', '');
            if (jsonStr.endsWith('```')) jsonStr = jsonStr.replace('```', '');
            jsonStr = jsonStr.trim();

            const questions = JSON.parse(jsonStr);
            showToast(`Yapay zeka ${questions.length} soru yazdı! Yükleniyor...`, 'info');

            const inserts = questions.map(q => ({
                quiz_id: currentActiveQuizId,
                question_text: q.q,
                option_a: q.a,
                option_b: q.b,
                option_c: q.c,
                option_d: q.d,
                correct_option: q.correct
            }));

            const { error } = await supabaseClient.from('questions').insert(inserts);
            if (error) throw error;

            showToast(`Sihir gerçekleşti! ${questions.length} soru eklendi.`, 'success');
            if(topicInput) topicInput.value = '';
            fetchQuestionsForQuiz(currentActiveQuizId);

        } catch (err) {
            console.error(err);
            showToast('Sorular üretilemedi veya AI yanıtı çözülemedi.', 'error');
        }

        btnGenerateAI.innerHTML = originalText;
        btnGenerateAI.disabled = false;
    });
}

document.addEventListener('click', (e) => {
    const filterBtn = e.target.closest('.filter-btn');
    if (filterBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.className = "filter-btn bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap shadow-sm border border-gray-100 dark:border-slate-700 transition flex items-center gap-1";
        });
        filterBtn.className = "filter-btn bg-purple-600 text-white px-5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap shadow-[0_0_15px_rgba(147,51,234,0.4)] transition flex items-center gap-1";
        
        const filter = filterBtn.getAttribute('data-filter');
        document.querySelectorAll('.activity-card').forEach(card => {
            card.style.display = (filter === 'all' || card.getAttribute('data-category') === filter) ? 'flex' : 'none';
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const hwDueDateInput = document.getElementById('hwDueDate');
    if (hwDueDateInput) hwDueDateInput.value = new Date().toISOString().split('T')[0];
});

// ==========================================
// 14. PAYWALL (ÖDEME DUVARI) MOTORU
// ==========================================
window.openPaywall = function(reasonText) {
    const reasonEl = document.getElementById('paywallReason');
    if (reasonEl) reasonEl.innerText = reasonText;
    const modal = document.getElementById('paywallModal');
    const box = document.getElementById('paywallBox');
    if(modal) {
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); if(box) box.classList.remove('scale-95'); }, 10);
    }
}

window.closePaywall = function() {
    const modal = document.getElementById('paywallModal');
    const box = document.getElementById('paywallBox');
    if(modal) {
        modal.classList.add('opacity-0'); 
        if(box) box.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

// MOTORLARI ATEŞLE
if (typeof setDynamicMotivations === 'function') setDynamicMotivations();
checkTeacherSecurity();
