import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';


export default function loadEnvironmentDefinitions() {
    // Only load local .env files when not in production
    if (process.env.NODE_ENV !== 'production') {
        const devEnvPath = path.resolve(process.cwd(), '.env.development');
        if (fs.existsSync(devEnvPath)) {
            dotenv.config({ path: devEnvPath });
        } else {
            dotenv.config();
        }
    }
}