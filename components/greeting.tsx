"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { BusinessFunction } from "./business-function-selector";

type AgentConfig = {
  avatar: string;
  name: string;
  subheading: string;
};

const AGENT_CONFIG: Record<BusinessFunction, AgentConfig> = {
  "AI Accelerate": {
    avatar: "/images/joy-avatar.png",
    name: "AI Sales Agent Joy",
    subheading:
      "I'm AI Sales Agent Joy! Start Your AI Savings Estimate! Our 5-minute ROI calculator uses a quick, 8–14 question assessment (5–10 min) to generate a comprehensive report detailing tailored automation and custom AI cost savings for your industry.",
  },
  Marketing: {
    avatar: "/images/agent-jules.png",
    name: "AI Marketing Agent Jules",
    subheading:
      "I am AI Marketing Agent Jules! Start Your AI Savings Estimate! Our 5-minute ROI calculator uses a quick, 8–14 question assessment (5–10 min) to generate a comprehensive report detailing tailored automation and custom AI cost savings for your industry.",
  },
  Sales: {
    avatar: "/images/joy-avatar.png",
    name: "AI Sales Agent Joy",
    subheading:
      "I'm AI Sales Agent Joy! Start Your AI Savings Estimate! Our 5-minute ROI calculator uses a quick, 8–14 question assessment (5–10 min) to generate a comprehensive report detailing tailored automation and custom AI cost savings for your industry.",
  },
  "Customer Success": {
    avatar: "/images/agent-george.png",
    name: "AI Customer Success Agent George",
    subheading:
      "I am AI Customer Success Agent George! Start Your AI Savings Estimate! Our 5-minute ROI calculator uses a quick, 8–14 question assessment (5–10 min) to generate a comprehensive report detailing tailored automation and custom AI cost savings for your industry.",
  },
  Operations: {
    avatar: "/images/agent-lucy.png",
    name: "AI Operations Agent Lucy",
    subheading:
      "I am AI Operations Agent Lucy! Start Your AI Savings Estimate! Our 5-minute ROI calculator uses a quick, 8–14 question assessment (5–10 min) to generate a comprehensive report detailing tailored automation and custom AI cost savings for your industry.",
  },
  Finance: {
    avatar: "/images/agent-michael.png",
    name: "AI Finance Agent Michael",
    subheading:
      "I am AI Finance Agent Michael! Start Your AI Savings Estimate! Our 5-minute ROI calculator uses a quick, 8–14 question assessment (5–10 min) to generate a comprehensive report detailing tailored automation and custom AI cost savings for your industry.",
  },
  HR: {
    avatar: "/images/agent-donna.png",
    name: "AI HR Agent Donna",
    subheading:
      "I am AI HR Agent Donna! Start Your AI Savings Estimate! Our 5-minute ROI calculator uses a quick, 8–14 question assessment (5–10 min) to generate a comprehensive report detailing tailored automation and custom AI cost savings for your industry.",
  },
};

type GreetingProps = {
  businessFunction?: BusinessFunction;
};

export const Greeting = ({
  businessFunction = "AI Accelerate",
}: GreetingProps) => {
  const config = AGENT_CONFIG[businessFunction];

  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col items-center justify-center px-4 text-center md:mt-16 md:px-8"
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
          alt={config.name}
          className="rounded-full"
          height={80}
          src={config.avatar}
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
        {config.subheading}
      </motion.div>
    </div>
  );
};
