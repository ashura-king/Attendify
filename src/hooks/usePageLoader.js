/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const usePageLoader = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500); // adjust delay
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return loading;
};

export default usePageLoader;