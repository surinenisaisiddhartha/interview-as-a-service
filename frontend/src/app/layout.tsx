import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/app-provider";

export const metadata: Metadata = {
    title: "HireSphere – AI-Powered Interview Platform",
    description:
        "Scale your hiring with AI voice interviews, standardized assessments, and bias-free evaluations.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
