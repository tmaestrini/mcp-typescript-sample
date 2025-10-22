import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { JwksClient } from 'jwks-rsa';


config();

/**
 * Middleware to validate the authentication token (Bearer or x-api-key).
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next middleware function.
 * @returns 
 */
export default async function authorizeRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-api-key'] as string;

    if (!token) {
        return res.status(401).json({
            jsonrpc: '2.0',
            error: {
                code: -32001,
                message: 'Authentication token required'
            },
            id: null
        });
    }

    // Check for other authorization-related headers if needed

    // Finally, validate the token (this is a placeholder, implement your own validation logic)
    const tokenValidation = await isValidToken(token);
    if (!tokenValidation.isValid) {
        return res.status(401).json({
            jsonrpc: '2.0',
            error: {
                code: -32003,
                message: 'Invalid authentication token'
            },
            id: null
        });
    }

    // If token is valid, proceed to the next middleware or route handler
    next();
};

/**
 * Validates the JWT token that comes from Entra ID.
 * NOTE: When validating an Entra ID token, the signature check can not be done
 * Therefore, the `jwks-rsa` library is not used here.
 * 
 * @param token - The JWT token to validate.
 * @returns A promise that resolves to an object with validation result and payload.
 */
async function isValidToken(token: string): Promise<{ isValid: boolean; payload?: jwt.JwtPayload }> {
    try {
        // Decode token to get header and payload
        const decodedTokenInfo = jwt.decode(token, { complete: true }) as jwt.Jwt;

        if (!decodedTokenInfo) {
            console.error('Failed to decode token');
            return { isValid: false };
        }

        const payload = decodedTokenInfo.payload as jwt.JwtPayload;
        const issuer = payload.iss;

        // Validate the token signature using JWKS from the issuer
        // Reference (needs slight adjustments): https://www.voitanos.io/blog/validating-entra-id-generated-oauth-tokens/
        const client = new JwksClient({
            jwksUri: `${issuer}/discovery/v2.0/keys`,
            requestHeaders: {},
            timeout: 30000 // 30 seconds
        });
        const kid = decodedTokenInfo.header.kid;
        const key = await client.getSigningKey(kid || '');
        const signingKey = key.getPublicKey();

        const verifiedToken = jwt.verify(token, signingKey, { algorithms: ['RS256'], ignoreExpiration: false, ignoreNotBefore: false }) as jwt.JwtPayload;

        // scp claim check for app roles or permissions
        if (!verifiedToken.scp && (verifiedToken.scp as string).includes('mcp:tools')) { //|| !payload.scp.includes('mcp:tools')) {
            console.error('Required scope not found in token payload');
            return { isValid: false };
        }

        // add more checks here (e.g., tenant id, roles, token type, ...) if needed

        return { isValid: true, payload };
    } catch (error) {
        console.error('Token validation error:', error);
        return { isValid: false };
    }
}