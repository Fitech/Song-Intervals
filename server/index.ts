import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Spotify credentials - set these in .env file
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3001/auth/callback';
const FRONTEND_URI = process.env.FRONTEND_URI || 'http://localhost:3005';

app.use(cors({ origin: FRONTEND_URI, credentials: true }));
app.use(express.json());

// Generate random state for CSRF protection
function generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Step 1: Redirect to Spotify authorization
app.get('/auth/login', (req, res) => {
    const state = generateRandomString(16);
    const scopes = [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'playlist-read-private',
        'playlist-read-collaborative'
    ].join(' ');

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID!,
        scope: scopes,
        redirect_uri: REDIRECT_URI,
        state: state
    });

    res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
});

// Step 2: Exchange authorization code for tokens
app.get('/auth/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        return res.redirect(`${FRONTEND_URI}?error=${error}`);
    }

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code as string,
                redirect_uri: REDIRECT_URI
            })
        });

        const data = await response.json() as any;

        if (data.error) {
            return res.redirect(`${FRONTEND_URI}?error=${data.error}`);
        }

        // Redirect to frontend with tokens in URL params
        const params = new URLSearchParams({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in.toString()
        });

        res.redirect(`${FRONTEND_URI}?${params.toString()}`);
    } catch (err) {
        console.error('Token exchange error:', err);
        res.redirect(`${FRONTEND_URI}?error=token_exchange_failed`);
    }
});

// Step 3: Refresh expired tokens
app.post('/auth/refresh', async (req, res) => {
    const { refresh_token } = req.body;

    if (!refresh_token) {
        return res.status(400).json({ error: 'Missing refresh_token' });
    }

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refresh_token
            })
        });

        const data = await response.json() as any;

        if (data.error) {
            return res.status(400).json({ error: data.error });
        }

        res.json({
            access_token: data.access_token,
            expires_in: data.expires_in
        });
    } catch (err) {
        console.error('Token refresh error:', err);
        res.status(500).json({ error: 'token_refresh_failed' });
    }
});

app.listen(Number(PORT), '127.0.0.1', () => {
    console.log(`Spotify auth server running on http://127.0.0.1:${PORT}`);
    console.log(`Make sure to set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env`);
});
