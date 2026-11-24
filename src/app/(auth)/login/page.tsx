import { redirect } from "next/navigation";

interface LoginRedirectPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginRedirectPage({
  searchParams,
}: LoginRedirectPageProps) {
  const sp = await searchParams;
  const qs = new URLSearchParams();

  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") {
      qs.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        qs.append(key, item);
      }
    }
  }

  const queryString = qs.toString();
  redirect(queryString ? `/?${queryString}` : "/");
}
