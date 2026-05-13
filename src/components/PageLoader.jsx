import attendifyLogo from "../assets/images/attendify.png";

const PageLoader = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50 gap-4">
      <img src={attendifyLogo} alt="Attendify" className="w-24 h-24 animate-pulse" />
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default PageLoader;