import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Currency",
    description: "View your behavioral currencies and achievements.",
    openGraph: {
        title: "Currency",
        description: "View your behavioral currencies and achievements.",
    },
};

export default function CurrencyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
