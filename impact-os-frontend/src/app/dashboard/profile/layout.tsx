import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Profile",
    description: "Manage your profile and account settings.",
    openGraph: {
        title: "Profile",
        description: "Manage your profile and account settings.",
    },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
