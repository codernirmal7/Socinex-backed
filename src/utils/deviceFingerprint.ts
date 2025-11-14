import crypto from 'crypto';
import { Request } from 'express';
import UAParser from 'ua-parser-js';

export const generateDeviceFingerprint = (req: Request): string => {
    const parser = new UAParser(req.headers['user-agent']);
    const result = parser.getResult();

    const components = [
        req.ip,
        result.browser.name || '',
        result.os.name || '',
        req.headers['accept-language'] || '',
    ];

    const fingerprint = components.join('|');
    return crypto.createHash('sha256').update(fingerprint).digest('hex');
};
