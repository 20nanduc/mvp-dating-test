import { useNavigate } from "react-router";

import { AccountDetailsForm } from "../components/AccountDetailsForm";
import type { AccountDetails } from "../schemas/account.schema";
import { useCreateAccount } from "../hooks/useCreateAccount";

export function CreateAccountPage() {
  const navigate = useNavigate();
  const { createAccount, error } = useCreateAccount();

  async function handleSave(values: AccountDetails) {
    const success = await createAccount(values);

    if (!success) return;

    navigate("/onboarding/match", { replace: true });
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-8 pt-6">

        <header className="flex items-center justify-center py-4">
          <div className="text-3xl font-bold tracking-tight text-foreground">
            Create an account
          </div>
        </header>

        <AccountDetailsForm onSubmit={handleSave} />

        {error && (
          <p
            role="alert"
            className="mt-4 text-center text-sm text-red-500"
          >
            {error}
          </p>
        )}

      </div>
    </main>
  );
}