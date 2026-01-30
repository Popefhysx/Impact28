import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Resources",
    description: "Manage program resources and learning materials.",
    openGraph: {
        title: "Resources",
        description: "Manage program resources and learning materials.",
    },
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
