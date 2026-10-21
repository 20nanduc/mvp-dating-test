import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { accountSchema, GENDER_OPTIONS, latestEligibleDob, type AccountDetails } from "../schemas/account.schema";
import { INDIAN_STATES_AND_UTS } from "../constants/indianLocations";

interface Props {
  defaultValues?: AccountDetails;
  onSubmit: (details: AccountDetails) => Promise<void>;
}

export function AccountDetailsForm({ defaultValues, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AccountDetails>({
    resolver: zodResolver(accountSchema),
    defaultValues: defaultValues ?? {
      fullName: "", dateOfBirth: "", gender: undefined, state: undefined,
    },
    mode: "onSubmit",
  });

  return (
    <div className="mx-auto w-full max-w-2xl  sm:p-10">
      <form className="flex flex-col" noValidate onSubmit={handleSubmit(onSubmit)}>
        {/* Grid layout for desktop, stacked for mobile */}
        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">

          {/* Full Name - Spans both columns */}
          <div className="sm:col-span-2">
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Your name
            </label>
            <input
              id="fullName"
              placeholder="What should we call you?"
              autoComplete="name"
              maxLength={60}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50/50 p-3 text-gray-900 transition-colors placeholder:text-gray-400 focus:border-[#f27356] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f27356]/20 sm:text-sm"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : "name-hint"}
              {...register("fullName")}
            />
            {!errors.fullName && (
              <p id="name-hint" className="mt-2 text-xs text-gray-500">This is how people will see you when you share a moment.</p>
            )}
            {errors.fullName && <p id="fullName-error" role="alert" className="mt-2 text-xs font-medium text-red-500">{errors.fullName.message}</p>}
          </div>

          {/* Date of Birth */}
          <div>
            <label htmlFor="dateOfBirth" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Date of birth
            </label>
            <input
              id="dateOfBirth"
              type="date"
              max={latestEligibleDob()}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50/50 p-3 text-gray-900 transition-colors focus:border-[#f27356] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f27356]/20 sm:text-sm"
              aria-invalid={!!errors.dateOfBirth}
              aria-describedby={errors.dateOfBirth ? "dateOfBirth-error" : "age-hint"}
              {...register("dateOfBirth")}
            />
            {!errors.dateOfBirth && (
              <p id="age-hint" className="mt-2 text-xs text-gray-500">You must be 18 or older.</p>
            )}
            {errors.dateOfBirth && <p id="dateOfBirth-error" role="alert" className="mt-2 text-xs font-medium text-red-500">{errors.dateOfBirth.message}</p>}
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Gender
            </label>
            <select
              id="gender"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50/50 p-3 text-gray-900 transition-colors focus:border-[#f27356] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f27356]/20 sm:text-sm"
              aria-invalid={!!errors.gender}
              aria-describedby={errors.gender ? "gender-error" : undefined}
              defaultValue={defaultValues?.gender ?? ""}
              {...register("gender")}
            >
              <option value="" disabled>Select gender</option>
              {GENDER_OPTIONS.map(gender => <option key={gender} value={gender}>{gender}</option>)}
            </select>
            {errors.gender && <p id="gender-error" role="alert" className="mt-2 text-xs font-medium text-red-500">{errors.gender.message}</p>}
          </div>

          {/* State - Spans both columns */}
          <div className="sm:col-span-2">
            <label htmlFor="state" className="mb-1.5 block text-sm font-semibold text-gray-700">
              State or union territory
            </label>
            <select
              id="state"
              className="block w-full rounded-lg border border-gray-300 bg-gray-50/50 p-3 text-gray-900 transition-colors focus:border-[#f27356] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f27356]/20 sm:text-sm"
              aria-invalid={!!errors.state}
              aria-describedby={errors.state ? "state-error" : undefined}
              defaultValue={defaultValues?.state ?? ""}
              {...register("state")}
            >
              <option value="" disabled>Select your state / UT</option>
              {INDIAN_STATES_AND_UTS.map(state => <option key={state} value={state}>{state}</option>)}
            </select>
            {errors.state && <p id="state-error" role="alert" className="mt-2 text-xs font-medium text-red-500">{errors.state.message}</p>}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-10 pt-6">
           <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#f27356] font-semibold text-white transition hover:bg-[#e36248] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e36248] disabled:opacity-60"
            >
              {(isSubmitting) && <LoaderCircle className="size-4 animate-spin" />}
               Create Account
            </button>
        </div>
      </form>
    </div>
  );
}