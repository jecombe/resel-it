import React from "react";

const Loading: React.FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-black/85 flex flex-col justify-center items-center z-[9999]">
      {/* Spinner */}
      <div className="w-16 h-16 border-6 border-indigo-500 border-t-[#1b1c26] rounded-full animate-spin mb-4"></div>
      {/* Message */}
      <p className="text-indigo-200 text-lg">{message}</p>
    </div>
  );
};

export default Loading;
