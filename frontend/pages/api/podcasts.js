let podcasts = [
  { id: 1, title: 'Tech Talk', desc: 'คุยเรื่องเทคโนโลยี', audio: '/audios/sample.mp3' },
  { id: 2, title: 'Life Story', desc: 'เรื่องราวแรงบันดาลใจ', audio: '/audios/sample.mp3' },
];

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(podcasts);
  }
  if (req.method === 'POST') {
    const body = req.body;
    const id = podcasts.length ? Math.max(...podcasts.map(p=>p.id))+1 : 1;
    const newP = { id, ...body };
    podcasts.push(newP);
    return res.status(201).json(newP);
  }
  if (req.method === 'DELETE') {
    const { id } = req.query;
    podcasts = podcasts.filter(p => String(p.id) !== String(id));
    return res.status(200).json({ message: 'deleted' });
  }
  return res.status(405).end();
}
