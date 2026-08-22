// Vercel Serverless Function — прокси для загрузки фото в VK
export const config = {
    api: {
        bodyParser: false, // отключаем парсинг, получаем raw body
    },
};

export default async function handler(req, res) {
    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Получаем uploadUrl из query параметров
        const url = new URL(req.url, `http://${req.headers.host}`);
        const uploadUrl = url.searchParams.get('uploadUrl');

        if (!uploadUrl) {
            return res.status(400).json({ error: 'uploadUrl is required' });
        }

        // Получаем raw body (multipart/form-data)
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const body = Buffer.concat(chunks);

        // Пересылаем на сервер VK (сервер-сервер = нет CORS!)
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Content-Type': req.headers['content-type'],
            },
            body: body,
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Upload proxy error:', error);
        return res.status(500).json({ error: error.message });
    }
}