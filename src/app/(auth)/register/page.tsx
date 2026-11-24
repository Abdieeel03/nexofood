import React from "react";
import type { Metadata } from "next";
import { RegisterForm } from "@/modules/auth/components/RegisterForm";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description:
    "Crea tu cuenta en NexoFood para lanzar tu restaurante y storefront online.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
