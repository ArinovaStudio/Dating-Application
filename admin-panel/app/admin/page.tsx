import { AnalyticsSection } from "@/components/AnalyticsSection"; 

export default function AdminPage() {
    return (
        <div className="min-w-full">
            <h1 className="text-3xl font-bold mb-6">
                Dashboard
            </h1>
            <AnalyticsSection />
        </div>
    )
}