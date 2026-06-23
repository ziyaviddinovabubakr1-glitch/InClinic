export type DoctorGender = "female" | "male";

const FEMALE_PATRONYMIC = /(овна|евна|ична|кызы|qizi|кизи)$/iu;
const MALE_PATRONYMIC = /(ович|евич|огли|оғли|уулу|уулуу)$/iu;
const FEMALE_SURNAME = /(ова|ева|ина|ая|зода)$/iu;
const MALE_SURNAME = /(ов|ев|ин|ский|цкий)$/iu;

const FEMALE_FIRST_NAMES = new Set([
  "зарина", "мадина", "фарида", "гульнара", "нозия", "сабина", "динара", "алия",
  "анна", "мария", "елена", "ольга", "наталья", "татьяна", "ирина", "светлана",
  "екатерина", "людмила", "валентина", "галина", "надежда", "любовь", "вера",
  "раиса", "тамара", "нина", "валерия", "виктория", "кристина", "диана", "жанна",
  "инна", "лариса", "марина", "оксана", "полина", "регина", "софия", "ульяна",
  "юлия", "яна", "нилуфар", "мукаддас", "шоира", "фотима", "ситора", "муhabbat",
  "parvina", "dilbar", "munira", "saodat", "shahlo", "yulduz", "kamola", "nigora",
  "feruza", "dilorom", "mavjuda", "nozima", "sabohat", "tohira", "zuhro",
]);

/** Infer doctor gender from RU/TJ full name (patronymic is most reliable). */
export function inferDoctorGender(fullName?: string | null): DoctorGender {
  const name = (fullName ?? "").trim();
  if (!name) return "male";

  const parts = name.split(/\s+/).filter(Boolean);
  const patronymic = parts[2] ?? "";
  const surname = parts[0] ?? "";
  const first = (parts[1] ?? parts[0] ?? "").toLowerCase().replace(/[ъь]/g, "");

  if (patronymic && FEMALE_PATRONYMIC.test(patronymic)) return "female";
  if (patronymic && MALE_PATRONYMIC.test(patronymic)) return "male";

  if (FEMALE_SURNAME.test(surname)) return "female";
  if (MALE_SURNAME.test(surname)) return "male";

  if (FEMALE_FIRST_NAMES.has(first)) return "female";
  if (/[ая]$/i.test(first) && first.length > 3) return "female";

  return "male";
}

export function getDoctorAvatarAsset(fullName?: string | null): string {
  return inferDoctorGender(fullName) === "female"
    ? "/icons/medical/doctor-female.png"
    : "/icons/medical/doctor-male.png";
}
