/** Причины отклонения, при которых клиенту предлагают другую дату/время */
const SLOT_CONFLICT_PATTERNS = [
  /нет\s*мест/i,
  /мест\s*нет/i,
  /нет\s*свобод/i,
  /свободн\w*\s*нет/i,
  /занят/i,
  /занят[аоы]/i,
  /врач\s*занят/i,
  /слот\s*занят/i,
  /время\s*занят/i,
  /уже\s*запис/i,
  /другой\s*пациент/i,
  /другая\s*запись/i,
  /переполн/i,
  /другое\s*время/i,
  /другую\s*дату/i,
  /выберите\s*друго/i,
  /поменяйте\s*время/i,
  /на\s*это\s*время/i,
  /в\s*это\s*время\s*занят/i,
  /ҷой\s*нест/i,
  /банд\s*аст/i,
  /вақт\s*банд/i,
];

export function isSlotConflictRejection(reason: string | null | undefined): boolean {
  if (!reason?.trim()) return false;
  const text = reason.trim();
  return SLOT_CONFLICT_PATTERNS.some((re) => re.test(text));
}
