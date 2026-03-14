// ==========================================
// 1. SUPABASE BAĞLANTISI
// ==========================================
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// 2. GİRİŞ (LOGIN) MOTORU
// ==========================================
const loginForm = document.getElementById('loginForm');
const errorBox = document.getElementById('errorBox');
const loginBtn = document.getElementById('loginBtn');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Sayfanın yenilenmesini durdur

    // Hata kutusunu gizle ve butonu "Yükleniyor" moduna al
    errorBox.classList.add('hidden');
    const originalBtnText = loginBtn.innerHTML;
    loginBtn.innerHTML = '⏳ Giriş Yapılıyor...';
    loginBtn.disabled = true;

    // Kullanıcının girdiği bilgileri al
    const rawInput = document.getElementById('loginInput').value.trim();
    const password = document.getElementById('passwordInput').value;

    let finalEmail = rawInput;

    // 🪄 SİHİRLİ DOKUNUŞ: Eğer yazılan şeyde "@" işareti YOKSA, bu bir öğrencidir. Hayalet domaini ekle!
    if (!rawInput.includes('@')) {
        finalEmail = rawInput.replace(/\s+/g, '').toLowerCase() + '@englishportal.com';
    }

    // 1. ADIM: Supabase Auth ile Giriş Denemesi
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: finalEmail,
        password: password
    });

    // Eğer şifre yanlışsa veya hesap yoksa
    if (authError) {
        showError("Kullanıcı adı veya şifre hatalı kanka. Tekrar dene!");
        resetButton(originalBtnText);
        return;
    }

    // 2. ADIM: Başarılı girişten sonra kullanıcının Rolünü bul
    const userId = authData.user.id;
    
    const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (profileError || !profileData) {
        showError("Kullanıcı profili bulunamadı! Yöneticinize başvurun.");
        resetButton(originalBtnText);
        return;
    }

    // 3. ADIM: Akıllı Yönlendirme (Bouncer)
    const userRole = profileData.role;

    if (userRole === 'teacher') {
        window.location.href = 'panel.html';
    } else if (userRole === 'student') {
        window.location.href = 'student.html';
    } else {
        showError("Kanka senin yetkin belli değil sistemde.");
        resetButton(originalBtnText);
    }
});

// ==========================================
// YARDIMCI FONKSİYONLAR
// ==========================================
function showError(message) {
    errorBox.innerText = message;
    errorBox.classList.remove('hidden');
}

function resetButton(originalText) {
    loginBtn.innerHTML = originalText;
    loginBtn.disabled = false;
}

// ŞİFRE GÖSTER/GİZLE MOTORU
document.getElementById('togglePasswordBtn')?.addEventListener('click', () => {
    const pwd = document.getElementById('passwordInput');
    const type = pwd.getAttribute('type') === 'password' ? 'text' : 'password';
    pwd.setAttribute('type', type);
});

// ==========================================
// OTOMATİK OTURUM KONTROLÜ (Zaten giriş yapmışsa bir daha sorma)
// ==========================================
async function checkActiveSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile && profile.role === 'teacher') window.location.href = 'panel.html';
        else if (profile && profile.role === 'student') window.location.href = 'student.html';
    }
}
checkActiveSession();
