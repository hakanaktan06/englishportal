// Supabase Bağlantı Ayarları (Depomuzun adresi)
const supabaseUrl = 'https://vucpxabicxqfmmmqvkpv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // KANTA NOT: Buraya o kopyaladığın uzun şifreyi yapıştır!

// Motoru çalıştır
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// "Giriş Yap" butonuna basıldığında ne olacak?
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Sayfanın saçma sapan yenilenmesini durdurur

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Şimdilik sadece çalıştığını görmek için uyarı verelim
    alert("Vizyon test edildi kanka! \nE-posta: " + email + "\n3 dosyalı sistem tıkır tıkır çalışıyor.");
    
    // Bir sonraki adımda buraya "gerçekten giriş yap" kodunu ekleyeceğiz.
});