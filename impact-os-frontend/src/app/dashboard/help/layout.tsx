import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Help",
    description: "Get help and find answers to common questions.",
    openGraph: {
        title: "Help",
        description: "Get help and find answers to common questions.",
    },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
