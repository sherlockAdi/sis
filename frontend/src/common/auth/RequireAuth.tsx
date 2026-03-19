import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { me } from "../services/authApi";
import { clearAuthToken, getAuthToken } from "../services/tokenStorage";
import { useAuth } from "./AuthContext";

export default function RequireAuth() {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const token = getAuthToken();
  const { setMe } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!token) {
        setMe(null);
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const res = await me();
        setMe(res);
      } catch {
        clearAuthToken();
        setMe(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!ready) return <div>Loading...</div>;

  if (!getAuthToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
