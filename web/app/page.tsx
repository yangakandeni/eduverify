import HomeClient from "./HomeClient";
import { getAllInstitutions } from "@/lib/institutions";

interface HomeProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

/** getAllInstitutions() reads the bundled local array directly unless USE_EXTERNAL_API is
 * set, in which case it fetches from eduverify-api instead — either way, fetched once here
 * server-side rather than round-tripping through /api/institutions on every client mount. */
export default async function Home({ searchParams }: HomeProps) {
  const { q, page } = await searchParams;
  const parsedPage = page ? Number(page) : NaN;
  const initialPage = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : undefined;
  const institutions = await getAllInstitutions();
  return <HomeClient initialInstitutions={institutions} initialQuery={q} initialPage={initialPage} />;
}
