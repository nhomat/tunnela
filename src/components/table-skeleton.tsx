import { LoadingTunnel } from "@/components/loading-tunnel";

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card flex flex-col gap-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-10 w-full" />
      ))}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingTunnel />
    </div>
  );
}
