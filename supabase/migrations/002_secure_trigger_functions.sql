-- Supabase SQL güvenlik taraması: trigger fonksiyonları REST API'den çağrılamasın.
-- Trigger'ların veritabanı içinde çalışması devam eder.
REVOKE EXECUTE ON FUNCTION public.ucar_log_request() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ucar_profile_on_signup() FROM PUBLIC, anon, authenticated;
