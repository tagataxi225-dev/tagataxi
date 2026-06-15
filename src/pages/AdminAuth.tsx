import { useEffect } from "react";
import { AdminLogin } from "@/components/auth/AdminLogin";
import { autoUpdateService } from "@/services/AutoUpdateService";

const AdminAuth = () => {
  useEffect(() => {
    localStorage.removeItem('kwenda_signing_out');
    autoUpdateService.pause();
    return () => autoUpdateService.resume();
  }, []);

  return <AdminLogin />;
};

export default AdminAuth;