import dogs from "../../data/dogs.json";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { DashboardView } from "@/src/components/dashboard/DashboardView";
import type { Dog } from "@/src/components/home/types";
import { animalOfTheDay, animalOfTomorrow } from "@/lib/animalOfTheDay";

export default async function DashboardPage() {
  const session = await auth();
  const roster = dogs as Dog[];
  const reviewCount = roster.filter((d) => d.medicalStatus === "Needs Review").length;
  const displayName = session?.user?.name?.split(" ")[0] ?? "";
  const role = (session?.user as { role?: string } | undefined)?.role;
  const staff = role === "STAFF" || role === "ADMIN";
  const todayDog = animalOfTheDay(roster);
  const tomorrow = animalOfTomorrow(roster);

  return (
    <DashboardView
      displayName={displayName}
      dogs={roster}
      reviewCount={reviewCount}
      staff={staff}
      todayDog={todayDog}
      tomorrowBreed={tomorrow?.breed ?? ""}
    />
  );
}
