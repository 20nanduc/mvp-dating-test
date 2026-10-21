import { useEffect } from "react";

import {
  useLocation,
  useNavigate,
} from "react-router";

import {
  ArrowLeft,
  Heart,
  MessageCircle,
} from "lucide-react";

import { useAuth } from "@/features/auth/context/AuthProvider";

type ConfirmationState = {
  receiverName: string;
  receiverPhoto?: string | null;
};

function isConfirmationState(
  value: unknown,
): value is ConfirmationState {
  return Boolean(
    value &&
    typeof value === "object" &&
    "receiverName" in value &&
    typeof (
      value as { receiverName: unknown }
    ).receiverName === "string" &&
    (
      value as { receiverName: string }
    ).receiverName.trim().length > 0,
  );
}

export function ConnectionRequestSuccessPage() {
  const navigate = useNavigate();

  const { state } = useLocation();

  const { user } = useAuth();

  const confirmation = isConfirmationState(state)
    ? state
    : null;

  // Automatically close after 3 seconds.
  useEffect(() => {
    if (!confirmation) {
      navigate("/app/discover", {
        replace: true,
      });

      return;
    }

    const timer = window.setTimeout(() => {
      navigate("/app/discover", {
        replace: true,
      });
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    navigate,
    confirmation?.receiverName,
    confirmation?.receiverPhoto,
  ]);

  // Prevent opening success page directly
  // without confirmation data.
  if (!confirmation) {
    return null;
  }

  const handleBack = () => {
    navigate("/app/discover", {
      replace: true,
    });
  };

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex justify-center
        bg-[#f4e1e1]
      "
    >
      <main
        className="
          relative flex min-h-dvh
          w-full max-w-md
          flex-col overflow-y-auto

          bg-[radial-gradient(ellipse_at_50%_42%,#fff0f7_0%,#fffdfb_55%,#fff7f2_100%)]

          px-6
          pb-[max(24px,env(safe-area-inset-bottom))]
          pt-[max(20px,env(safe-area-inset-top))]

          shadow-2xl
        "
      >
        {/* Back arrow */}
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back to Discover"
          className="
            flex h-11 w-11 shrink-0
            items-center justify-center
            rounded-full
            text-zinc-800
            transition active:bg-black/5
          "
        >
          <ArrowLeft
            size={23}
            strokeWidth={2}
          />
        </button>

        {/* Main content */}
        <div
          className="
            flex flex-1 flex-col
            items-center justify-center
            pb-12 text-center
          "
        >
          {/* Heading */}
          <div className="max-w-[280px]">
            <h1
              className="
                text-[27px] font-bold
                leading-[1.25]
                tracking-tight
                text-[#24232d]
              "
            >
              You showed interest
              <br />
              in {confirmation.receiverName}!
            </h1>

            <p
              className="
                mt-4 text-sm leading-6
                text-[#686a79]
              "
            >
              Now it's up to them to accept.
              <br />
              No pressure, no rush.
            </p>
          </div>

          {/* Both profile pictures */}
          <div
            className="
              relative mt-9
              flex items-center justify-center
            "
            aria-label="Both profile pictures"
          >
            {/* Current user */}
            <div
              className="
                h-[105px] w-[105px]
                overflow-hidden rounded-full
                border-4 border-white
                bg-[#ffdfce] shadow-lg
              "
            >
              {user?.profile_pic ? (
                <img
                  className="
                    h-full w-full object-cover
                  "
                  src={user.profile_pic}
                  alt="Your profile"
                />
              ) : (
                <div
                  className="
                    flex h-full items-center
                    justify-center
                    text-4xl text-[#bb6e59]
                  "
                >
                  ☺
                </div>
              )}
            </div>

            {/* Receiver */}
            <div
              className="
                -ml-3
                h-[105px] w-[105px]
                overflow-hidden rounded-full
                border-4 border-white
                bg-[#ffdfce] shadow-lg
              "
            >
              {confirmation.receiverPhoto ? (
                <img
                  className="
                    h-full w-full object-cover
                  "
                  src={confirmation.receiverPhoto}
                  alt={`${confirmation.receiverName}'s profile`}
                />
              ) : (
                <div
                  className="
                    flex h-full items-center
                    justify-center
                    text-4xl text-[#bb6e59]
                  "
                >
                  ☺
                </div>
              )}
            </div>

            {/* Center heart */}
            <div
              className="
                absolute left-1/2 top-1/2
                flex h-11 w-11

                -translate-x-1/2
                -translate-y-1/2

                items-center justify-center
                rounded-full
                border-4 border-white
                bg-white shadow-md
              "
            >
              <Heart
                size={22}
                className="text-[#f27356]"
                fill="currentColor"
              />
            </div>
          </div>

          {/* Information card */}
          <div
            className="
              mt-12 flex w-full
              max-w-[335px]
              gap-4 rounded-[22px]

              border border-white
              bg-white/85
              p-5 text-left

              shadow-[0_8px_30px_rgba(97,83,90,0.08)]
            "
          >
            {/* Icon */}
            <div
              className="
                flex h-11 w-11 shrink-0
                items-center justify-center
                rounded-full
                bg-[#def9ef]
                text-[#267d71]
              "
            >
              <MessageCircle
                size={22}
                strokeWidth={1.9}
              />
            </div>

            {/* Message */}
            <p
              className="
                text-sm leading-[1.6]
                text-[#3f4958]
              "
            >
              When they accept, you both can
              start sharing thoughts and get
              to know each other.
            </p>
          </div>

          {/* Auto close message */}
          <p
            className="
              mt-5 text-xs
              text-[#898794]
            "
            aria-live="polite"
          >
            Returning to Discover shortly…
          </p>
        </div>
      </main>
    </div>
  );
}