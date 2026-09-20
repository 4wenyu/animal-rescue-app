import { AdoptCardGrid } from "@/src/components/home/AdoptCardGrid";
import { Hero } from "@/src/components/home/Hero";
import { HomeMatch } from "@/src/components/home/HomeMatch";
import { QuickActions } from "@/src/components/home/QuickActions";
import { SiteFooter } from "@/src/components/home/SiteFooter";
import { SiteNav } from "@/src/components/home/SiteNav";
import { Sponsors } from "@/src/components/home/Sponsors";
import { TodayAnimal } from "@/src/components/home/TodayAnimal";
import { animalOfTheDay, animalOfTomorrow } from "@/lib/animalOfTheDay";
import { getPublicRoster } from "@/lib/roster";

export default async function PublicHomePage() {
  const all = await getPublicRoster();
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
