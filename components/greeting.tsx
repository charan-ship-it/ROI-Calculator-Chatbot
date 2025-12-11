"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export const Greeting = () => {
  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col items-center justify-center text-center px-4 md:mt-16 md:px-8"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex justify-center"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        <Image
          alt="AI Sales Agent Joy"
          className="rounded-full"
          height={80}
          src="/images/joy-avatar.png"
          unoptimized
          width={80}
        />
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 font-semibold text-lg md:text-xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        Welcome to AI Xccelerate's AI ROI Calculator
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-sm text-zinc-500 md:text-base"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.7 }}
      >
        I'm AI Sales Agent Joy! Start Your AI Savings Estimate! Our 5-minute ROI calculator uses a quick, 8–14 question assessment (5–10 min) to generate a comprehensive report detailing tailored automation and custom AI cost savings for your industry.
      </motion.div>
    </div>
  );
};
