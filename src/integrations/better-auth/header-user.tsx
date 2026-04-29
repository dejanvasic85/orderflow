import { authClient } from "#/lib/auth-client";

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="auth-avatar h-8 w-8 animate-pulse rounded-full" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" />
        ) : (
          <div className="auth-avatar flex h-8 w-8 items-center justify-center rounded-full">
            <span className="auth-avatar-text text-xs font-medium">
              {session.user.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
        )}
        <button
          onClick={() => {
            void authClient.signOut();
          }}
          className="button-neutral h-9 flex-1 px-4 text-sm font-medium transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <a
      href="/login"
      className="button-neutral inline-flex h-9 items-center px-4 text-sm font-medium transition-colors"
    >
      Sign in
    </a>
  );
}
