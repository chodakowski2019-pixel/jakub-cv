import { redirect } from "next/navigation";

// 26.10 (USER_001): zakładka „Rozmowa, którą masz jutro” usunięta. Stary adres prowadzi do rozmowy.
export default function BrunoJutroPage() {
  redirect("/bruno/rozmowa");
}
