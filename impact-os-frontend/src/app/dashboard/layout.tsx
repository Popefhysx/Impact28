import { Metadata } from "next";
import DashboardLayoutClient from "./DashboardLayoutClient";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Your Impact OS Dashboard - Track your progress, missions, and achievements.",
    openGraph: {
        title: "Dashboard",
        description: "Your Impact OS Dashboard - Track your progress, missions, and achievements.",
    },
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
