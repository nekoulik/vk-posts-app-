// api/upload.js — Vercel Serverless Function для проксирования загрузки фото

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};

export default async function handler(req, res) {
    console.log('📥 Upload API called');
    console.log('Method:', req.method);
    console.log('URL:', req.url);

    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight запрос
    if (req.method === 'OPTIONS') {
        console.log('✅ OPTIONS handled');
        return res.status(200).end();
    }

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
            console.error('❌ uploadUrl is missing');
            return res.status(400).json({ error: 'uploadUrl is required' });
        }

        // Собираем raw body
        console.log('📦 Receiving file...');
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const body = Buffer.concat(chunks);
        console.log('✅ Received', body.length, 'bytes');

        // Определяем Content-Type
        const contentType = req.headers['content-type'];
        console.log('Content-Type:', contentType);

        // 🔥 ВАЖНО: пробуем загрузить на VK сервер
        console.log(' Forwarding to VK upload server...');

        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Content-Type': contentType || 'multipart/form-data',
            },
            body: body,
        });

        console.log('VK upload response status:', response.status);

        // Проверяем статус ответа
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ VK upload failed:', response.status, errorText);

            // Если VK вернул 502 или 503, пробуем еще раз через 2 секунды
            if (response.status === 502 || response.status === 503) {
                console.log('🔄 Retrying in 2 seconds...');
                await new Promise(resolve => setTimeout(resolve, 2000));

                const retryResponse = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': contentType || 'multipart/form-data',
                    },
                    body: body,
                });

                if (!retryResponse.ok) {
                    const retryErrorText = await retryResponse.text();
                    throw new Error(`VK upload failed after retry: ${retryResponse.status} ${retryErrorText}`);
                }

                const retryData = await retryResponse.json();
                console.log('✅ Retry success:', retryData);
                return res.status(200).json(retryData);
            }

            throw new Error(`VK upload failed: ${response.status} ${errorText}`);
        }

        // Парсим ответ
        const data = await response.json();
        console.log('✅ VK upload success:', data);

        return res.status(200).json(data);

    } catch (error) {
        console.error('❌ Upload proxy error:', error);
        console.error('Stack:', error.stack);

        return res.status(500).json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}