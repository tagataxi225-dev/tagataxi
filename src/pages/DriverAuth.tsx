import { useEffect } from "react";
import { DriverLogin } from "@/components/auth/DriverLogin";
import { autoUpdateService } from "@/services/AutoUpdateService";

const DriverAuth = () => {
  useEffect(() => {
    localStorage.removeItem('kwenda_signing_out');
    autoUpdateService.pause();
    return () => autoUpdateService.resume();
  }, []);

  return <DriverLogin />;
};

export default DriverAuth;
