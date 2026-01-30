import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Onboarding",
    description: "Complete your onboarding to get started with Impact OS.",
    openGraph: {
        title: "Onboarding",
        description: "Complete your onboarding to get started with Impact OS.",
    },
};

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
