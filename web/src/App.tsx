import { AuthProvider } from "@/features/auth/context/AuthProvider";
import { AppRouter } from "@/app/AppRouter";

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}