import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Income",
    description: "Track your income and financial progress.",
    openGraph: {
        title: "Income",
        description: "Track your income and financial progress.",
    },
};

export default function IncomeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
