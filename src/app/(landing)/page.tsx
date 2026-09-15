"use client";

import React from "react";
import { Hero } from "@/modules/landing/components/Hero";
import { SocialProof } from "@/modules/landing/components/SocialProof";
import { ImpactStats } from "@/modules/landing/components/ImpactStats";
import { Features } from "@/modules/landing/components/Features";
import { Pricing } from "@/modules/landing/components/Pricing";
import { Testimonials } from "@/modules/landing/components/Testimonials";
import { FinalCTA } from "@/modules/landing/components/FinalCTA";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <SocialProof />
      <ImpactStats />
      <Features />
      <Pricing />
      <Testimonials />
      <FinalCTA />
    </>
  );
}
