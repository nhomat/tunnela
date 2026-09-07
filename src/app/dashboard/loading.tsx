import { LogoLoader } from "@/components/logo-loader";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LogoLoader />
    </div>
  );
}
