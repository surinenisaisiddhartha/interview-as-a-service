import { NextResponse } from 'next/server';
import {
    CognitoIdentityProviderClient,
    ForgotPasswordCommand,
    AdminGetUserCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';

const client = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;

function secretHash(username: string) {
    const clientId = process.env.COGNITO_CLIENT_ID!;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET!;
    return createHmac('sha256', clientSecret).update(username + clientId).digest('base64');
}

export async function POST(req: Request) {
    try {
        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

        // Check if user exists in Cognito first
        try {
            await client.send(new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: email }));
        } catch (err: any) {
            if (err.name === 'UserNotFoundException') {
                return NextResponse.json({ error: 'This email is not registered with us.' }, { status: 404 });
            }
            throw err;
        }

        // Send OTP verification code to email via Cognito ForgotPassword
        await client.send(new ForgotPasswordCommand({
            ClientId: process.env.COGNITO_CLIENT_ID!,
            Username: email,
            SecretHash: secretHash(email),
        }));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: error.message || 'Something went wrong.' }, { status: 500 });
    }
}
