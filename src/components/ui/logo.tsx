
"use client";

import React from "react";

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Bingkai Lingkaran Luar (Merah & Biru) */}
      <path 
        d="M20 50C20 33.4315 33.4315 20 50 20C66.5685 20 80 33.4315 80 50" 
        stroke="#2E3192" 
        strokeWidth="6" 
        strokeLinecap="round" 
      />
      <path 
        d="M80 50C80 66.5685 66.5685 80 50 80C33.4315 80 20 66.5685 20 50" 
        stroke="#ED1C24" 
        strokeWidth="6" 
        strokeLinecap="round" 
      />
      
      {/* Ikon Awan */}
      <path 
        d="M65 60C70.5228 60 75 55.5228 75 50C75 44.4772 70.5228 40 65 40C64.6544 40 64.3146 40.0175 63.9806 40.0514C61.9427 34.1951 56.4554 30 50 30C42.0673 30 35.419 36.4385 35.0189 44.2464C32.1856 45.4807 30 48.3396 30 51.6667C30 56.269 33.731 60 38.3333 60H65Z" 
        fill="#0071BC" 
      />
      
      {/* Rak Server di dalam Awan */}
      <rect x="42" y="42" width="4" height="12" rx="1" fill="white" />
      <rect x="48" y="42" width="4" height="12" rx="1" fill="white" />
      <rect x="54" y="42" width="4" height="12" rx="1" fill="white" />
    </svg>
  );
}
