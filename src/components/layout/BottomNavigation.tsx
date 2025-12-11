"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Home, Gavel } from "lucide-react";

export const BottomNavigation = () => {
  const pathname = usePathname();

  // Active state logic
  const isHome = pathname === "/" || pathname === "/disputes";
  const isVotes =
    pathname?.startsWith("/my-votes") ||
    pathname?.startsWith("/vote") ||
    pathname?.startsWith("/reveal");
  const isProfile = pathname?.startsWith("/profile");

  // Nav Item Styles
  const navItemClass = (isActive: boolean) =>
    `flex flex-col items-center justify-center gap-1 transition-all duration-300 relative group ${
      isActive ? "text-[#1b1c23]" : "text-gray-400 hover:text-[#8c8fff]"
    }`;

  // Indicator Dot
  const ActiveDot = () => (
    <span className="absolute -bottom-1.5 w-1 h-1 bg-[#1b1c23] rounded-full animate-in fade-in zoom-in duration-200" />
  );

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100]">
      <div className="flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm border border-gray-100/50 rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all hover:shadow-[0_6px_25px_rgb(0,0,0,0.1)]">
        {/* Disputes / Home */}
        <Link href="/disputes" className={navItemClass(isHome)}>
          <div
            className={`p-2 transition-transform duration-200 ${isHome ? "scale-105" : "group-hover:scale-105"}`}
          >
            <Home
              className={`w-5 h-5 ${isHome ? "stroke-[2.5px] fill-gray-100" : "stroke-2"}`}
            />
          </div>
          {isHome && <ActiveDot />}
        </Link>

        {/* Vertical Divider */}
        <div className="w-[1px] h-4 bg-gray-200 mx-2" />

        {/* My Votes (Central Action) */}
        <Link href="/my-votes" className={navItemClass(isVotes)}>
          <div
            className={`p-2 transition-transform duration-200 ${isVotes ? "scale-105" : "group-hover:scale-105"}`}
          >
            <Gavel
              className={`w-5 h-5 ${isVotes ? "stroke-[2.5px] fill-gray-100" : "stroke-2"}`}
            />
          </div>
          {isVotes && <ActiveDot />}
        </Link>

        {/* Vertical Divider */}
        <div className="w-[1px] h-4 bg-gray-200 mx-2" />

        {/* Profile */}
        <Link href="/profile" className={navItemClass(isProfile)}>
          <div
            className={`p-2 transition-transform duration-200 ${isProfile ? "scale-105" : "group-hover:scale-105"}`}
          >
            <User
              className={`w-5 h-5 ${isProfile ? "stroke-[2.5px] fill-gray-100" : "stroke-2"}`}
            />
          </div>
        </Link>
      </div>
    </div>
  );
};
