import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Progress",
    description: "Track your journey and skill development progress.",
    openGraph: {
        title: "Progress",
        description: "Track your journey and skill development progress.",
    },
};

export default function ProgressLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
