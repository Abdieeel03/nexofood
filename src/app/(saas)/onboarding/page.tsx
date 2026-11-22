import React from "react";
import type { Metadata } from "next";
import { OnboardingFlow } from "@/modules/onboarding/components/OnboardingFlow";

export const metadata: Metadata = {
  title: "Configurar restaurante",
  description: "Activa tu suscripción y crea tu restaurante en NexoFood.",
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
