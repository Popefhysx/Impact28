import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Get Help",
    description: "Request support and assistance from the team.",
    openGraph: {
        title: "Get Help",
        description: "Request support and assistance from the team.",
    },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
