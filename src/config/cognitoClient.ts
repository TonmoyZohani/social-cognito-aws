import { Issuer, Client } from 'openid-client';

let client: Client;

export async function initializeCognitoClient(): Promise<Client> {
  try {
    console.log('Discovering Cognito issuer...');
    
    const issuerUrl = `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`;
    const issuer = await Issuer.discover(issuerUrl);

    client = new issuer.Client({
      client_id: process.env.COGNITO_CLIENT_ID!,
      client_secret: process.env.COGNITO_CLIENT_SECRET!,
      redirect_uris: [process.env.REDIRECT_URI!],
      response_types: ['code'],
    });

    console.log('OIDC Client initialized successfully');
    return client;
  } catch (error) {
    console.error(' Failed to initialize OIDC client:', error);
    throw error;
  }
}

export function getClient(): Client {
  if (!client) {
    throw new Error('OIDC client not initialized. Call initializeCognitoClient first.');
  }
  return client;
}