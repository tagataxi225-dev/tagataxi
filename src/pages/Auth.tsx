import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { UnifiedAuthPage } from "@/components/auth/UnifiedAuthPage";
import { autoUpdateService } from "@/services/AutoUpdateService";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Si ?ref= est présent, rediriger vers l'inscription avec le code
    const refCode = searchParams.get('ref');
    if (refCode) {
      navigate(`/app/register?ref=${refCode}`, { replace: true });
      return;
    }

    localStorage.removeItem('kwenda_signing_out');
    localStorage.removeItem('kwenda_login_in_progress');
    autoUpdateService.pause();
    return () => autoUpdateService.resume();
  }, [searchParams, navigate]);

  return <UnifiedAuthPage />;
};

export default Auth;