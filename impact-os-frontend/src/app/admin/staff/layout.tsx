import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Staff",
    description: "Manage program staff and team members.",
    openGraph: {
        title: "Staff",
        description: "Manage program staff and team members.",
    },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
