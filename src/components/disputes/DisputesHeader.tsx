import React from "react";
import styles from "./DisputesHeader.module.css";
import ConnectButton from "../ConnectButton";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";

export const DisputesHeader: React.FC = () => {
  return (
    <div className={styles.header}>
      <img
        src="/images/icons/header-top.svg"
        alt="Header"
        className={styles.headerImage}
      />

      <div className="flex items-center gap-3">
        <ProfileButton />
        <ConnectButton />
      </div>
    </div>
  );
};

const ProfileButton = () => {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/profile")}
      className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-md"
      aria-label="Go to Profile"
    >
      <User className="w-5 h-5 text-[#1b1c23]" />
    </button>
  );
};
