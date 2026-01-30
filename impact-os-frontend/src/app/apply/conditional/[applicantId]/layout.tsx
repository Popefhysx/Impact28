import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Conditional Offer",
    description: "Review your conditional offer details.",
    openGraph: {
        title: "Conditional Offer",
        description: "Review your conditional offer details.",
    },
};

export default function ConditionalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
