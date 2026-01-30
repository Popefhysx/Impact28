import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Missions",
    description: "Manage and configure program missions.",
    openGraph: {
        title: "Missions",
        description: "Manage and configure program missions.",
    },
};

export default function MissionsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
