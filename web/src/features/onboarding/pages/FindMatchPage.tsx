import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";

import { MatchPhotoUploader } from "../components/MatchPhotoUploader";
import { InterestsInput } from "../components/InterestsInput";

import {
  matchSchema,
  type MatchPreferences,
} from "../schemas/match.schema";

type FindMatchPageProps = {
  mode: "onboarding" | "edit";

  initialInterests?: string[];
  initialPhotoUrl?: string | null;

  onSave: (
    values: MatchPreferences,
    onProgress: (percentage: number) => void
  ) => Promise<void>;
};

export function FindMatchPage({
  mode,
  initialInterests = [],
  initialPhotoUrl,
  onSave,
}: FindMatchPageProps) {
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MatchPreferences>({
    resolver: zodResolver(matchSchema),

    defaultValues: {
      interests: initialInterests,
    },

    mode: "onSubmit",
  });

  const interests = watch("interests") ?? [];
  const photo = watch("photo");

  const isOnboarding = mode === "onboarding";

  // Update selected photo
  function changePhoto(file: File) {
    setValue("photo", file, {
      shouldValidate: true,
      shouldDirty: true,
    });

    setSubmitError("");
    setSuccess(false);
  }

  // Update interests
  function changeInterests(next: string[]) {
    setValue("interests", next, {
      shouldValidate: true,
      shouldDirty: true,
    });

    setSubmitError("");
    setSuccess(false);
  }

  // Submit form
  async function submit(values: MatchPreferences) {
    setSubmitError("");
    setSuccess(false);
    setProgress(0);

    try {
      await onSave(values, setProgress);

      if (!isOnboarding) {
        setSuccess(true);

        // Require a new photo on the next edit.
        reset({
          interests: values.interests,
        });
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to save profile"
      );
    }
  }

  return (
    <main
      className={
        isOnboarding
          ? "flex min-h-dvh flex-col bg-background"
          : "flex min-h-0 flex-1 flex-col bg-background"
      }
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">

        {/* Header */}
        <header className="flex items-center justify-center py-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isOnboarding
              ? "Share your interests"
              : "Edit your profile"}
          </h1>
        </header>

        {/* Form */}
        <form
          className="mt-4 flex flex-1 flex-col"
          onSubmit={handleSubmit(submit)}
          noValidate
        >
          <div className="space-y-7">
            <MatchPhotoUploader
              value={photo}
              initialPhotoUrl={initialPhotoUrl}
              onChange={changePhoto}
              error={errors.photo?.message}
              disabled={isSubmitting}
            />

            <InterestsInput
              value={interests}
              onChange={changeInterests}
              error={errors.interests?.message}
              disabled={isSubmitting}
            />

          </div>

          {/* Error */}
          {submitError && (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {submitError}
            </p>
          )}

          {/* Success */}
          {success && (
            <p
              role="status"
              className="mt-4 text-center text-sm text-green-700"
            >
              Profile updated successfully
            </p>
          )}

          {/* Submit */}
          <div className="mt-auto pt-8">

            <p className="mb-4 text-center text-xs text-zinc-500">
              {isOnboarding
                ? "Your photo will be shown to others."
                : "Your profile visibility remains unchanged."}
            </p>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f27356] font-semibold text-white transition hover:bg-[#e36248] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e36248] disabled:opacity-60"
            >
              {isSubmitting && (
                <LoaderCircle className="size-4 animate-spin" />
              )}

              {isSubmitting
                ? progress === 0
                  ? "Preparing photo..."
                  : progress < 100
                    ? `Uploading ${progress}%`
                    : "Saving profile..."
                : isOnboarding
                  ? "Find Matches"
                  : "Save Changes"}
            </button>

          </div>
        </form>
      </div>
    </main>
  );
}