"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const PinContainer = ({
  children,
  title,
  href,
  className,
  containerClassName,
}) => {
  const [transform, setTransform] = useState(
    "translate(-50%,-50%) rotateX(0deg)"
  );

  const onMouseEnter = () =>
    setTransform("translate(-50%,-50%) rotateX(40deg) scale(0.8)");
  const onMouseLeave = () =>
    setTransform("translate(-50%,-50%) rotateX(0deg) scale(1)");

  return (
    <Link
      className={cn(
        "relative group/pin z-50 cursor-pointer",
        containerClassName
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      href={href || "/"}
    >
      <div
        style={{
          perspective: "1000px",
          transform: "rotateX(70deg) translateZ(0deg)",
        }}
        className="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2"
      >
        <div
          style={{ transform }}
          className="absolute left-1/2 p-4 top-1/2 flex justify-start items-start rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] bg-[#020D1F] border border-[rgba(0,229,255,0.12)] group-hover/pin:border-[rgba(0,229,255,0.32)] transition duration-700 overflow-hidden"
        >
          {/* Subtle top glow on hover */}
          <div className="absolute top-0 inset-x-0 h-16 opacity-0 group-hover/pin:opacity-100 transition-opacity duration-500 pointer-events-none rounded-t-2xl"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.1), transparent 70%)" }}
          />
          <div className={cn("relative z-50", className)}>{children}</div>
        </div>
      </div>
      <PinPerspective title={title} href={href} />
    </Link>
  );
};

export const PinPerspective = ({ title, href }) => {
  return (
    <motion.div className="pointer-events-none w-96 h-80 flex items-center justify-center opacity-0 group-hover/pin:opacity-100 z-[60] transition duration-500">
      <div className="w-full h-full -mt-7 flex-none inset-0">
        {/* Floating label pill */}
        <div className="absolute top-0 inset-x-0 flex justify-center">
          <span className="relative flex items-center gap-1.5 z-10 rounded-full bg-[#00031C] py-1 px-4 ring-1 ring-[rgba(0,229,255,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" style={{ boxShadow: "0 0 6px rgba(0,229,255,0.8)" }} />
            <span className="relative z-20 text-[#00E5FF] text-[11px] font-poppins font-semibold tracking-wide">
              {title}
            </span>
            <span className="absolute -bottom-0 left-[1.125rem] h-px w-[calc(100%-2.25rem)] bg-gradient-to-r from-[rgba(0,229,255,0)] via-[rgba(0,229,255,0.7)] to-[rgba(0,229,255,0)] opacity-50" />
          </span>
        </div>

        {/* Ripple rings */}
        <div
          style={{ perspective: "1000px", transform: "rotateX(70deg) translateZ(0)" }}
          className="absolute left-1/2 top-1/2 ml-[0.09375rem] mt-4 -translate-x-1/2 -translate-y-1/2"
        >
          {[0, 2, 4].map((delay) => (
            <motion.div
              key={delay}
              initial={{ opacity: 0, scale: 0, x: "-50%", y: "-50%" }}
              animate={{ opacity: [0, 1, 0.5, 0], scale: 1, z: 0 }}
              transition={{ duration: 6, repeat: Infinity, delay }}
              className="absolute left-1/2 top-1/2 h-[11.25rem] w-[11.25rem] rounded-full shadow-[0_8px_16px_rgb(0_0_0/0.4)]"
              style={{ background: "rgba(0,229,255,0.05)" }}
            />
          ))}
        </div>

        {/* Pin beam */}
        <motion.div className="absolute right-1/2 bottom-1/2 bg-gradient-to-b from-transparent to-[#00E5FF] translate-y-[14px] w-px h-20 group-hover/pin:h-40 blur-[2px]" />
        <motion.div className="absolute right-1/2 bottom-1/2 bg-gradient-to-b from-transparent to-[#00E5FF] translate-y-[14px] w-px h-20 group-hover/pin:h-40" />
        <motion.div className="absolute right-1/2 translate-x-[1.5px] bottom-1/2 bg-[#00E5FF] translate-y-[14px] w-[4px] h-[4px] rounded-full z-40 blur-[3px]" />
        <motion.div className="absolute right-1/2 translate-x-[0.5px] bottom-1/2 bg-[#00E5FF] translate-y-[14px] w-[2px] h-[2px] rounded-full z-40" />
      </div>
    </motion.div>
  );
};
