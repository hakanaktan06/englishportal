// ==========================================
// 1. SUPABASE BAĞLANTISI
// ==========================================
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1Y3B4YWJpY3hxZm1tbXF2a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDIwMDYsImV4cCI6MjA4ODkxODAwNn0.wYXmIDO4H7ml8nC9pQzRmW8tPK_ihtqFy3r4SqN3cTk';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// GÖRSEL GEÇİŞLER (LOGIN <-> REGISTER)
// ==========================================
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');

document.getElementById('showRegisterBtn').addEventListener('click', () => {
    loginSection.classList.add('-translate-x-full', 'opacity-0');
    setTimeout(() => {
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
        setTimeout(() => {
            registerSection.classList.remove('translate-x-full', 'opacity-0');
            registerSection.classList.add('translate-x-0', 'opacity-100');
        }, 50);
    }, 500);
});

document.getElementById('showLoginBtn').addEventListener('click', () => {
    registerSection.classList.remove('translate-x-0', 'opacity-100');
    registerSection.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        setTimeout(() => {
            loginSection.classList.remove('-translate-x-full', 'opacity-0');
            loginSection.classList.add('translate-x-0', 'opacity-100');
        }, 50);
    }, 500);
});

// ==========================================
// 2. GİRİŞ (LOGIN) MOTORU
// ==========================================
const loginForm = document.getElementById('loginForm');
const errorBox = document.getElementById('errorBox');
const loginBtn = document.getElementById('loginBtn');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    errorBox.classList.add('hidden');
    
    const originalBtnText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    loginBtn.disabled = true;

    const rawInput = document.getElementById('loginInput').value.trim();
    const password = document.getElementById('passwordInput').value;

    let finalEmail = rawInput;
    if (!rawInput.includes('@')) {
        finalEmail = rawInput.replace(/\s+/g, '').toLowerCase() + '@englishportal.com';
    }

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: finalEmail,
        password: password
    });

    if (authError) {
        showError(errorBox, "KULLANICI ADI VEYA ŞİFRE HATALI!");
        resetButton(loginBtn, originalBtnText);
        return;
    }

    const userId = authData.user.id;
    const { data: profileData, error: profileError } = await supabaseClient.from('profiles').select('role').eq('id', userId).single();

    if (profileError || !profileData) {
        showError(errorBox, "Profil bulunamadı!");
        resetButton(loginBtn, originalBtnText);
        return;
    }

    if (profileData.role === 'teacher') window.location.href = 'panel.html';
    else if (profileData.role === 'student') window.location.href = 'student.html';
    else if (profileData.role === 'god') window.location.href = 'patron.html'; // PATRON PANELİ GİRİŞİ HAZIRLIĞI
    else {
        showError(errorBox, "Yetkiniz belirsiz.");
        resetButton(loginBtn, originalBtnText);
    }
});

// ==========================================
// 3. ÖĞRETMEN KAYIT (REGISTER) MOTORU
// ==========================================
const registerForm = document.getElementById('registerForm');
const regErrorBox = document.getElementById('regErrorBox');
const regBtn = document.getElementById('regBtn');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    regErrorBox.classList.add('hidden');
    
    const originalBtnText = regBtn.innerHTML;
    regBtn.innerHTML = '<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    regBtn.disabled = true;

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;

    // 1. Supabase Auth'a Kayıt
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
        email: email,
        password: password
    });

    if (authError) {
        showError(regErrorBox, authError.message.includes('already registered') ? "Bu e-posta zaten kayıtlı!" : "Kayıt olurken bir hata oluştu.");
        resetButton(regBtn, originalBtnText);
        return;
    }

    if (authData.user) {
        // 2. Profiles tablosuna 'teacher' olarak ve limitsiz premium 'false' olarak ekle
        const { error: profileError } = await supabaseClient.from('profiles').insert([{ 
            id: authData.user.id, 
            full_name: name, 
            role: 'teacher',
            is_premium: false // Varsayılan olarak Freemium hesap
        }]);
        
        if (profileError) {
            showError(regErrorBox, "Profil oluşturulamadı.");
            resetButton(regBtn, originalBtnText);
        } else {
            // Kayıt başarılıysa direkt panele at
            window.location.href = 'panel.html';
        }
    }
});

// ==========================================
// YARDIMCI FONKSİYONLAR
// ==========================================
function showError(boxElement, message) {
    boxElement.innerHTML = `<svg class="w-4 h-4 mr-1.5 inline-block -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> ${message}`;
    boxElement.classList.remove('hidden');
}

function resetButton(btnElement, originalText) {
    btnElement.innerHTML = originalText;
    btnElement.disabled = false;
}

// ŞİFRE GÖSTER/GİZLE MOTORU
document.getElementById('togglePasswordBtn')?.addEventListener('click', () => {
    const pwd = document.getElementById('passwordInput');
    const type = pwd.getAttribute('type') === 'password' ? 'text' : 'password';
    pwd.setAttribute('type', type);
});

// ==========================================
// OTOMATİK OTURUM KONTROLÜ
// ==========================================
async function checkActiveSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile && profile.role === 'teacher') window.location.href = 'panel.html';
        else if (profile && profile.role === 'student') window.location.href = 'student.html';
        else if (profile && profile.role === 'god') window.location.href = 'patron.html';
    }
}
checkActiveSession();
