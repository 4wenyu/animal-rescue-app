import type { Metadata } from "next";
import dogs from "../../data/dogs.json";
import { SiteFooter } from "@/src/components/home/SiteFooter";
import { SiteNav } from "@/src/components/home/SiteNav";
import { TodayAnimal } from "@/src/components/home/TodayAnimal";
import type { Dog } from "@/src/components/home/types";
import {
  animalOfTheDay,
  animalOfTomorrow,
} from "@/lib/animalOfTheDay";

export async function generateMetadata(): Promise<Metadata> {
  const dog = animalOfTheDay(dogs as Dog[]);
  const name = dog?.name ?? "today's animal";
  return {
    title: `Meet ${name} — today's kennel introduction`,
    description: `Everyone who opens RescueHub today meets ${name}. Send this page to someone who might have a home.`,
  };
}

export default function TodayPage() {
  const roster = dogs as Dog[];
  const today = animalOfTheDay(roster);
  const tomorrow = animalOfTomorrow(roster);

  return (
    <div id="main-content" className="min-h-screen font-sans">
      <SiteNav />
      <div className="pt-10">
        {today ? (
          <TodayAnimal dog={today} tomorrowBreed={tomorrow?.breed} />
        ) : (
          <p className="mx-auto max-w-6xl px-6 py-16 text-sm text-slate-600">
            No animals are on the public list today.
          </p>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
