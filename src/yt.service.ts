import { Injectable } from "@nestjs/common";
import fs from 'node:fs';
import { GetTokenResponse } from 'google-auth-library/build/src/auth/oauth2client.js';
import {google, youtube_v3} from 'googleapis';

@Injectable()
export class YtService {
    constructor() {}


    test() {
        const OAuth2 = google.auth.OAuth2;
        const {web}:{web:Record<string, any>} = JSON.parse(fs.readFileSync('client_secret.json', 'utf8'));
        const {
            client_secret,
            client_id,
            redirect_uris
        } = web;

        const oauth2Client = new OAuth2(
            client_id,
            client_secret,
            redirect_uris[0]
        )

        const authUrl = oauth2Client.generateAuthUrl(
            {
                access_type: 'offline',
                scope: [
                        'https://www.googleapis.com/auth/youtube.upload',
                        'https://www.googleapis.com/auth/youtube.readonly'
                    ]
            }
        );

        console.log('Authorize this app by visiting this url:', authUrl);


    }
}