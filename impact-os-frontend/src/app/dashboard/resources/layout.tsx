import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Resources",
    description: "Access learning resources and program materials.",
    openGraph: {
        title: "Resources",
        description: "Access learning resources and program materials.",
    },
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
