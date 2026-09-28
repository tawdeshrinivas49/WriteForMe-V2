// frontend/src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@/store/useUser";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser, setToken } = useUser();

  useEffect(() => {
    const handleCallback = async () => {
      // Get all query params
      const success = searchParams.get("success");
      const id = searchParams.get("id");
      const state = searchParams.get("state");
      const scope = searchParams.get("scope");

      if (!success || !id || !state) {
        toast.error("Missing OAuth parameters");
        navigate("/login");
        return;
      }

      if (success !== "True") {
        toast.error("DigiLocker authentication failed");
        navigate("/login");
        return;
      }

      try {
        // Call backend with query params (GET)
        const response = await apiClient.get("/auth/digilocker/callback", {
          params: { success, id, state, scope },
        });
        const { token, user } = response.data;

        setToken(token);
        setUser(user);
        toast.success("Authentication successful!");
        navigate("/dashboard");
      } catch (error: any) {
        console.error("Callback error:", error);
        toast.error(error.response?.data?.error || "Authentication failed");
        navigate("/login");
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser, setToken]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-teal" />
    </div>
  );
};

export default AuthCallback;