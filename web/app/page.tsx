import HomeClient from "./HomeClient";
import { ALL_INSTITUTIONS } from "@/lib/localData";

interface HomeProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

/** ALL_INSTITUTIONS is static, bundled at build time — read it directly here
 * instead of round-tripping through /api/institutions on every client mount. */
export default async function Home({ searchParams }: HomeProps) {
  const { q, page } = await searchParams;
  const parsedPage = page ? Number(page) : NaN;
  const initialPage = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : undefined;
  return <HomeClient initialInstitutions={ALL_INSTITUTIONS} initialQuery={q} initialPage={initialPage} />;
}
