import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Participants",
    description: "Manage and support program participants.",
    openGraph: {
        title: "Participants",
        description: "Manage and support program participants.",
    },
};

export default function ParticipantsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
