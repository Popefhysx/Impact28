import { Metadata } from "next";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = {
    title: "Admin Console",
    description: "Impact OS Admin Console - Manage applicants, participants, and program operations.",
    openGraph: {
        title: "Admin Console",
        description: "Impact OS Admin Console - Manage applicants, participants, and program operations.",
    },
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
