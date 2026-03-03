import { NextResponse } from 'next/server';
import {
    CognitoIdentityProviderClient,
    ConfirmForgotPasswordCommand
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
        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ error: 'Email, OTP, and new password are required.' }, { status: 400 });
        }

        await client.send(new ConfirmForgotPasswordCommand({
            ClientId: process.env.COGNITO_CLIENT_ID!,
            Username: email,
            ConfirmationCode: otp,
            Password: newPassword,
            SecretHash: secretHash(email),
        }));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Reset password error:', error);
        if (error.name === 'CodeMismatchException') {
            return NextResponse.json({ error: 'Incorrect OTP. Please check your email and try again.' }, { status: 400 });
        }
        if (error.name === 'ExpiredCodeException') {
            return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
        }
        if (error.name === 'InvalidPasswordException') {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to reset password.' }, { status: 500 });
    }
}
