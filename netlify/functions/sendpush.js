const crypto = require('crypto');

// ==========================================
// 🔴 FETCHING FROM NETLIFY VARIABLES 🔴
// ==========================================
const PROJECT_ID = process.env.FCM_PROJECT_ID; 
const CLIENT_EMAIL = process.env.FCM_CLIENT_EMAIL;
// Private key mein \n (new lines) ko sahi se handle karna zaroori hai
const PRIVATE_KEY = process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n');

const DATABASE_URL = `https://${PROJECT_ID}-default-rtdb.firebaseio.com`;

async function getAccessToken() {
    const header = { alg: 'RS256', typ: 'JWT' };
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600;
    const payload = {
        iss: CLIENT_EMAIL,
        scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/firebase.database',
        aud: 'https://oauth2.googleapis.com/token',
        exp: exp,
        iat: iat
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsignedToken);
    sign.end();
    const signature = sign.sign(PRIVATE_KEY, 'base64url');
    const jwt = `${unsignedToken}.${signature}`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
        })
    });

    const data = await response.json();
    if (!response.ok) throw new Error('Token Error: ' + (data.error_description || 'Unknown'));
    return data.access_token;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        const body = JSON.parse(event.body);
        const targetUID = body.targetUID;
        const senderName = body.senderName;

        const token = await getAccessToken();

        const dbResponse = await fetch(`${DATABASE_URL}/users/${targetUID}/fcmToken.json?access_token=${token}`);
        const fcmToken = await dbResponse.json();

        if (!fcmToken) return { statusCode: 404, body: 'FCM token not found' };

        const pushPayload = {
            message: {
                token: fcmToken,
                notification: {
                    title: `ACANZA PRO`,
                    body: `New message from @${senderName}`
                },
                webpush: {
                    notification: {
                        icon: 'https://cdn.jsdelivr.net/gh/ishowspeed76042-cmd/GLB/logo.png',
                        badge: 'https://cdn.jsdelivr.net/gh/ishowspeed76042-cmd/GLB/logo.png'
                    },
                    fcm_options: {
                        link: `https://acanza.netlify.app`
                    }
                }
            }
        };

        const pushResponse = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pushPayload)
        });

        const result = await pushResponse.json();
        return { statusCode: 200, body: JSON.stringify({ success: true, result }) };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
