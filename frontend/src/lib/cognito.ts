import {
    CognitoIdentityProviderClient,
    AdminCreateUserCommand,
    AdminAddUserToGroupCommand,
    AdminDeleteUserCommand,
    InitiateAuthCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from 'crypto';

const region = process.env.AWS_REGION || "us-east-1";

const client = new CognitoIdentityProviderClient({
    region,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;

export async function createCognitoUser(email: string, role: string) {
    let cognitoSub: string | undefined;

    try {
        // Step 1: Create the user in Cognito
        const createUserCmd = new AdminCreateUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
            UserAttributes: [
                { Name: 'email', Value: email },
                { Name: 'email_verified', Value: 'true' }
            ],
            DesiredDeliveryMediums: ['EMAIL'], // Sends temp password to email
        });

        const response = await client.send(createUserCmd);
        cognitoSub = response.User?.Attributes?.find(attr => attr.Name === 'sub')?.Value;

        if (!cognitoSub) {
            throw new Error("Failed to retrieve cognito sub for created user.");
        }

        // Step 2: Map role to Cognito group name
        let groupName = 'Recruiter';
        if (role === 'company_admin') groupName = 'CompanyAdmin';
        else if (role === 'superadmin') groupName = 'SuperAdmin';

        // Step 3: Add user to group
        const addToGroupCmd = new AdminAddUserToGroupCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
            GroupName: groupName
        });

        await client.send(addToGroupCmd);

        return cognitoSub;

    } catch (error) {
        console.error("Cognito user creation error:", error);

        // Rollback: if the user was created but group assignment failed, delete the user
        // to prevent a 'groupless' user that would default to 'recruiter' on sign-in
        if (cognitoSub) {
            try {
                console.warn(`Rolling back: deleting Cognito user ${email} due to group assignment failure`);
                await client.send(new AdminDeleteUserCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: email,
                }));
            } catch (rollbackError) {
                console.error("Rollback failed — manually delete user from Cognito:", email, rollbackError);
            }
        }

        throw error;
    }
}

/**
 * Authenticate a user directly with Cognito (no Hosted UI redirect).
 * Requires USER_PASSWORD_AUTH to be enabled in the Cognito App Client.
 */
export async function authenticateCognitoUser(email: string, password: string) {
    const clientId = process.env.COGNITO_CLIENT_ID!;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET!;

    // Cognito requires SECRET_HASH when the App Client has a client secret configured
    const secretHash = createHmac('sha256', clientSecret)
        .update(email + clientId)
        .digest('base64');

    const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: clientId,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
            SECRET_HASH: secretHash,
        },
    });

    const response = await client.send(command);

    if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        throw new Error('NEW_PASSWORD_REQUIRED');
    }

    if (!response.AuthenticationResult?.IdToken) {
        throw new Error('Authentication failed — no token returned.');
    }

    // Decode the Cognito ID token (base64) to get user claims without extra API call
    const idToken = response.AuthenticationResult.IdToken;
    const payloadBase64 = idToken.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));

    return {
        sub: payload.sub as string,
        email: (payload.email || email) as string,
        groups: (payload['cognito:groups'] || []) as string[],
    };
}
