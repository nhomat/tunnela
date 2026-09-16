import { LoadingTunnel } from "@/components/loading-tunnel";

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <LoadingTunnel />
      <h1 className="mt-8 font-serif text-4xl text-neutral-900 sm:text-6xl">Maintenance</h1>
      <p className="mt-4 text-lg text-neutral-600 sm:text-2xl">Tunnela est bientôt disponible</p>
    </div>
  );
}
