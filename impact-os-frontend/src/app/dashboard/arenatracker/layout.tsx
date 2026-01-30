import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Arena Tracker",
    description: "Track your market exposure and arena activities.",
    openGraph: {
        title: "Arena Tracker",
        description: "Track your market exposure and arena activities.",
    },
};

export default function ArenaTrackerLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
