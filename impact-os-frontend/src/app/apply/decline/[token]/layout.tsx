import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Decline Offer",
    description: "Decline your offer to the Cycle 28 program.",
    openGraph: {
        title: "Decline Offer",
        description: "Decline your offer to the Cycle 28 program.",
    },
};

export default function DeclineLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
