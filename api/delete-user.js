const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // CORS ayarları
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sadece POST kabul edilir.' });

  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'targetUserId eksik.' });

  const supabaseUrl = process.env.SUPABASE_URL || 'https://vucpxabicxqfmmmqvkpv.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY tanımlı değil.' });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    console.log(`DEEP WIPE START: User ${targetUserId}`);

    // OKL: Önce bu kullanıcının rolünü kontrol edelim (Kurum mu yoksa Öğretmen mi?)
    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', targetUserId).single();

    // 1. EĞER KURUM İSE: BAĞLI ÖĞRETMENLERİ BOŞA ÇIKAR
    if (profile && profile.role === 'kurum') {
      await supabaseAdmin.from('profiles').update({ school_id: null }).eq('school_id', targetUserId);
    }

    // 2. EĞER ÖĞRETMEN İSE: ÖĞRENCİLERİ VE VERİLERİNİ TEMİZLE
    const { data: students } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('teacher_id', targetUserId)
      .eq('role', 'student');

    if (students && students.length > 0) {
      const studentIds = students.map(s => s.id);
      
      // Öğrencilere ait her şeyi temizle
      await supabaseAdmin.from('audit_logs').delete().in('user_id', studentIds);
      await supabaseAdmin.from('profiles').delete().in('id', studentIds);
      
      // Öğrencilerin AUTH hesaplarını sil (Nuclear Option)
      for (const sId of studentIds) {
        await supabaseAdmin.auth.admin.deleteUser(sId);
      }
    }

    // 3. İLİŞKİLİ VERİLERİ (Sınavlar, Sorular, Ödevler vb.) TEMİZLE
    const { data: quizzes } = await supabaseAdmin.from('quizzes').select('id').eq('teacher_id', targetUserId);
    if (quizzes && quizzes.length > 0) {
      const quizIds = quizzes.map(q => q.id);
      await supabaseAdmin.from('questions').delete().in('quiz_id', quizIds);
      await supabaseAdmin.from('quiz_results').delete().in('quiz_id', quizIds);
      await supabaseAdmin.from('quizzes').delete().eq('teacher_id', targetUserId);
    }

    await supabaseAdmin.from('homeworks').delete().eq('teacher_id', targetUserId);
    await supabaseAdmin.from('activities').delete().eq('teacher_id', targetUserId);
    await supabaseAdmin.from('private_lessons').delete().eq('teacher_id', targetUserId);
    await supabaseAdmin.from('audit_logs').delete().eq('user_id', targetUserId);

    // 4. FİNAL: PROFİLİ VE AUTH HESABINI SİL
    await supabaseAdmin.from('profiles').delete().eq('id', targetUserId);
    
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (authError && authError.message !== 'User not found') {
      console.warn("Auth silme uyarısı:", authError.message);
    }

    return res.status(200).json({ success: true, message: 'Seçili hesap ve ona bağlı tüm veriler sistemden ebediyen silindi.' });

  } catch (err) {
    console.error("Deep Wipe Error:", err);
    return res.status(500).json({ error: 'İşlem başarısız: ' + err.message });
  }
};
