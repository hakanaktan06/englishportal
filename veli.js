// 1. SUPABASE BAĞLANTISI (Aynı Anahtar)
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let globalTeacherIban = '';
let globalTeacherReceiver = '';
let globalStudentName = '';

// ==========================================
// 🛡️ GÜVENLİK: XSS KORUMA MOTORU (ÇELİK YELEK)
// ==========================================
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, function (tag) {
        const charsToReplace = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
        return charsToReplace[tag] || tag;
    });
}

// URL'den ID'yi al
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('id');

// Theme Initialization
let themeIconDark, themeIconLight;

document.addEventListener('DOMContentLoaded', () => {
    themeIconDark = document.getElementById('themeIconDark');
    themeIconLight = document.getElementById('themeIconLight');

    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        if(themeIconDark) themeIconDark.classList.remove('hidden');
        if(themeIconLight) themeIconLight.classList.add('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        if(themeIconLight) themeIconLight.classList.remove('hidden');
        if(themeIconDark) themeIconDark.classList.add('hidden');
    }
});

let veliChartInstance = null;

window.toggleTheme = function() {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        if(themeIconLight) themeIconLight.classList.remove('hidden');
        if(themeIconDark) themeIconDark.classList.add('hidden');
        updateChartTheme(false);
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        if(themeIconDark) themeIconDark.classList.remove('hidden');
        if(themeIconLight) themeIconLight.classList.add('hidden');
        updateChartTheme(true);
    }
}

function updateChartTheme(isDark) {
    if(!veliChartInstance) return;
    const textColor = isDark ? '#9ca3af' : '#4b5563'; // gray-400 / gray-600
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    
    veliChartInstance.options.scales.x.ticks.color = textColor;
    veliChartInstance.options.scales.x.grid.color = gridColor;
    veliChartInstance.options.scales.y.ticks.color = textColor;
    veliChartInstance.options.scales.y.grid.color = gridColor;
    veliChartInstance.update();
}

async function loadVeliPortal() {
    if (!studentId) { showError(); return; }

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) { window.location.href = 'index.html'; return; }

    const { data: currentUserProfile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
    if (currentUserProfile && currentUserProfile.role === 'teacher') {
        window.location.href = 'panel.html';
        return;
    } else if (currentUserProfile && currentUserProfile.role === 'god') {
        window.location.href = 'patron.html';
        return;
    }

    // 1. Öğrenci Adını ve Öğretmen Bilgisini Çek
    const { data: student, error: studErr } = await supabaseClient.from('profiles').select('full_name, teacher_id').eq('id', studentId).single();
    if (studErr || !student) { showError(); return; }
    
    globalStudentName = student.full_name;
    document.getElementById('veliStudentName').innerText = globalStudentName;

    if (student.teacher_id) {
        const { data: teacher } = await supabaseClient.from('profiles').select('bank_iban, bank_receiver').eq('id', student.teacher_id).single();
        if (teacher) {
            globalTeacherIban = teacher.bank_iban || '';
            globalTeacherReceiver = teacher.bank_receiver || '';
            document.getElementById('displayIbanText').innerText = globalTeacherIban || 'Öğretmen IBAN girmemiş.';
            document.getElementById('displayReceiverText').innerText = globalTeacherReceiver || 'Öğretmen isim girmemiş.';
        }
    }

    // 2. Dersleri Çek ve Borcu Hesapla
    const { data: lessons } = await supabaseClient.from('private_lessons').select('*').eq('student_id', studentId).order('lesson_date', { ascending: false });
    const listEl = document.getElementById('veliLessonList');

    if (!lessons || lessons.length === 0) {
        listEl.innerHTML = '<p class="text-gray-400 italic">Henüz işlenmiş bir özel ders kaydı bulunmuyor.</p>';
    } else {
        let totalDebt = 0;
        let futureLessons = [];
        const now = new Date();

        lessons.forEach(l => {
            const lessonDate = new Date(`${l.lesson_date}T${l.lesson_time || '00:00'}:00`);
            
            // Gelecek dersleri ayır
            if (lessonDate > now) {
                futureLessons.push({ ...l, dateObj: lessonDate });
                return; // Listeye ekleme (isteğe bağlı, ama genelde "İşlenen Dersler" geçmişi gösterir)
            }

            const date = lessonDate.toLocaleDateString('tr-TR');
            const time = l.lesson_time ? ` | ⏰ ${l.lesson_time}` : '';
            const duration = l.duration_hours ? ` | ⏳ ${l.duration_hours} Saat` : '';

            if (!l.is_paid) totalDebt += Number(l.price || 0);

            listEl.innerHTML += `
                <div class="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <p class="text-[11px] font-black text-indigo-500 dark:text-indigo-400 tracking-wider">📅 ${date} ${time} ${duration}</p>
                        <p class="text-sm font-bold text-gray-800 dark:text-gray-100 mt-1">${escapeHTML(l.topic)}</p>
                    </div>
                    ${l.price ? `<span class="text-xs font-black ${l.is_paid ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30' : 'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900/30'} px-3 py-1.5 rounded-lg whitespace-nowrap">${l.price} TL - ${l.is_paid ? 'ÖDENDİ' : 'ÖDENMEDİ'}</span>` : ''}
                </div>`;
        });

        // Geri Sayım Motorunu Başlat
        if (futureLessons.length > 0) {
            // En yakın gelecek dersi bul (zaten lesson_date DESC olduğu için en sonu veya sort etmek daha güvenli)
            futureLessons.sort((a, b) => a.dateObj - b.dateObj);
            startNextLessonCountdown(futureLessons[0]);
        }

        if (totalDebt > 0) {
            document.getElementById('veliDebtText').innerText = totalDebt + " TL";
            document.getElementById('veliDebtBadge').classList.remove('hidden', 'display-none');
            document.getElementById('veliDebtBadge').style.display = 'inline-flex';
        }
    }

    // 3. Sınavları Çek ve Grafiği Çiz
    const { data: results } = await supabaseClient.from('quiz_results').select('score, quizzes(title)').eq('student_id', studentId).order('created_at', { ascending: true });
    let labels = []; let scores = [];

    if (!results || results.length === 0) {
        labels = ['Sınav Yok']; scores = [0];
    } else {
        results.forEach(r => { labels.push(r.quizzes.title); scores.push(r.score); });
    }

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    veliChartInstance = new Chart(document.getElementById('veliChart').getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Puan',
                data: scores,
                borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)',
                borderWidth: 3, tension: 0.4, fill: true,
                pointBackgroundColor: '#fff', pointBorderColor: '#4f46e5',
                pointBorderWidth: 2, pointRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { 
                y: { 
                    beginAtZero: true, 
                    max: 100,
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Perdeyi Kaldır
    document.getElementById('loadingScreen').classList.add('opacity-0');
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    }, 500);
}

// 4. GERİ SAYIM VE DİĞER MODÜLLER
function startNextLessonCountdown(lesson) {
    const widget = document.getElementById('nextLessonWidget');
    const titleEl = document.getElementById('nextLessonTitle');
    const countdownEl = document.getElementById('nextLessonCountdown');
    const dateEl = document.getElementById('nextLessonDate');

    if (!widget) return;

    widget.classList.remove('hidden');
    titleEl.innerText = lesson.topic || "Özel Ders";
    dateEl.innerText = new Date(lesson.dateObj).toLocaleString('tr-TR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });

    const timer = setInterval(() => {
        const now = new Date().getTime();
        const dist = lesson.dateObj.getTime() - now;

        if (dist < 0) {
            clearInterval(timer);
            countdownEl.innerText = "DERS BAŞLADI / GEÇTİ";
            return;
        }

        const days = Math.floor(dist / (1000 * 60 * 60 * 24));
        const hours = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((dist % (1000 * 60)) / 1000);

        let countdownStr = "";
        if (days > 0) countdownStr += `${days}g `;
        countdownStr += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        countdownEl.innerText = countdownStr;
    }, 1000);
}

window.showIbanModal = function() {
    const modal = document.getElementById('ibanModal');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.remove('opacity-0'), 10);
};

window.hideIbanModal = function() {
    const modal = document.getElementById('ibanModal');
    modal.classList.add('opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
};

window.copyIban = function() {
    if (!globalTeacherIban) {
        showVeliToast("❌ Kopyalanacak IBAN bulunamadı.", "error");
        return;
    }
    navigator.clipboard.writeText(globalTeacherIban).then(() => {
        showVeliToast("Bilgi: IBAN başarıyla kopyalandı.", "success");
        const btn = event.currentTarget;
        const originalHtml = btn.innerHTML;
        btn.innerHTML = "KOPYALANDI";
        btn.classList.replace('bg-indigo-600', 'bg-emerald-600');
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.replace('bg-emerald-600', 'bg-indigo-600');
        }, 2000);
    });
};

function showVeliToast(message, type = "success") {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColor = type === "success" ? "bg-emerald-600" : "bg-rose-600";
    
    toast.className = `${bgColor} text-white px-6 py-3 rounded-2xl shadow-2xl font-black text-sm flex items-center gap-3 transform transition-all duration-500 translate-y-10 opacity-0`;
    toast.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${type === 'success' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}"></path>
        </svg>
        ${escapeHTML(message)}
    `;

    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

window.downloadPDFReport = function() {
    const element = document.getElementById('reportContent');
    const opt = {
        margin: 1,
        filename: `${globalStudentName}_Gelisim_Raporu.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };

    // Geçici olarak dark moddan çıkarıp temiz görüntü alalım (opsiyonel ama daha iyi sonuç verir)
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) document.documentElement.classList.remove('dark');

    // PDF Üret
    html2pdf().set(opt).from(element).save().then(() => {
        if (isDark) document.documentElement.classList.add('dark');
    });
};

function showError() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('errorScreen').classList.remove('hidden');
}

loadVeliPortal();
