export function checkAuth(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  return auth.slice(7) === secret;
}

export function unauthorized(): Response {
  return json({ error: 'Unauthorized' }, 401);
}

export function adminNotConfigured(): Response {
  return json({ error: 'Admin not configured — set ADMIN_SECRET env var' }, 503);
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_SECRET);
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
