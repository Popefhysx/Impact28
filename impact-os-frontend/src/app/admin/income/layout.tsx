import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Income Review",
    description: "Review and verify participant income submissions.",
    openGraph: {
        title: "Income Review",
        description: "Review and verify participant income submissions.",
    },
};

export default function IncomeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
