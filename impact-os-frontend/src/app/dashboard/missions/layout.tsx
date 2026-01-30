import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Missions",
    description: "Track and complete your daily missions to build momentum.",
    openGraph: {
        title: "Missions",
        description: "Track and complete your daily missions to build momentum.",
    },
};

export default function MissionsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
