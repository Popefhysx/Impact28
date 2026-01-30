import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Applicants",
    description: "Review and manage program applicants.",
    openGraph: {
        title: "Applicants",
        description: "Review and manage program applicants.",
    },
};

export default function ApplicantsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
