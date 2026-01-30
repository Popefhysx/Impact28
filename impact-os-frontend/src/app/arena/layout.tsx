import { Metadata } from "next";

export const metadata: Metadata = {
    title: "The Arena",
    description: "The Philosophy That Drives Everything We Build - Fail forward or don't fail at all.",
    openGraph: {
        title: "The Arena",
        description: "The Philosophy That Drives Everything We Build - Fail forward or don't fail at all.",
    },
};

export default function ArenaLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
