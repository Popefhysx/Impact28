import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Accept Offer",
    description: "Accept your offer to join the Cycle 28 program.",
    openGraph: {
        title: "Accept Offer",
        description: "Accept your offer to join the Cycle 28 program.",
    },
};

export default function AcceptLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
