import { LoaderCircle } from "lucide-react";

type GoogleSignInButtonProps = {
  onClick: () => void;
  loading?: boolean;
};

export function GoogleSignInButton({
  onClick,
  loading = false,
}: GoogleSignInButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-white px-5 font-semibold text-zinc-900 shadow-[0_5px_25px_rgba(40,24,19,0.1)] transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed7255] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <LoaderCircle
          className="size-5 animate-spin"
          aria-hidden="true"
        />
      ) : (
        <svg
          viewBox="0 0 48 48"
          className="size-5"
          aria-hidden="true"
        >
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.88 46.98 24.55z" />
          <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
      )}

      {loading ? "Connecting..." : "Continue with Google"}
    </button>
  );
}