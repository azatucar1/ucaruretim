import { config } from './config.js';
import { roles } from './logic.js';
import { getAdminClient, getAuthClient } from './supabase.js';

export async function requireAuth(req, res, next) {
  try {
    if (config.demo) {
      const proposedRole = req.get('X-Demo-Role');
      const role = roles.includes(proposedRole) ? proposedRole : 'sales';
      req.actor = { id: 'demo-' + role, role, display_name: 'Demo: ' + role };
      return next();
    }

    const match = /^Bearer (.+)$/.exec(req.get('Authorization') || '');
    if (!match) return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' });

    const { data, error } = await getAuthClient().auth.getUser(match[1]);
    if (error || !data.user) return res.status(401).json({ error: 'Oturum doğrulanamadı.' });

    const { data: profile, error: profileError } = await getAdminClient()
      .from('profiles')
      .select('id, role, display_name')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile || !roles.includes(profile.role)) {
      return res.status(403).json({ error: 'Kullanıcı yetkisi tanımlanmamış.' });
    }

    req.actor = profile;
    next();
  } catch (error) {
    next(error);
  }
}
