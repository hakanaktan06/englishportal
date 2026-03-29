const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // CORS ayarları (Frontend'den gelen isteklere izin ver)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST istekleri kabul edilir.' });
  }

  const { targetUserId, newPassword } = req.body;

  if (!targetUserId || !newPassword) {
    return res.status(400).json({ error: 'Kullanıcı ID veya yeni şifre eksik.' });
  }

  // Supabase bağlantısı (Service Role Key kullanılarak admin yetkisi alınır)
  const supabaseUrl = process.env.SUPABASE_URL || 'https://vucpxabicxqfmmmqvkpv.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    return res.status(500).json({ error: 'Sunucu hatası: SUPABASE_SERVICE_ROLE_KEY tanımlı değil.' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Admin API ile şifreyi güncelle
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    );

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Şifre başarıyla güncellendi.' });
  } catch (err) {
    return res.status(500).json({ error: 'Bilinmeyen bir hata oluştu: ' + err.message });
  }
};

