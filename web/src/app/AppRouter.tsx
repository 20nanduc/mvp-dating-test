import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { SignInPage } from "@/features/auth/pages/SignInPage";
import { CreateAccountPage } from "@/features/onboarding/pages/CreateAccountPage";
import { FindMatchRoute } from "@/app/routes/FindMatchRoute";
import { OnboardingGuard } from "@/app/routes/OnBoardingGuard";
import { DashboardLayout } from "@/app/layouts/DashboardLayout";
import { ProtectedRoute } from "@/app/routes/ProtectedRouter";
import { DiscoverPage } from "@/features/discovery/pages/DiscoverPage";
import { RequestsPage } from "@/features/requests/pages/RequestsPage";
import { ChatsPage } from "@/features/chats/pages/ChatsPage";
import { ChatRoomPage } from "@/features/chats/room/ChatRoomPage";
import { ConnectionRequestSuccessPage } from "@/features/discovery/pages/RequestSuccessPage";

function InitialRedirect() {
  return <Navigate to="/sign-in" replace />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<InitialRedirect />} />

        <Route path="/sign-in" element={<SignInPage />} />

        <Route element={<ProtectedRoute />}>

          {/* Step 1: Create Account */}
          <Route element={<OnboardingGuard step="account" />}>
            <Route
              path="/onboarding/account"
              element={<CreateAccountPage />}
            />
          </Route>

          {/* Step 2: Match Preferences */}
          <Route element={<OnboardingGuard step="match" />}>
            <Route
              path="/onboarding/match"
              element={<FindMatchRoute mode="onboarding" />}
            />
          </Route>

          {/* <Route element={<OnboardingGuard step="discover" />}>
            <Route
              path="/profile/edit"
              element={<FindMatchRoute mode="edit" />}
            />
          </Route> */}

          {/* Dashboard */}
          <Route element={<OnboardingGuard step="discover" />}>

            <Route
              path="/app/chats/:connectionId"
              element={<ChatRoomPage />}
            />

            <Route path="/app" element={<DashboardLayout />}>
              <Route
                index
                element={<Navigate to="discover" replace />}
              />

              <Route
                path="discover"
                element={<DiscoverPage />}
              >
                <Route
                  path="sent"
                  element={<ConnectionRequestSuccessPage />}
                />
              </Route>

              <Route
                path="requests"
                element={<RequestsPage />}
              />

              <Route
                path="chats"
                element={<ChatsPage />}
              />
              <Route
                path="profile"
                element={<FindMatchRoute mode="edit" />}
              />
            </Route>

          </Route>
        </Route>
        <Route path="*" element={<InitialRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}