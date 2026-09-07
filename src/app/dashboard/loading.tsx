import { LoadingTunnel } from "@/components/loading-tunnel";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingTunnel />
    </div>
  );
}
