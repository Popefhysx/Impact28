import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Communications | Impact OS Admin',
    description: 'Email audit trail and delivery tracking',
};

export default function CommunicationsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
