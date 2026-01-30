import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Support Queue",
    description: "Manage participant support requests.",
    openGraph: {
        title: "Support Queue",
        description: "Manage participant support requests.",
    },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
