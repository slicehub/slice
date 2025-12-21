import React from "react";
import ConnectButton from "../ConnectButton";

export const DisputesHeader: React.FC = () => {
  return (
    <div className="flex justify-between items-center w-full pt-[34px] px-5 overflow-hidden box-border">
      <img
        src="/images/icons/header-top.svg"
        alt="Header"
        className="h-12 w-12 object-contain block shrink max-w-[60%]"
      />

      <div className="flex items-center gap-3">
        <ConnectButton />
      </div>
    </div>
  );
};
