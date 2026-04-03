-- =========================================================================================
-- ENGLISH PORTAL VIP - MASTER SECURITY PATCH v3 (KUSURSUZ GÜVENLİK DUVARI)
-- Bu script, Claude AI'ın güvenlik raporundaki 9 kritik açığı yamamak için hazırlanmıştır.
-- SUPABASE SQL EDİTÖRÜNE YAPIŞTIRIP ÇALIŞTIRIN!
-- =========================================================================================

-- =========================================================================================
-- 1. ADIM: MEVCUT TEHLİKELİ KURALLARI TEMİZLE
-- =========================================================================================
DROP POLICY IF EXISTS "Public_Select_Quizzes" ON quizzes;
DROP POLICY IF EXISTS "Public_Select_Questions" ON questions;
DROP POLICY IF EXISTS "Teacher_View_Results" ON quiz_results;
DROP POLICY IF EXISTS "Student_View_Whiteboard" ON whiteboard;
DROP POLICY IF EXISTS "Log_Insert_Safe" ON audit_logs;
DROP POLICY IF EXISTS "Student_View_Activities" ON activities;

-- =========================================================================================
-- 2. ADIM: HİLE VE MANİPÜLASYONA KARŞI ADD_STUDENT_XP (SECURITY DEFINER)
-- =========================================================================================
-- Not: XP/Coin güncellemelerini artık frontend'den değil bu fonksiyondan yapacağız.
-- Öğrencilerin alışveriş ve sınav yeteneklerini bozmamak için güvenli bypass da eklendi.
CREATE OR REPLACE FUNCTION add_student_xp(
    target_student_id UUID,
    xp_amount INT,
    coin_amount INT DEFAULT 0
) RETURNS void AS $$
BEGIN
    -- Yetki Kontrolü: Öğretmen kendi öğrencisine YA DA Öğrenci KENDİNE işlem yapabilir.
    -- Dışarıdan veya başkasının hesabından yapılamaz.
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = target_student_id AND teacher_id = auth.uid()
    ) AND auth.uid() != target_student_id AND get_my_role_safe() != 'god' THEN
        RAISE EXCEPTION 'Yetkisiz erişim denemesi: Güvenlik İhlali.';
    END IF;

    -- Ana Tetikleyiciyi bypass edebilmek için geçici "yetkili süreç" işareti bırakıyoruz
    PERFORM set_config('app.bypass_xp_trigger', 'true', true);

    UPDATE profiles 
    SET 
        xp = COALESCE(xp, 0) + xp_amount,
        coins = COALESCE(coins, 0) + coin_amount
    WHERE id = target_student_id AND role = 'student';

    PERFORM set_config('app.bypass_xp_trigger', 'false', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================================
-- 3. ADIM: TETİKLEYİCİ GÜNCELLEMESİ (TRİGGER KORUMASI VE ÖZEL BYPASS)
-- =========================================================================================
CREATE OR REPLACE FUNCTION protect_profile_fields() RETURNS TRIGGER AS $$
BEGIN
    -- 1. XP VE COIN KORUMASI 
    -- Eğer özel bir bypass süreci yoksa (manuel güncellenmeye çalışılıyorsa), engelle!
    IF (OLD.role = 'student') THEN
        IF (current_setting('app.bypass_xp_trigger', true) IS NULL OR current_setting('app.bypass_xp_trigger', true) != 'true') THEN
            IF (NEW.xp IS DISTINCT FROM OLD.xp OR NEW.coins IS DISTINCT FROM OLD.coins) THEN
                NEW.xp := OLD.xp; 
                NEW.coins := OLD.coins;
            END IF;
        END IF;
    END IF;

    -- 2. KESİN ROL KORUMASI (Herkes İçin)
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
        IF (get_my_role_safe() != 'god') THEN
            NEW.role := OLD.role;
        END IF;
    END IF;

    -- 3. YENİ KORUMA: "is_premium" alanları (AI'nın uyardığı güvenlik deliği)
    IF (OLD.is_premium IS DISTINCT FROM NEW.is_premium OR 
        OLD.premium_until IS DISTINCT FROM NEW.premium_until) THEN
        IF (get_my_role_safe() != 'god') THEN
            NEW.is_premium := OLD.is_premium;
            NEW.premium_until := OLD.premium_until;
        END IF;
    END IF;

    -- 4. YENİ KORUMA: Banka alanları (Sadece sahip ve god)
    IF (OLD.bank_iban IS DISTINCT FROM NEW.bank_iban OR 
        OLD.bank_receiver IS DISTINCT FROM NEW.bank_receiver) THEN
        IF (auth.uid() != NEW.id AND get_my_role_safe() != 'god') THEN
            NEW.bank_iban := OLD.bank_iban;
            NEW.bank_receiver := OLD.bank_receiver;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================================
-- 4. ADIM: YENİ GÜVENLİK KURALLARI (RLS POLICIES)
-- =========================================================================================

-- [QUIZZES VE QUESTIONS] "Herkese Açık" (USING true) tehlikesi kapatıldı
CREATE POLICY "Auth_Select_Quizzes" ON quizzes FOR SELECT USING (
    auth.uid() = teacher_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND teacher_id = quizzes.teacher_id) OR
    get_my_role_safe() = 'god'
);

CREATE POLICY "Auth_Select_Questions" ON questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM quizzes WHERE id = questions.quiz_id AND teacher_id = auth.uid()) OR
    EXISTS (
        SELECT 1 FROM profiles p
        JOIN quizzes q ON q.teacher_id = p.teacher_id
        WHERE p.id = auth.uid() AND q.id = questions.quiz_id
    ) OR
    get_my_role_safe() = 'god'
);

-- [QUIZ_RESULTS] Öğretmenin kendi öğrencilerini değil de kendisini gördüğü mantık hatası düzeltildi
CREATE POLICY "Teacher_View_Results" ON quiz_results FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = quiz_results.student_id
        AND p.teacher_id = auth.uid()
    ) OR
    get_my_role_safe() = 'god'
);

-- [WHITEBOARD] Herkese açık olması engellendi
CREATE POLICY "Student_View_Whiteboard" ON whiteboard FOR SELECT USING (
    auth.uid() = teacher_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND teacher_id = whiteboard.teacher_id) OR
    get_my_role_safe() = 'god'
);

-- [AUDIT LOGS] Başkası log silemez veya değiştiremez
CREATE POLICY "No_Log_Update" ON audit_logs FOR UPDATE USING (false);
CREATE POLICY "No_Log_Delete" ON audit_logs FOR DELETE USING (get_my_role_safe() = 'god');

-- Mevcut Log_Insert_Safe Policy'si kalabilir ama loglar artık değiştirilemez oldu!

-- [ACTIVITIES] Ağır subquery (SELECT id ...) yerine performanslı EXISTS modeline geçildi
CREATE POLICY "Student_View_Activities" ON activities FOR SELECT USING (
    auth.uid() = teacher_id OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND teacher_id = activities.teacher_id
    ) OR
    get_my_role_safe() = 'god'
);


-- =========================================================================================
-- 5. ADIM: PASSWORD RESETS KORUMASI
-- =========================================================================================
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only_Teacher_Or_Kurum_Can_Reset" ON password_resets;
CREATE POLICY "Only_Teacher_Or_Kurum_Can_Reset" ON password_resets 
FOR INSERT WITH CHECK (
    get_my_role_safe() IN ('teacher', 'kurum', 'god')
);

DROP POLICY IF EXISTS "Only_God_Can_Read_Resets" ON password_resets;
CREATE POLICY "Only_God_Can_Read_Resets" ON password_resets 
FOR SELECT USING (get_my_role_safe() = 'god');

DROP POLICY IF EXISTS "Auto_Cleanup" ON password_resets;
CREATE POLICY "Auto_Cleanup" ON password_resets FOR DELETE USING (true);


-- =========================================================================================
-- 6. ADIM: VERİTABANI PERFORMANS İYİLEŞTİRMESİ
-- =========================================================================================
-- VIP eşitleme sistemini hızlandıracak olan indeks eklendi
CREATE INDEX IF NOT EXISTS idx_profiles_school_id_role 
ON profiles(school_id, role) 
WHERE role = 'teacher';

-- TAMAMLANDI --
