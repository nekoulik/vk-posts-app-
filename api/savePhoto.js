// api/savePhoto.js — Vercel Serverless Function для сохранения фото

export default async function handler(req, res) {
    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { group_id, photo, server, hash, access_token, v } = req.query;

        if (!group_id || !photo || !server || !hash || !access_token) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        // Вызываем VK API
        const vkUrl = `https://api.vk.com/method/photos.saveWallPhoto?group_id=${group_id}&photo=${photo}&server=${server}&hash=${hash}&access_token=${access_token}&v=${v || '5.131'}`;

        const response = await fetch(vkUrl);
        const data = await response.json();

        return res.status(200).json(data);

    } catch (error) {
        console.error('Save photo error:', error);
        return res.status(500).json({ error: error.message });
    }
}