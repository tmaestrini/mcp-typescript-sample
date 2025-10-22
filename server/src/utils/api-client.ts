import { TokenCredential } from "@azure/identity";


type AuthenticatedApiClientOptions = {
    scopes: string[];
    tokenCredential: TokenCredential;
};

/**
 * Utility class for making (authenticated) API calls
 * 
 * Example usage: Create a client for your backend API
 * new AuthenticatedApiClient(process.env.BACKEND_API_URL || 'https://graph.microsoft.com')
 */
export default class AuthenticatedApiClient {
    private baseUrl: string;
    #options: AuthenticatedApiClientOptions | undefined;
    #requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    constructor(baseUrl: string, options: AuthenticatedApiClientOptions) {
        this.baseUrl = baseUrl;
        if (options) {
            this.#options = options;
        }
    }

    async #obtainAccessToken(): Promise<void> {
        const accessToken = await this.#options?.tokenCredential?.getToken(this.#options.scopes || []);

        if (this.#options?.tokenCredential && !accessToken) {
            throw new Error('No authentication token available');
        }

        this.#requestHeaders['Authorization'] = `Bearer ${accessToken?.token}`;
    }

    /**
     * Makes an (authenticated) GET request
     */
    async get<T>(endpoint: string): Promise<T> {
        try {
            await this.#obtainAccessToken();
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'GET',
                headers: this.#requestHeaders,
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error: any) {
            console.error('Error making GET request:', error);
            throw error;
        }
    }

    /**
     * Makes an (authenticated) POST request
     */
    async post<T>(endpoint: string, data: any): Promise<T> {
        try {
            await this.#obtainAccessToken();
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: this.#requestHeaders,
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            return response.json();
        } catch (error: any) {
            console.error('Error making POST request:', error);
            throw error;
        }
    }

    /**
     * Gets the current user information from auth context
     */
    async getCurrentUser(): Promise<any> {
        const response = await this.get<any>('/v1.0/me');
        return response?.value;
    }
}
