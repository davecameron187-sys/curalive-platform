import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";

export default function CustomerProfile() {
  const [, navigate] = useLocation();
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  if (isLoading) return <div className="p-8 text-white">Loading...</div>;
  if (!user) return <div className="p-8 text-white">Not authenticated.</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <button
        onClick={() => navigate("/customer/dashboard")}
        className="mb-6 text-sm text-gray-400 hover:text-white"
      >
        ← Back to Dashboard
      </button>
      <h1 className="text-xl font-semibold mb-6">Profile</h1>
      <div className="space-y-4 text-sm">
        <div>
          <span className="text-gray-400">Email</span>
          <p className="text-white mt-1">{user.email ?? "—"}</p>
        </div>
        <div>
          <span className="text-gray-400">Role</span>
          <p className="text-white mt-1">{user.role ?? "—"}</p>
        </div>
        <div>
          <span className="text-gray-400">Org</span>
          <p className="text-white mt-1">{user.orgId ?? "—"}</p>
        </div>
      </div>
    </div>
  );
}
