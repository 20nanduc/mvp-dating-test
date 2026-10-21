import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getDownloadURL, getStorage, ref } from "firebase/storage";

import { useAuth } from "@/features/auth/context/AuthProvider";

import { FindMatchPage } from "@/features/onboarding/pages/FindMatchPage";

import { saveMatchProfile } from "@/features/onboarding/services/matchProfileService";

type FindMatchRouteProps = {
  mode: "onboarding" | "edit";
};

export function FindMatchRoute({
  mode,
}: FindMatchRouteProps) {
  const navigate = useNavigate();

  // Existing AuthProvider
  const { user, refreshUser } = useAuth();

  const [existingPhotoUrl, setExistingPhotoUrl] = useState<
    string | undefined
  >();

  const photoPath = user?.profile_pic;

  useEffect(() => {
    let cancelled = false;

    if (!photoPath) {
      setExistingPhotoUrl(undefined);
      return;
    }

    // Backward compatibility if an absolute URL is stored.
    if (photoPath.startsWith("https://")) {
      setExistingPhotoUrl(photoPath);
      return;
    }

    setExistingPhotoUrl(undefined);

    getDownloadURL(ref(getStorage(), photoPath))
      .then((url) => {
        if (!cancelled) {
          setExistingPhotoUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExistingPhotoUrl(undefined);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [photoPath]);

  // ProtectedRoute handles unauthenticated users.
  if (!user) {
    return null;
  }

  return (
    <FindMatchPage
      key={`${mode}-${user.auth_id}`}
      mode={mode}
      initialInterests={user.interests ?? []}
      initialPhotoUrl={existingPhotoUrl}
      onSave={async (values, onProgress) => {
        await saveMatchProfile(values, onProgress);

        await refreshUser();

        if (mode === "onboarding") {
          navigate("/app/discover", {
            replace: true,
          });
        }
      }}
    />
  );
}