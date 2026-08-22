// api/upload.js — Vercel Serverless Function для проксирования загрузки фото во VK

export const config = {
    api: {
        bodyParser: false, // Отключаем стандартный парсинг body
        responseLimit: false,
    },
};

export default async function handler(req, res) {
    // Логи для отладки
    console.log('📥 Upload API called');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));

    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Обработка preflight запроса
    if (req.method === 'OPTIONS') {
        console.log('✅ OPTIONS request handled');
        return res.status(200).end();
    }

    // Проверяем метод
    if (req.method !== 'POST') {
        console.error('❌ Method not allowed:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Получаем uploadUrl из query параметров
        const url = new URL(req.url, `http://${req.headers.host}`);
        const uploadUrl = url.searchParams.get('uploadUrl');

        console.log('Upload URL:', uploadUrl);

        if (!uploadUrl) {
            console.error('❌ uploadUrl parameter is missing');
            return res.status(400).json({ error: 'uploadUrl is required' });
        }

        // Собираем raw body (multipart/form-data)
        console.log('📦 Receiving file data...');
        const chunks = [];

        for await (const chunk of req) {
            chunks.push(chunk);
        }

        const body = Buffer.concat(chunks);
        console.log('✅ Received', body.length, 'bytes');

        // Определяем Content-Type из заголовков запроса
        const contentType = req.headers['content-type'];
        console.log('Content-Type:', contentType);

        // Пересылаем на сервер VK (сервер-сервер = нет CORS!)
        console.log('🚀 Forwarding to VK upload server...');

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Content-Type': contentType || 'multipart/form-data',
            },
            body: body,
        });

        console.log('VK response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ VK upload failed:', response.status, errorText);
            throw new Error(`VK upload failed: ${response.status} ${errorText}`);
        }

        // Парсим ответ от VK
        const data = await response.json();
        console.log('✅ VK upload success:', JSON.stringify(data, null, 2));

        return res.status(200).json(data);

    } catch (error) {
        console.error('❌ Upload proxy error:', error);
        console.error('Stack trace:', error.stack);

        return res.status(500).json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}