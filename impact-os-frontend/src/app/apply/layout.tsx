import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Apply",
    description: "Apply to join the Cycle 28 program and transform your economic future.",
    openGraph: {
        title: "Apply",
        description: "Apply to join the Cycle 28 program and transform your economic future.",
    },
};

export default function ApplyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
