import HomeClient from "./HomeClient";
import { ALL_INSTITUTIONS } from "@/lib/localData";

/** ALL_INSTITUTIONS is static, bundled at build time — read it directly here
 * instead of round-tripping through /api/institutions on every client mount. */
export default function Home() {
  return <HomeClient initialInstitutions={ALL_INSTITUTIONS} />;
}
