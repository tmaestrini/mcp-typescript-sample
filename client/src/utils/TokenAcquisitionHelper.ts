import express from 'express';
import { Server } from 'http';
import { ClientSecretCredential, InteractiveBrowserCredential } from '@azure/identity';


const app = express();

export default class TokenAcquisitionHelper {

    #isAuthenticated = false;
    #accessToken: string | null = null;
    #server: Server | null = null;

    /**
     * Acquires an access token using interactive browser authentication.
     * 
     * References: https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/samples/AzureIdentityExamples.md#authenticating-a-service-principal-with-a-client-secret
     * @returns 
     */
    async acquireTokenInteractively(): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {

            const credential = new InteractiveBrowserCredential({
                tenantId: process.env.AZURE_TENANT_ID || "",
                clientId: process.env.AZURE_CLIENT_ID || "",
                authorityHost: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || ""}`,
                disableAutomaticAuthentication: false,
            });

            try {
                const tokenResponse = await credential.getToken([process.env.AZURE_CLIENT_SCOPE || ""]);
                this.#accessToken = tokenResponse.token;
                this.#isAuthenticated = true;
                return resolve(tokenResponse.token);
            } catch (error: unknown) {
                console.error('Error acquiring token interactively:', error);
                return reject(error);
            }
        });
    }

    /**
     * Acquires an access token using a service principal (client credentials flow).
     * 
     * References: https://github.com/Azure/azure-sdk-for-js/blob/main/sdk/identity/identity/samples/AzureIdentityExamples.md#authenticating-a-service-principal-with-a-client-secret
     * @returns 
     */
    async acquireTokenWithServicePrincipal(): Promise<string> {
        return new Promise<string>(async (resolve, reject) => {
            try {
                const credential = new ClientSecretCredential(
                    process.env.AZURE_TENANT_ID || "",
                    process.env.AZURE_CLIENT_ID || "",
                    process.env.AZURE_CLIENT_SECRET || "",
                    {
                        authorityHost: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || ""}`,
                    });
                const tokenResponse = await credential.getToken([process.env.AZURE_CLIENT_SCOPE || ""]);
                this.#accessToken = tokenResponse.token;
                this.#isAuthenticated = true;
                return resolve(tokenResponse.token);
            } catch (error: unknown) {
                console.error('Error acquiring token with service principal:', error);
                return reject(error);
            }
        });
    }

    get isAuthenticated(): boolean {
        return this.#isAuthenticated;
    }

    get accessToken(): string | null {
        return this.#accessToken;
    }
}