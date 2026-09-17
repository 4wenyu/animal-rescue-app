// Home page — lean Server Component. The static roster is imported
// server-side and passed down as props; locale dictionaries are narrowed
// per island (see src/components/home/home-strings.ts), so dogs.json and
// the full locale files never enter the client bundle.
import dogs from "../data/dogs.json";
import { AdoptCardGrid } from "@/src/components/home/AdoptCardGrid";
import { Hero } from "@/src/components/home/Hero";
import { HomeMatch } from "@/src/components/home/HomeMatch";
import { QuickActions } from "@/src/components/home/QuickActions";
import { SiteFooter } from "@/src/components/home/SiteFooter";
import { SiteNav } from "@/src/components/home/SiteNav";
import { Sponsors } from "@/src/components/home/Sponsors";
import { TodayAnimal } from "@/src/components/home/TodayAnimal";
import type { Dog } from "@/src/components/home/types";
import { animalOfTheDay, animalOfTomorrow } from "@/lib/animalOfTheDay";

export default function PublicHomePage() {
  const all = dogs as Dog[];
  const adoptable = all.filter(
    (d) => d.euthanasia_risk_status !== "IMMEDIATE_BEHAVIORAL"
  );
  const behavioralReviewCount = all.filter(
    (d) => d.euthanasia_risk_status === "IMMEDIATE_BEHAVIORAL"
  ).length;
  const today = animalOfTheDay(adoptable);
  const tomorrow = animalOfTomorrow(adoptable);

  return (
    <div id="main-content" className="min-h-screen font-sans">
      <SiteNav />
      <Hero featured={today ?? adoptable[0] ?? null} />
      {today ? <TodayAnimal dog={today} tomorrowBreed={tomorrow?.breed} /> : null}
      <AdoptCardGrid dogs={adoptable} excludedCount={behavioralReviewCount} />
      <HomeMatch dogs={adoptable} />
      <Sponsors />
      <QuickActions />
      <SiteFooter />
    </div>
  );
}
