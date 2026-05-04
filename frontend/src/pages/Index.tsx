import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate("/signin"); }, [navigate]);
  return null;
};

export default Index;
