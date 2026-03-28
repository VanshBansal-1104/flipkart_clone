import Header from "@/components/Header";
import CategoryBar from "@/components/CategoryBar";
import { useAuthStore } from "@/store/authStore";
import { Link } from "react-router-dom";
import { formatAddressSnippet } from "@/lib/checkoutStorage";

const Profile = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-screen bg-[#f0f2f5]">
      <Header />
      <CategoryBar />
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="fk-card-surface p-6">
          <h1 className="text-xl font-semibold text-[#212121] mb-2">My Profile</h1>
          {user ? (
            <div className="text-sm text-[#565656] space-y-1">
              <p>
                <span className="text-[#878787]">Name:</span> {user.name || "—"}
              </p>
              <p>
                <span className="text-[#878787]">Email:</span> {user.email}
              </p>
              {user.savedAddress?.fullName ? (
                <div className="mt-4 pt-4 border-t border-[#e8e8e8]">
                  <p className="text-[#878787] text-xs font-semibold uppercase mb-1">Saved address</p>
                  <p className="text-[#212121]">{user.savedAddress.fullName}</p>
                  <p className="text-[#565656] text-sm mt-1">{formatAddressSnippet(user.savedAddress)}</p>
                  <Link
                    to="/checkout?step=address"
                    className="inline-block mt-2 text-[#2874f0] text-sm font-medium hover:underline"
                  >
                    Update address
                  </Link>
                </div>
              ) : (
                <Link
                  to="/checkout?step=address"
                  className="inline-block mt-4 text-[#2874f0] text-sm font-medium hover:underline"
                >
                  Add delivery address
                </Link>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#878787] mb-4">You are not logged in.</p>
          )}
          <Link to="/" className="inline-block mt-4 text-[#2874f0] font-medium text-sm hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Profile;
