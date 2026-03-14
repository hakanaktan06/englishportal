// ==========================================
// 1. SUPABASE BAĞLANTISI (Sistem Anahtarı)
// ==========================================
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// UI ULTRA: ŞIK BİLDİRİM VE ONAY MOTORU
// ==========================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-600' : (type === 'error' ? 'bg-red-600' : 'bg-blue-600');
    const icon = type === 'success' ? '✅' : (type === 'error' ? '⚠️' : 'ℹ️');

    toast.className = `${bgColor} text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-${bgColor}/30 font-bold text-sm flex items-center gap-3 transform transition-all duration-300 translate-y-10 opacity-0`;
    toast.innerHTML = `<span class="text-lg">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => { toast.classList.remove('translate-y-10', 'opacity-0'); }, 10);
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300); 
    }, 3000);
}

function customConfirm(message, btnText = "Evet, Sil") {
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
// GÜVENLİK (FEDAİ) MOTORU VE SPLASH KAPATMA
// ==========================================
async function checkTeacherSecurity() {
    try {
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) { window.location.href = 'index.html'; return; } 
        
        const { data: profile, error: profileError } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
        if (profileError || !profile || profile.role !== 'teacher') {
            showToast("Erişim Engellendi! Yönetici yetkiniz yok.", "error");
            setTimeout(() => { window.location.href = 'student.html'; }, 1500); 
            return;
        }

        // GÜVENLİK GEÇİLDİĞİNDE SPLASH EKRANINI KALDIR! (GARANTİLİ)
        setTimeout(() => {
            const splash = document.getElementById('splashScreen');
            if(splash) {
                splash.classList.add('opacity-0');
                setTimeout(() => splash.classList.add('hidden'), 700);
            }
        }, 400);
    } catch (err) {
        console.error(err);
        window.location.href = 'index.html';
    }
}
checkTeacherSecurity(); 

// ==========================================
// ÇIKIŞ MOTORU
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

// ==========================================
// MOBİL HAMBURGER MENÜ MOTORU
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
    const { count: studentCount } = await supabaseClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
    const dStud = document.getElementById('dashStudentCount');
    if (dStud) dStud.innerText = studentCount || 0;

    const { count: quizCount } = await supabaseClient.from('quizzes').select('*', { count: 'exact', head: true });
    const dQuiz = document.getElementById('dashQuizCount');
    if (dQuiz) dQuiz.innerText = quizCount || 0;

    const { count: hwCount } = await supabaseClient.from('homeworks').select('*', { count: 'exact', head: true });
    const dHw = document.getElementById('dashHwCount');
    if (dHw) dHw.innerText = hwCount || 0;

    const { data: results } = await supabaseClient.from('quiz_results').select('score');
    let avgScore = 0;
    if(results && results.length > 0) {
        const total = results.reduce((sum, r) => sum + r.score, 0);
        avgScore = Math.round(total / results.length);
    }
    const dAvg = document.getElementById('dashAvgScore');
    if (dAvg) dAvg.innerText = avgScore ? `%${avgScore}` : '%0';

    // AJANDAYI ÇALIŞTIR
    fetchAgenda();
}

async function fetchAgenda() {
    const agendaContainer = document.getElementById('agendaList');
    if (!agendaContainer) return;

    // Bugünü bul
    const todayStr = new Date().toISOString().split('T')[0];

    // Bugünden sonraki Özel Dersleri Çek
    const { data: lessons } = await supabaseClient.from('private_lessons')
        .select('lesson_date, lesson_time, topic, profiles(full_name)')
        .gte('lesson_date', todayStr);

    // Bugünden sonraki veya bekleyen Ödevleri Çek
    const { data: homeworks } = await supabaseClient.from('homeworks')
        .select('due_date, title, status, profiles(full_name)')
        .gte('due_date', todayStr);

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

    // Tarihe göre sırala (En yakından en uzağa)
    agendaItems.sort((a, b) => a.dateObj - b.dateObj);

    agendaContainer.innerHTML = '';

    if (agendaItems.length === 0) {
        agendaContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center py-10 text-gray-400">
                <span class="text-5xl mb-3 opacity-50">☕</span>
                <p class="text-sm font-bold text-gray-500">Yaklaşan bir programınız yok.</p>
                <p class="text-xs mt-1">Gülbahar Öğretmenim, şimdi kafa dinleme vakti!</p>
            </div>`;
        return;
    }

    // Ajanda Maddelerini Ekrana Bas
    agendaItems.slice(0, 10).forEach(item => {
        const d = item.dateObj;
        const dayName = d.toLocaleDateString('tr-TR', { weekday: 'long' });
        const shortDate = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
        
        const isToday = d.toDateString() === new Date().toDateString();
        const dateBadge = isToday 
            ? `<span class="bg-red-50 border border-red-100 text-red-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase shadow-sm">BUGÜN</span>`
            : `<span class="bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase">${shortDate} ${dayName}</span>`;

        const icon = item.type === 'lesson' 
            ? `<div class="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm"><span class="text-xl">👩‍🏫</span></div>`
            : `<div class="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm"><span class="text-xl">📚</span></div>`;

        const timeHtml = item.type === 'lesson' && item.timeStr !== 'Belirtilmedi' 
            ? `<span class="ml-2 text-xs font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">⏰ ${item.timeStr}</span>` 
            : '';

        agendaContainer.innerHTML += `
            <div class="flex items-center gap-4 p-3.5 hover:bg-slate-50/80 rounded-2xl border border-transparent hover:border-slate-200 transition group cursor-default">
                ${icon}
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1.5">
                        ${dateBadge}
                        ${timeHtml}
                    </div>
                    <h4 class="text-sm font-black text-gray-800 leading-tight group-hover:text-indigo-700 transition">${item.title}</h4>
                    <p class="text-xs font-medium text-gray-500 mt-1 truncate max-w-[250px] sm:max-w-md">${item.desc}</p>
                </div>
            </div>`;
    });
}


// ==========================================
// 3. ÖĞRENCİ MOTORLARI (KAYIT, SİLME, LİSTELEME)
// ==========================================
const studentModalEl = document.getElementById('addStudentModal');
const openStudBtn = document.getElementById('addStudentBtn');
const closeStudBtn = document.getElementById('closeModalBtn');
const studentFormEl = document.getElementById('newStudentForm');

if(openStudBtn) {
    openStudBtn.addEventListener('click', () => { 
        if(studentModalEl) studentModalEl.classList.remove('hidden'); 
    });
}

if(closeStudBtn) {
    closeStudBtn.addEventListener('click', () => { 
        if(studentModalEl) studentModalEl.classList.add('hidden'); 
    });
}

if(studentFormEl) {
    studentFormEl.addEventListener('submit', async function(e) {
        e.preventDefault(); 
        
        const submitBtn = studentFormEl.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "⏳ Kaydediliyor...";

        const name = document.getElementById('studentName').value;
        const email = document.getElementById('studentEmail').value;
        const password = document.getElementById('studentPassword').value;

        const { data, error } = await supabaseClient.auth.signUp({ email, password });

        if (error) {
            showToast("Hata: " + error.message, "error");
            submitBtn.innerText = originalText;
            return;
        }

        if (data.user) {
            const { error: profileError } = await supabaseClient
                .from('profiles')
                .insert([{ id: data.user.id, full_name: name, role: 'student' }]);

            if (profileError) {
                showToast("Profile eklenirken hata: " + profileError.message, "error");
            } else {
                showToast("Öğrenci başarıyla eklendi.", "success");
                if(studentModalEl) studentModalEl.classList.add('hidden'); 
                studentFormEl.reset(); 
                fetchStudents();
            }
        }
        submitBtn.innerText = originalText;
    });
}

window.deleteStudent = async function(id) {
    const onay = await customConfirm("Bu öğrenciyi kalıcı olarak silmek istediğine emin misin? Dönüşü yok!");
    if (!onay) return; 
    
    const { error } = await supabaseClient.from('profiles').delete().eq('id', id);
        
    if (error) { 
        showToast("Silerken hata oldu: " + error.message, "error"); 
    } else { 
        showToast("Öğrenci silindi.", "success");
        fetchStudents(); 
    }
};

async function fetchStudents() {
    const { data, error } = await supabaseClient.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false });
    if (error) return; 

    const tbody = document.getElementById('studentList');
    const totalStudents = document.getElementById('totalStudents');

    if (!data || data.length === 0) {
        if(totalStudents) totalStudents.innerText = "0";
        if(tbody) tbody.innerHTML = `<tr><td colspan="4" class="p-10 text-center text-gray-500 italic">Henüz hiç öğrenci yok.</td></tr>`;
        return;
    }

    if(totalStudents) totalStudents.innerText = data.length;
    if(tbody) tbody.innerHTML = ''; 

    data.forEach(student => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-gray-100 hover:bg-indigo-50/20 transition";
        const dateObj = new Date(student.created_at);
        const date = dateObj.toLocaleDateString('tr-TR');

        tr.innerHTML = `
            <td class="p-4 font-bold text-gray-800 flex items-center text-sm">
                <div class="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs mr-3 shadow-sm">
                    ${student.full_name.charAt(0).toUpperCase()}
                </div>
                ${student.full_name}
            </td>
            <td class="p-4 text-gray-400 text-xs italic font-medium">Öğrenci Hesabı</td>
            <td class="p-4 text-gray-500 text-xs font-bold">${date}</td>
            <td class="p-4">
                <div class="flex items-center justify-end space-x-2">
                    <button onclick="openStudentProfile('${student.id}', '${student.full_name.replace(/'/g, "\\'")}')" class="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black transition whitespace-nowrap">
                        📂 PROFİL & KARNE
                    </button>
                    <button onclick="deleteStudent('${student.id}')" class="text-gray-300 hover:text-red-500 p-2 text-lg transition" title="Öğrenciyi Sil">🗑️</button>
                </div>
            </td>
        `;
        if(tbody) tbody.appendChild(tr);
    });
}


// ==========================================
// 4. ÖDEV MOTORLARI 
// ==========================================
window.deleteHomework = async function(id) {
    const onay = await customConfirm("Bu ödevi tamamen siliyorum, emin misin?");
    if (!onay) return;
    
    const { error } = await supabaseClient.from('homeworks').delete().eq('id', id);

    if (error) showToast("Ödev silinirken hata oldu!", "error");
    else {
        showToast("Ödev silindi.", "success");
        fetchHomeworks();
    }
};

async function fillStudentSelect() {
    const { data } = await supabaseClient.from('profiles').select('id, full_name').eq('role', 'student');
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
        btn.innerText = "🚀 Gönderiliyor...";

        const { error } = await supabaseClient.from('homeworks').insert([{
            student_id: studentId,
            title: document.getElementById('hwTitle').value,
            description: document.getElementById('hwDesc').value,
            due_date: document.getElementById('hwDueDate').value
        }]);

        if (error) { 
            showToast("Ödev hatası: " + error.message, "error"); 
        } else { 
            showToast("Ödev başarıyla verildi!", "success"); 
            homeworkFormEl.reset(); 
            fetchHomeworks(); 
        }
        btn.innerText = "Ödevi Gönder";
    });
}

async function fetchHomeworks() {
    const { data, error } = await supabaseClient.from('homeworks').select('*, profiles(full_name)').order('created_at', { ascending: false });
    const tbody = document.getElementById('homeworkList');
    if (error || !tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-400 italic text-sm">Henüz hiç ödev verilmemiş.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    data.forEach(hw => {
        const date = new Date(hw.due_date).toLocaleDateString('tr-TR');
        const status = hw.status || 'bekliyor';
        
        let statusHtml = status === 'Tamamlandı' 
            ? `<span class="px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-lg text-[10px] font-black uppercase tracking-widest block w-fit mx-auto">Tamamlandı</span>` 
            : `<span class="px-3 py-1 bg-yellow-50 text-yellow-600 border border-yellow-100 rounded-lg text-[10px] font-black uppercase tracking-widest block w-fit mx-auto">Bekliyor</span>`;

        let noteHtml = hw.student_note 
            ? `<button onclick="openStudentNoteModal('${hw.student_note.replace(/'/g, "&#39;").replace(/"/g, "&quot;").replace(/\n/g, "\\n")}')" class="mt-2 w-full bg-yellow-100 hover:bg-yellow-500 text-yellow-700 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition shadow-sm border border-yellow-200 hover:border-yellow-600">NOTU GÖR</button>` 
            : '';

        tbody.innerHTML += `
            <tr class="border-b border-gray-50 hover:bg-gray-50/50 transition">
                <td class="p-4 font-bold text-gray-800 text-sm">${hw.profiles ? hw.profiles.full_name : 'Bilinmeyen'}</td>
                <td class="p-4 text-gray-600 text-sm truncate max-w-[200px]" title="${hw.title}">${hw.title}</td>
                <td class="p-4 text-red-500 font-bold text-xs">${date}</td>
                <td class="p-4 text-center">${statusHtml}${noteHtml}</td>
                <td class="p-4 text-right"><button onclick="deleteHomework('${hw.id}')" class="text-gray-300 hover:text-red-500 p-2 text-xl transition" title="Ödevi Sil">🗑️</button></td>
            </tr>`;
    });
}

window.openStudentNoteModal = function(noteText) {
    const elNote = document.getElementById('fullStudentNoteText');
    const modalNote = document.getElementById('studentNoteModal');
    if (elNote) elNote.innerText = noteText;
    if (modalNote) modalNote.classList.remove('hidden');
};

window.closeStudentNoteModal = function() {
    const modalNote = document.getElementById('studentNoteModal');
    if (modalNote) modalNote.classList.add('hidden');
};


// ==========================================
// 5. ETKİNLİK MOTORLARI 
// ==========================================
const activityFormEl = document.getElementById('newActivityForm');
if (activityFormEl) {
    activityFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = activityFormEl.querySelector('button');
        btn.innerText = "🚀 Ekleniyor...";

        const { error } = await supabaseClient.from('activities').insert([{
            title: document.getElementById('actTitle').value,
            category: document.getElementById('actCategory').value,
            link: document.getElementById('actLink').value
        }]);

        if (error) {
            showToast("Hata: " + error.message, "error");
        } else {
            showToast("Etkinlik kütüphaneye eklendi!", "success");
            activityFormEl.reset();
            fetchActivities();
        }
        btn.innerText = "Kütüphaneye Ekle";
    });
}

window.deleteActivity = async (id) => {
    const onay = await customConfirm("Bu etkinliği sileyim mi kanka?");
    if (!onay) return;
    
    const { error } = await supabaseClient.from('activities').delete().eq('id', id);
    if (error) showToast("Silinirken hata!", "error"); else fetchActivities();
};

async function fetchActivities() {
    const { data, error } = await supabaseClient.from('activities').select('*').order('created_at', { ascending: false });
    const container = document.getElementById('activityCards');
    if (!container || error) return;

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-400 italic font-medium p-10">Kütüphane henüz boş.</p>';
        return;
    }

    container.innerHTML = '';
    const icons = { video: '📺', game: '🎮', pdf: '📄' };

    data.forEach(act => {
        container.innerHTML += `
            <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition">
                <div>
                    <span class="text-4xl">${icons[act.category] || '🔗'}</span>
                    <h4 class="font-black mt-3 text-gray-800 uppercase text-xs tracking-widest">${act.title}</h4>
                </div>
                <div class="mt-5 flex justify-between items-center border-t pt-3">
                    <a href="${act.link}" target="_blank" class="text-indigo-600 font-black text-[10px] hover:underline uppercase tracking-tighter">AÇ ↗</a>
                    <button onclick="deleteActivity('${act.id}')" class="text-gray-300 hover:text-red-500 transition text-xl">🗑️</button>
                </div>
            </div>`;
    });
}


// ==========================================
// 6. SINAV MOTORU VE AKILLI SÜRE SEÇİCİ
// ==========================================
document.getElementById('addQuizBtn')?.addEventListener('click', () => {
    const modalQuiz = document.getElementById('quizNameModal');
    if (modalQuiz) modalQuiz.classList.remove('hidden');
});

// Süre butonları için animasyonlu seçim motoru
const timeBtns = document.querySelectorAll('.time-btn');
const customTimeContainer = document.getElementById('customTimeContainer');
const finalQuizTime = document.getElementById('finalQuizTime');
const customTimeInput = document.getElementById('quizTimeInput');

if (timeBtns) {
    timeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Tüm butonları gri yap
            timeBtns.forEach(b => {
                b.classList.remove('bg-red-500', 'text-white', 'border-red-500', 'shadow-md');
                b.classList.add('bg-gray-50', 'text-gray-500', 'border-gray-100');
            });
            // Tıklanan butonu Kırmızı (Aktif) yap
            btn.classList.remove('bg-gray-50', 'text-gray-500', 'border-gray-100');
            btn.classList.add('bg-red-500', 'text-white', 'border-red-500', 'shadow-md');

            const val = btn.getAttribute('data-time');
            if (val === 'custom') {
                if (customTimeContainer) customTimeContainer.classList.remove('hidden');
                if (customTimeInput) customTimeInput.focus(); // Klavyeyi otomatik aç
                if (finalQuizTime) finalQuizTime.value = 'custom';
            } else {
                if (customTimeContainer) customTimeContainer.classList.add('hidden');
                if (finalQuizTime) finalQuizTime.value = val;
            }
        });
    });
}

// Sınavı Kaydetme Butonu
const saveQuizTitleBtn = document.getElementById('saveQuizTitleBtn');
if (saveQuizTitleBtn) {
    saveQuizTitleBtn.addEventListener('click', async () => {
        const titleInput = document.getElementById('quizTitleInput');
        const title = titleInput ? titleInput.value : '';
        const timeLimitVal = document.getElementById('finalQuizTime') ? document.getElementById('finalQuizTime').value : '0';
        let timeLimit = 0;

        // Süreyi belirle (Özel seçildiyse kutudan al, yoksa buton değerini al)
        if (timeLimitVal === 'custom') {
            timeLimit = parseInt(document.getElementById('quizTimeInput').value) || 0;
        } else {
            timeLimit = parseInt(timeLimitVal) || 0;
        }

        if (!title) { showToast("Sınav ismini yazmayı unuttun!", "error"); return; }
        
        saveQuizTitleBtn.innerText = "⏳ Bekle...";

        const { data, error } = await supabaseClient.from('quizzes').insert([{ title, time_limit: timeLimit }]).select();
        
        if (error) {
            showToast("Hata!", "error");
        } else {
            showToast("Sınav oluşturuldu! Hadi soru ekleyelim.", "success");
            const modal = document.getElementById('quizNameModal');
            if (modal) modal.classList.add('hidden');
            if (titleInput) titleInput.value = '';
            if (customTimeInput) customTimeInput.value = '';
            fetchQuizzes(); 
            openQuestionEditor(data[0].id, data[0].title);
        }
        saveQuizTitleBtn.innerText = "Oluştur 🚀";
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
        listContainer.innerHTML = '<div class="text-center py-20 text-gray-300 font-bold italic">Henüz hiç soru eklenmemiş.</div>';
        return;
    }

    if(countDisplay) countDisplay.innerText = data.length;
    listContainer.innerHTML = '';

    data.forEach((q, index) => {
        listContainer.innerHTML += `
            <div class="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group hover:border-indigo-200 transition">
                <div class="flex items-start">
                    <span class="bg-indigo-100 text-indigo-600 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black mr-3 mt-1">${index + 1}</span>
                    <div class="flex-1">
                        <p class="text-sm font-black text-gray-800 leading-tight mb-3">${q.question_text}</p>
                        <div class="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase">
                            <span class="p-2 rounded-xl ${q.correct_option === 'A' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-400'}">A: ${q.option_a}</span>
                            <span class="p-2 rounded-xl ${q.correct_option === 'B' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-400'}">B: ${q.option_b}</span>
                            <span class="p-2 rounded-xl ${q.correct_option === 'C' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-400'}">C: ${q.option_c}</span>
                            <span class="p-2 rounded-xl ${q.correct_option === 'D' ? 'bg-green-100 text-green-700' : 'bg-gray-50 text-gray-400'}">D: ${q.option_d}</span>
                        </div>
                    </div>
                </div>
                <button onclick="deleteQuestion('${q.id}')" class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition text-red-300 hover:text-red-500 text-2xl font-black">&times;</button>
            </div>`;
    });
}

const questionFormEl = document.getElementById('newQuestionForm');
if (questionFormEl) {
    questionFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = questionFormEl.querySelector('button[type="submit"]');
        btn.innerText = "🚀 Soru Kaydediliyor...";

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
    const onay = await customConfirm("Kanka bu soruyu sileyim mi?");
    if (!onay) return;
    
    await supabaseClient.from('questions').delete().eq('id', id);
    showToast("Soru silindi.", "success");
    fetchQuestionsForQuiz(currentActiveQuizId);
};

async function fetchQuizzes() {
    const { data, error } = await supabaseClient.from('quizzes').select('*').order('created_at', { ascending: false });
    const container = document.getElementById('quizList');
    if (!container || error) return;

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="col-span-full bg-white p-20 rounded-[50px] text-center text-gray-400 font-bold italic border-2 border-dashed border-gray-100">Henüz hiç sınav hazırlamamışsın.</div>`;
        return;
    }

    container.innerHTML = '';
    data.forEach(quiz => {
        container.innerHTML += `
            <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-red-200 transition flex justify-between items-center group">
                <div class="flex-1 mr-4 overflow-hidden">
                    <h4 class="text-base font-black text-gray-800 group-hover:text-red-600 transition truncate">${quiz.title}</h4>
                    <p class="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest italic">Yayın Aktif</p>
                </div>
                <div class="flex space-x-2 shrink-0">
                    <button onclick="openQuestionEditor('${quiz.id}', '${quiz.title.replace(/'/g, "\\'")}')" class="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-xs font-black transition shadow-sm">YÖNET</button>
                    <button onclick="deleteQuiz('${quiz.id}')" class="bg-gray-50 text-gray-300 hover:text-red-500 p-2 rounded-xl transition text-lg">🗑️</button>
                </div>
            </div>`;
    });
}

window.deleteQuiz = async (id) => {
    const onay = await customConfirm("Bu sınavı ve içindeki TÜM soruları siliyorum, emin misin?");
    if (!onay) return;
    
    await supabaseClient.from('quizzes').delete().eq('id', id);
    showToast("Sınav tamamen silindi.", "success");
    fetchQuizzes();
};

// ==========================================
// 7. SONUÇLAR VE ÖĞRETMEN ANALİZ MOTORU
// ==========================================
let currentResultsData = {}; 

async function fetchResults() {
    const { data, error } = await supabaseClient
        .from('quiz_results')
        .select(`*, profiles ( full_name ), quizzes ( title )`)
        .order('created_at', { ascending: false });

    const tbody = document.getElementById('resultsList');
    if (!tbody || error) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-10 text-center text-gray-400 italic font-bold">Henüz hiç sınav çözen öğrenci yok.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    currentResultsData = {}; 

    data.forEach(res => {
        currentResultsData[res.id] = res;
        const dateObj = new Date(res.created_at);
        const date = dateObj.toLocaleDateString('tr-TR') + ' ' + dateObj.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
        
        let scoreColor = 'text-green-600 bg-green-50 border-green-100';
        if (res.score < 50) scoreColor = 'text-red-600 bg-red-50 border-red-100';
        else if (res.score < 80) scoreColor = 'text-yellow-600 bg-yellow-50 border-yellow-100';

        tbody.innerHTML += `
            <tr class="border-b border-gray-50 hover:bg-blue-50/30 transition text-sm">
                <td class="p-4 font-black text-gray-800">${res.profiles ? res.profiles.full_name : 'Bilinmeyen Öğrenci'}</td>
                <td class="p-4 text-gray-600 font-bold">${res.quizzes ? res.quizzes.title : 'Silinmiş Sınav'}</td>
                <td class="p-4 text-center"><span class="px-3 py-1 rounded-xl font-black text-xs uppercase tracking-wider border ${scoreColor}">${res.score} PUAN</span></td>
                <td class="p-4 text-gray-400 text-xs font-bold">${date}</td>
                <td class="p-4 text-right flex items-center justify-end space-x-2">
                    <button onclick="openTeacherAnalysis('${res.id}')" class="bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white px-4 py-2 rounded-xl text-xs font-black transition">GÖZ AT</button>
                    <button onclick="deleteResult('${res.id}')" class="text-gray-300 hover:text-red-500 p-2 rounded-xl text-xl transition" title="Sonucu Sil">🗑️</button>
                </td>
            </tr>`;
    });
}

window.deleteResult = async function(id) {
    const onay = await customConfirm("Bu öğrencinin sınav sonucunu kalıcı olarak siliyorum, emin misin?");
    if (!onay) return;
    
    const { error } = await supabaseClient.from('quiz_results').delete().eq('id', id);
    if (error) showToast("Silerken hata oldu: " + error.message, "error"); 
    else { showToast("Sonuç başarıyla silindi.", "success"); fetchResults(); }
};

window.openTeacherAnalysis = function(resultId) {
    const res = currentResultsData[resultId];
    if(!res) return;

    const taStud = document.getElementById('taStudentName');
    const taQuiz = document.getElementById('taQuizTitle');
    const taScore = document.getElementById('taScoreDisplay');
    const taCont = document.getElementById('taDetailsContainer');
    const taModal = document.getElementById('teacherAnalysisModal');

    if(taStud) taStud.innerText = res.profiles?.full_name || 'Bilinmeyen Öğrenci';
    if(taQuiz) taQuiz.innerText = res.quizzes?.title || 'Silinmiş Sınav';
    if(taScore) taScore.innerText = res.score;

    if(taCont) {
        taCont.innerHTML = '';
        const details = res.details || [];
        if(details.length === 0) {
            taCont.innerHTML = '<p class="text-center text-gray-400 font-bold mt-10">Bu sınav için detaylı analiz bulunmuyor. (Öğrenci eski sürümde çözmüş).</p>';
        } else {
            details.forEach(detail => {
                const boxStyle = detail.is_correct ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50';
                const iconInfo = detail.is_correct ? '✓' : '✗';
                taCont.innerHTML += `
                    <div class="p-6 rounded-[30px] border-2 mb-6 ${boxStyle} shadow-sm">
                        <div class="flex items-start gap-4 mb-4">
                            <span class="bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center font-black">${iconInfo}</span>
                            <h4 class="text-lg font-black text-gray-800 pt-1">${detail.q_no}. ${detail.q_text}</h4>
                        </div>
                        <div class="pl-12 text-sm font-bold text-gray-500">
                            Cevabı: ${detail.selected_opt} | Doğru: ${detail.correct_opt}
                        </div>
                    </div>`;
            });
        }
    }
    if(taModal) taModal.classList.remove('hidden');
}

window.closeTeacherAnalysisModal = function() {
    const taModal = document.getElementById('teacherAnalysisModal');
    if (taModal) taModal.classList.add('hidden');
}

// ==========================================
// 9. VIP ÖĞRENCİ PROFİLİ VE PDF KARNE MOTORU
// ==========================================
window.openStudentProfile = async function(id, name) {
    document.getElementById('profStudentId').value = id;
    document.getElementById('profileStudentName').innerText = name;
    document.getElementById('pdfStudentName').innerText = name;
    
    const today = new Date().toLocaleDateString('tr-TR');
    document.getElementById('pdfDate').innerText = today;
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
        
        // YENİ MUHASEBE VERİLERİ
        const lPrice = document.getElementById('lessonPrice').value;
        const lIsPaid = document.getElementById('lessonIsPaid').value === 'true';

        const { error } = await supabaseClient.from('private_lessons').insert([{
            student_id: studentId, lesson_date: lDate, lesson_time: lTime, duration_hours: lDuration, topic: lTopic,
            price: lPrice, is_paid: lIsPaid
        }]);

        if (error) showToast("Ders kaydedilemedi!", "error");
        else {
            showToast("Ders başarıyla profile işlendi.", "success");
            document.getElementById('lessonTopic').value = '';
            document.getElementById('lessonDuration').value = '';
            document.getElementById('lessonPrice').value = ''; // Kutuyu temizle
            fetchStudentLessons(studentId);
        }
    });
}


let profileChartInstance = null;
let pdfChartInstance = null;

async function fetchStudentLessons(studentId) {
    // 1. DERSLERİ ÇEK
    const { data: lessons } = await supabaseClient.from('private_lessons').select('*').eq('student_id', studentId).order('lesson_date', { ascending: false });
    
    const list = document.getElementById('lessonList');
    const pdfList = document.getElementById('pdfLessonList');
    if(!list || !pdfList) return;
    
    list.innerHTML = ''; pdfList.innerHTML = '';

    if (!lessons || lessons.length === 0) {
        list.innerHTML = '<p class="text-gray-400 text-sm italic p-4 text-center">Henüz seans kaydı girilmemiş.</p>';
        pdfList.innerHTML = '<p class="text-gray-500 italic">Bu dönem kayıtlı seans bulunmamaktadır.</p>';
        } else {
        let totalUnpaid = 0; // Toplam Borç Sayacı

        lessons.forEach(l => {
            const date = new Date(l.lesson_date).toLocaleDateString('tr-TR');
            const time = l.lesson_time ? l.lesson_time : '';
            const duration = l.duration_hours ? `${l.duration_hours} Saat` : '';
            
            // BORÇ HESABI
            if (!l.is_paid) totalUnpaid += Number(l.price || 0);

            // Ödeme rozeti ve butonu
            const payBadge = l.is_paid 
                ? `<span class="text-[10px] font-black bg-green-50 border border-green-200 text-green-700 px-2 py-1 rounded-md">🟢 ÖDENDİ</span>`
                : `<button onclick="markAsPaid('${l.id}', '${studentId}')" class="text-[10px] font-black bg-red-50 hover:bg-red-500 hover:text-white border border-red-200 text-red-600 px-2 py-1 rounded-md transition shadow-sm">🔴 ÖDENMEDİ (Tahsil Et)</button>`;

            const priceText = l.price ? `<span class="text-[10px] font-black bg-slate-100 border border-slate-200 text-slate-700 px-2 py-1 rounded-md">₺${l.price}</span>` : '';

            // Ekranda Görünen Havalı Kart Tasarımı
            list.innerHTML += `
                <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col hover:border-indigo-200 transition">
                    <div class="flex justify-between items-start">
                        <div class="flex flex-wrap gap-2 mb-2">
                            <span class="text-[10px] font-black bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-1 rounded-md">📅 ${date}</span>
                            ${time ? `<span class="text-[10px] font-black bg-purple-50 border border-purple-100 text-purple-700 px-2 py-1 rounded-md">⏰ ${time}</span>` : ''}
                            ${duration ? `<span class="text-[10px] font-black bg-orange-50 border border-orange-100 text-orange-700 px-2 py-1 rounded-md">⏳ ${duration}</span>` : ''}
                            ${priceText}
                        </div>
                        <button onclick="deleteLesson('${l.id}')" class="text-gray-300 hover:text-red-500 transition text-xl leading-none ml-3" title="Kaydı Sil">&times;</button>
                    </div>
                    <p class="text-sm font-bold text-gray-700 mt-1 leading-snug">${l.topic}</p>
                    <div class="mt-3 border-t border-gray-50 pt-2 flex justify-between items-center">
                        ${payBadge}
                    </div>
                </div>`;
            
            // PDF İçindeki Profesyonel Rapor Tasarımı (Ödeme durumu PDF'e gitmez, şık dursun)
            pdfList.innerHTML += `
                <div class="mb-4 border-b border-gray-100 pb-3">
                    <p class="text-xs font-black text-indigo-600 tracking-wider">${date} ${time ? `| Saat: ${time}` : ''} ${duration ? `| Süre: ${duration}` : ''}</p>
                    <p class="text-sm font-bold text-gray-800 mt-1">${l.topic}</p>
                </div>`;
        });

        // Toplam Borcu Ekrana Bas
        const badgeEl = document.getElementById('unpaidTotalBadge');
        if (totalUnpaid > 0) {
            badgeEl.innerText = `Bekleyen: ₺${totalUnpaid}`;
            badgeEl.classList.remove('hidden');
        } else {
            badgeEl.classList.add('hidden');
        }
    }


    // 2. SINAVLARI ÇEK VE GRAFİĞİ ÇİZ
    const { data: results } = await supabaseClient.from('quiz_results').select('score, quizzes(title)').eq('student_id', studentId).order('created_at', { ascending: true });
    
    const pdfQuizList = document.getElementById('pdfQuizList');
    if(pdfQuizList) pdfQuizList.innerHTML = '';

    let labels = [];
    let scores = [];

    if (!results || results.length === 0) {
        if(pdfQuizList) pdfQuizList.innerHTML = '<p class="text-gray-500 italic">Öğrenci henüz sınava girmemiştir.</p>';
        labels = ['Sınav Yok'];
        scores = [0];
    } else {
        results.forEach(r => {
            labels.push(r.quizzes.title);
            scores.push(r.score);
            
            let color = r.score >= 80 ? 'text-green-600' : (r.score >= 50 ? 'text-yellow-600' : 'text-red-600');
            if(pdfQuizList) {
                pdfQuizList.innerHTML = `
                    <div class="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                        <span class="text-sm font-bold text-gray-700">${r.quizzes.title}</span>
                        <span class="text-sm font-black ${color}">${r.score} Puan</span>
                    </div>` + pdfQuizList.innerHTML; 
            }
        });
    }

    const chartConfig = (isPdf) => ({
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sınav Puanı',
                data: scores,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#4f46e5',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: isPdf ? false : { duration: 1000 },
            scales: {
                y: { beginAtZero: true, max: 100, ticks: { stepSize: 20, font: { weight: 'bold' } }, grid: { borderDash: [5, 5] } },
                x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } }
            },
            plugins: { legend: { display: false } }
        }
    });

    if(profileChartInstance) profileChartInstance.destroy();
    if(pdfChartInstance) pdfChartInstance.destroy();

    const ctxProf = document.getElementById('profileChart');
    const ctxPdf = document.getElementById('pdfChart');
    
    if(ctxProf) profileChartInstance = new Chart(ctxProf.getContext('2d'), chartConfig(false));
    if(ctxPdf) pdfChartInstance = new Chart(ctxPdf.getContext('2d'), chartConfig(true));
}

window.deleteLesson = async function(id) {
    const onay = await customConfirm("Ders kaydını silmek istediğine emin misin?");
    if (!onay) return;
    await supabaseClient.from('private_lessons').delete().eq('id', id);
    fetchStudentLessons(document.getElementById('profStudentId').value);
}

// TEK TIKLA TAHSİLAT YAPMA MOTORU
window.markAsPaid = async function(lessonId, studentId) {
    showToast("Tahsilat işleniyor...", "info");
    const { error } = await supabaseClient.from('private_lessons').update({ is_paid: true }).eq('id', lessonId);
    
    if(error) {
        showToast("Hata oluştu: " + error.message, "error");
    } else {
        showToast("💵 Para kasaya girdi, ders ödendi olarak işaretlendi!", "success");
        fetchStudentLessons(studentId); // Listeyi tazeleyip borcu düşürür
    }
}



// SİHİRLİ PDF OLUŞTURMA BUTONU
window.generatePDF = function() {
    showToast("PDF hazırlanıyor, lütfen bekleyin...", "info");
    const element = document.getElementById('pdfTemplate');
    const sName = document.getElementById('profileStudentName').innerText;
    
    const opt = {
      margin:       0,
      filename:     `${sName}_Gelisim_Raporu.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    element.parentElement.classList.remove('hidden'); 
    html2pdf().set(opt).from(element).save().then(() => {
        element.parentElement.classList.add('hidden'); 
        showToast("PDF Başarıyla İndirildi!", "success");
    });
}

// SİHİRLİ VELİ LİNKİ KOPYALAMA MOTORU
window.copyParentLink = function() {
    const studentId = document.getElementById('profStudentId').value;
    // Sitenin mevcut adresinin sonuna veli.html ve öğrenci ID'sini ekler
    const currentUrl = window.location.href.split('/').slice(0, -1).join('/'); 
    const link = `${currentUrl}/veli.html?id=${studentId}`;
    
    navigator.clipboard.writeText(link).then(() => {
        showToast("🪄 Sihirli Link kopyalandı! WhatsApp'tan veliye yapıştır.", "success");
    }).catch(err => {
        showToast("Kopyalanamadı, yetki yok.", "error");
    });
}

// BAŞLANGIÇ ÇALIŞTIRMALARI
switchTab('dashboard');

// ==========================================
// 10. DİNAMİK KARŞILAMA MESAJI MOTORU (30 ADET)
// ==========================================
function setDynamicMotivations() {
    // Gülbahar Hoca'ya özel hazırlanmış 30 farklı motivasyon mesajı
    const welcomeMsgs = [
        "Bugün yeni başarı hikayeleri yazmak ve geleceği şekillendirmek için harika bir gün. İyi çalışmalar dileriz!",
        "Öğrencilerinizin hayatında bıraktığınız iz, geleceği aydınlatıyor. Harika bir ders günü olsun!",
        "Bilgi paylaştıkça çoğalır. Bugünün size ve öğrencilerinize yeni ilhamlar getirmesini dileriz.",
        "Her yeni gün, bir öğrencinin hayatına dokunmak için yepyeni bir fırsattır. Kolay gelsin!",
        "Sizin rehberliğinizde büyüyen zihinler, yarının umudu. Keyifli ve verimli bir gün geçirmeniz dileğiyle!",
        "İngilizce bir dil değil, dünyaya açılan bir kapıdır. O kapının en iyi anahtarı sizsiniz!",
        "Masanızdaki her not, bir öğrencinin hayallerine giden bir basamak. Emeklerinize sağlık!",
        "Yorgun hissettiğinizde, dokunduğunuz o parlak gelecekleri hatırlayın. Harika bir gün olsun!",
        "Sadece bir dil değil, bir vizyon öğretiyorsunuz. Enerjinizin hiç bitmeyeceği bir gün dileriz.",
        "Gülümsemeniz sınıfın en iyi motivasyonudur. Bugün de harikalar yaratacağınıza eminiz!",
        "Geleceğin dünya vatandaşlarını yetiştiriyorsunuz. Bu muazzam yolculukta kolaylıklar dileriz.",
        "Bir öğretmenin sabrı, bir öğrencinin en büyük şansıdır. İyi ki varsınız, harika dersler!",
        "Bugün ektiğiniz bilgi tohumları, yarın devasa çınarlara dönüşecek. İyi çalışmalar!",
        "Öğrencilerinizin 'Anladım!' dediği o anki gözlerindeki ışıltı her şeye değer. Harika bir seans olsun!",
        "VIP eğitim kalitesini her gün zirveye taşıyorsunuz. Sisteminiz sizin için hazır, kolay gelsin!",
        "Eğitimdeki titizliğiniz, öğrencilerinizin en büyük ayrıcalığı. İlham verici bir gün dileriz!",
        "Siz anlattıkça sadece İngilizce değil, özgüven de öğreniyorlar. Başarılarla dolu bir gün olsun!",
        "Bugün bir kelime, yarın koca bir hayatı değiştirebilir. Mucizeler yarattığınız bir gün dileriz.",
        "Öğretmek bir sanattır, siz de bu sanatın en büyük ustalarındansınız. Enerji dolu dersler!",
        "Sizinle geçen her ders, öğrencileriniz için yeni bir ufuk demek. Sisteme hoş geldiniz!",
        "Bugün de sınırları aşmaya, yeni ufuklar keşfettirmeye hazır mısınız? Başarılar dileriz!",
        "İngilizceyi bir ders olmaktan çıkarıp tutkuya dönüştüren öğretmene selam olsun!",
        "Disiplininiz ve sevginiz, öğrencilerinizin en sağlam rehberi. Keyifli bir iş günü olsun!",
        "Her seansınız, bir öğrencinin kendi potansiyelini keşfetme yolculuğudur. Harika dersler!",
        "Fark yaratmak sizin doğanızda var. Bugün de VIP eğitimde farkınızı göstereceğiniz bir gün olsun!",
        "Dünyayı değiştirmek, bir sınıfa girmekle başlar. Bugünün tüm güzellikleri sizinle olsun!",
        "Bilginizi aktarırken gösterdiğiniz zarafet, eğitim kalitenizin en büyük kanıtı. Kolay gelsin!",
        "Sizin öğrenciniz olmak büyük bir şans. Verimli ve bol gülümsemeli bir gün dileriz!",
        "Bugün yüzünüzdeki gülümseme ve enerjiniz, yeni başarılara ilham olacak. Sisteme hoş geldiniz!",
        "Sadece ders anlatmıyor, hayallere dokunuyorsunuz. Emeklerinizin karşılığını fazlasıyla alacağınız bir gün olsun!"
    ];

    // Havuzdan rastgele mesaj seç
    const randomMsg = welcomeMsgs[Math.floor(Math.random() * welcomeMsgs.length)];
    const msgEl = document.getElementById('dynamicWelcomeMsg');

    // Ekrana yazdır
    if(msgEl) msgEl.innerText = randomMsg;
}

// Sayfa her açıldığında/yenilendiğinde motoru çalıştır
setDynamicMotivations();
