// 1. SUPABASE BAĞLANTISI (Aynı Anahtar)
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// URL'den ID'yi al
const urlParams = new URLSearchParams(window.location.search);
const studentId = urlParams.get('id');

async function loadVeliPortal() {
    if (!studentId) { showError(); return; }

    // 1. Öğrenci Adını Çek
    const { data: profile, error: profErr } = await supabaseClient.from('profiles').select('full_name').eq('id', studentId).single();
    if (profErr || !profile) { showError(); return; }
    document.getElementById('veliStudentName').innerText = profile.full_name;

    // 2. Dersleri Çek ve Borcu Hesapla
    const { data: lessons } = await supabaseClient.from('private_lessons').select('*').eq('student_id', studentId).order('lesson_date', { ascending: false });
    const listEl = document.getElementById('veliLessonList');

    if (!lessons || lessons.length === 0) {
        listEl.innerHTML = '<p class="text-gray-400 italic">Henüz işlenmiş bir özel ders kaydı bulunmuyor.</p>';
    } else {
        let totalDebt = 0;
        lessons.forEach(l => {
            const date = new Date(l.lesson_date).toLocaleDateString('tr-TR');
            const time = l.lesson_time ? | ⏰ ${ l.lesson_time }: '';
            const duration = l.duration_hours ? | ⏳ ${ l.duration_hours } Saat: '';

            if (!l.is_paid) totalDebt += Number(l.price || 0);

            listEl.innerHTML += `
                <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                        <p class="text-[11px] font-black text-indigo-500 tracking-wider">📅 ${date} ${time} ${duration}</p>
                        <p class="text-sm font-bold text-gray-800 mt-1">${l.topic}</p>
                    </div>
                    ${l.price ? <span class="text-xs font-black ${l.is_paid ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'} px-3 py-1.5 rounded-lg whitespace-nowrap">${l.price} TL - ${l.is_paid ? 'ÖDENDİ' : 'ÖDENMEDİ'}</span> : ''}
                </div>`;
        });

        if (totalDebt > 0) {
            document.getElementById('veliDebtText').innerText = totalDebt + " TL";
            document.getElementById('veliDebtBadge').classList.remove('hidden');
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

    new Chart(document.getElementById('veliChart').getContext('2d'), {
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
            scales: { y: { beginAtZero: true, max: 100 } },
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

function showError() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('errorScreen').classList.remove('hidden');
}

loadVeliPortal();
