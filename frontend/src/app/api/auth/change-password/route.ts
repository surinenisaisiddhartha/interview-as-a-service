import { NextResponse } from 'next/server';
import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    RespondToAuthChallengeCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';

const client = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

function secretHash(username: string) {
    const clientId = process.env.COGNITO_CLIENT_ID!;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET!;
    return createHmac('sha256', clientSecret).update(username + clientId).digest('base64');
}

export async function POST(req: Request) {
    try {
        const { email, temporaryPassword, newPassword } = await req.json();

        if (!email || !temporaryPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const clientId = process.env.COGNITO_CLIENT_ID!;

        // Step 1: InitiateAuth with the temporary password to get the challenge session
        const initResponse = await client.send(new InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: clientId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: temporaryPassword,
                SECRET_HASH: secretHash(email),
            },
        }));

        if (initResponse.ChallengeName !== 'NEW_PASSWORD_REQUIRED') {
            return NextResponse.json({ error: 'No password change is required for this account.' }, { status: 400 });
        }

        // Step 2: Respond to the NEW_PASSWORD_REQUIRED challenge with the new password
        await client.send(new RespondToAuthChallengeCommand({
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            ClientId: clientId,
            Session: initResponse.Session!,
            ChallengeResponses: {
                USERNAME: email,
                NEW_PASSWORD: newPassword,
                SECRET_HASH: secretHash(email),
            },
        }));

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Change password error:', error);

        if (error.name === 'InvalidPasswordException') {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error.name === 'NotAuthorizedException') {
            return NextResponse.json({ error: 'Incorrect temporary password.' }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || 'Failed to change password.' }, { status: 500 });
    }
}
