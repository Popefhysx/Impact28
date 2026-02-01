import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Compose Email | Impact OS Admin',
    description: 'Compose and send emails to participants',
};

export default function ComposeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
