/**
 * Script untuk test API key OpenAI atau kompatibel
 */

const API_KEY = 'sk-apIXDRg6ZAYOCXjqE65f02D7Ef5b48C5B642B91e25D6Ef39';

// Test dengan endpoint OpenAI standard
async function testOpenAIKey() {
    console.log('🔍 Testing API Key...');
    console.log('API Key:', API_KEY.substring(0, 10) + '...' + API_KEY.substring(API_KEY.length - 5));
    console.log('');

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'user', content: 'Say "API key is valid!"' }
                ],
                max_tokens: 10
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ API Key VALID!');
            console.log('Response:', data.choices[0].message.content);
            console.log('Model:', data.model);
            console.log('');
            return true;
        } else {
            console.log('❌ API Key INVALID atau ada error');
            console.log('Status:', response.status);
            console.log('Error:', data.error?.message || JSON.stringify(data));
            console.log('');
            return false;
        }
    } catch (error) {
        console.log('❌ Network error atau endpoint tidak tersedia');
        console.log('Error:', error.message);
        console.log('');
        return false;
    }
}

// Test dengan endpoint alternatif (untuk proxy/third-party)
async function testAlternativeEndpoint() {
    console.log('🔍 Testing dengan endpoint alternatif...');

    // Beberapa endpoint yang mungkin
    const endpoints = [
        'https://api.openai.com/v1/models',
        'https://api.openrouter.ai/api/v1/models',
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing: ${endpoint}`);
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Berhasil dengan endpoint:', endpoint);
                console.log('Available models:', data.data?.slice(0, 3).map(m => m.id).join(', ') || 'N/A');
                console.log('');
                return true;
            }
        } catch (error) {
            console.log(`❌ Gagal: ${error.message}`);
        }
    }

    return false;
}

// Main test
async function main() {
    console.log('='.repeat(60));
    console.log('API KEY TESTER');
    console.log('='.repeat(60));
    console.log('');

    const isValid = await testOpenAIKey();

    if (!isValid) {
        console.log('Mencoba endpoint alternatif...');
        console.log('');
        await testAlternativeEndpoint();
    }

    console.log('='.repeat(60));
    console.log('Test selesai!');
    console.log('='.repeat(60));
}

main();
