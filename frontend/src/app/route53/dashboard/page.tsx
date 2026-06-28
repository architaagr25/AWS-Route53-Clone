// Mocked Route 53 section — a placeholder, since the real feature is Hosted zones.
import ComingSoon from "@/components/shell/ComingSoon";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <ComingSoon
      title="Dashboard"
      description="An overview dashboard for Route 53 is not implemented in this clone. Use Hosted zones to manage domains and DNS records."
    />
  );
}
