export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { username, password } = req.body || {};
  if (username === 'admin' && password === '1234') {
    return res.status(200).json({ token: 'admin-mock-token', role: 'admin' });
  }
  if (username === 'member' && password === '1234') {
    return res.status(200).json({ token: 'member-mock-token', role: 'user' });
  }
  return res.status(401).json({ message: 'Invalid credentials' });
}
