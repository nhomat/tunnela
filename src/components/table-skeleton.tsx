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
    <div className="flex flex-col gap-3">
      <div className="skeleton h-6 w-40" />
      <div className="skeleton h-4 w-64" />
    </div>
  );
}
