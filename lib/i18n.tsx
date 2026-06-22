"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Lang = "ru" | "tj";

const STORAGE_KEY = "inclinic-lang";

const LABELS = {
  ru: {
    home: "Главная",
    booking: "Онлайн-запись",
    telegram: "Telegram поддержка",
    admin: "Панель управления",
    nav: "Навигация",
    tagline: "Медицина нового поколения",
    aboutTitle: "О клинике",
    aboutText:
      "InClinic — современная медицинская клиника, где каждый пациент получает профессиональную помощь, внимание и заботу.",
    aboutLine1: "Профессиональная медицинская помощь по всем направлениям",
    aboutLine2: "Онлайн-запись за 60 секунд — без звонков и ожидания",
    aboutLine3: "Современное оборудование и опытные специалисты",
    bookCta: "Записаться на приём",
    contactsTitle: "Контакты",
    address: "г. Душанбе, Таджикистан",
    dayMonFri: "Пн – Пт",
    daySat: "Суббота",
    daySun: "Воскресенье",
    closed: "Выходной",
    receiptTitle: "Ваша запись",
    receiptSubtitle: "Покажите этот чек в клинике",
    receiptCount: "запись",
    receiptCountMany: "записи",
    receiptShow: "Показать чек",
    receiptHide: "Скрыть чек",
    splashTagline: "Здоровье · Доверие · Профессионализм",
    closeMenu: "Закрыть",
    patient: "Пациент",
    phone: "Телефон",
    doctor: "Врач",
    service: "Услуга",
    datetime: "Дата и время",
    payment: "Оплата",
    paid: "Оплачено",
    unpaid: "Не оплачено — оплата в клинике",
    price: "Стоимость",
    receiptId: "Номер записи",
    somoni: "сомони",
    showAtClinic: "Предъявите при входе",
    bookingTitle: "Онлайн-запись",
    bookingSubtitle: "Сначала услуга → врач → дата → время → контакты",
    stepService: "Услуга",
    stepDoctor: "Врач",
    stepDate: "Дата",
    stepTime: "Время",
    stepSchedule: "Дата и время",
    stepContact: "Контакты",
    stepDone: "Готово",
    selectService: "Выберите услугу",
    selectServiceSub: "Выберите нужную медицинскую услугу",
    selectDoctor: "Выберите врача",
    selectDoctorSub: "Выберите специалиста для консультации",
    selectDate: "Выберите дату",
    selectDateSub: "Выберите удобный день для посещения",
    selectTime: "Выберите время",
    selectTimeSub: "Выберите доступный временной слот",
    yourData: "Ваши данные",
    yourDataSub: "Мы свяжемся с вами для подтверждения",
    back: "← Назад",
    continue: "Продолжить →",
    noDoctors: "По данной услуге нет доступных врачей",
    noSlots: "Нет свободных слотов",
    noSlotsSub: "На выбранную дату нет доступного времени для записи",
    pickOtherDate: "Выбрать другую дату",
    pickDateLabel: "Выберите дату приёма",
    selectWorkDay: "Выберите рабочий день врача",
    doctorWorks: "Работает",
    doctorNotDay: "Врач не принимает в выбранный день. Пожалуйста, выберите другую дату.",
    doctorNotWorkDay: "Врач не работает в этот день",
    yourBooking: "Ваша запись",
    firstName: "Имя",
    lastName: "Фамилия",
    firstNamePh: "Иван",
    lastNamePh: "Иванов",
    phonePh: "+992 XX XXX XX XX",
    confirmBooking: "Подтвердить запись →",
    submitting: "Отправка заявки...",
    pendingTitle: "Ожидает подтверждения",
    pendingSub: "Менеджер проверит заявку в Telegram. Статус обновится автоматически.",
    acceptedTitle: "Запись подтверждена!",
    acceptedSub: "Чек записи сохранён — покажите его в клинике",
    rejectedTitle: "Заявка отклонена",
    rejectedSub: "К сожалению, менеджер не смог подтвердить запись.",
    rejectionReason: "Причина",
    rescheduleTitle: "Выберите другое время",
    rescheduleSub: "На выбранные дату и время уже есть другая запись. Пожалуйста, выберите свободный слот.",
    pickNewSlot: "Выбрать другое время →",
    weekPrev: "Предыдущая неделя",
    weekNext: "Следующая неделя",
    dayOff: "Выходной",
    dayFull: "Нет мест",
    dayPast: "Прошло",
    slotsFree: "{n} сл.",
    slotBooked: "Занято",
    slotPast: "Прошло",
    slotAvailable: "Свободно",
    workHours: "Приём",
    pickDayFirst: "Выберите день в календаре выше",
    statusPending: "Ожидает подтверждения",
    statusAccepted: "Подтверждена",
    statusRejected: "Отклонена",
    successTitle: "Заявка отправлена!",
    successSub: "Чек записи сохранён — покажите его в клинике",
    successNote: "Чек исчезнет после дня приёма",
    receiptHeader: "ЧЕК ЗАПИСИ",
    toHome: "На главную →",
    loading: "Загрузка...",
    loadingPage: "Загрузка...",
    min: "мин",
    days: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] as const,
    errLoadServices: "Не удалось загрузить услуги",
    errLoadDoctors: "Не удалось загрузить врачей",
    errLoadSlots: "Не удалось загрузить доступные слоты",
    errFillFields: "Заполните все поля",
    errCreateBooking: "Ошибка создания записи",
    errNetwork: "Ошибка сети. Попробуйте ещё раз.",
    errPickTime: "Выберите время",
    openMenu: "Открыть меню",
    langLabel: "Выбор языка",
    themeLabel: "Режим оформления",
    themeDark: "Тёмный",
    themeLight: "Светлый",
  },
  tj: {
    home: "Асосӣ",
    booking: "Қабули онлайн",
    telegram: "Дастгирии Telegram",
    admin: "Панели идора",
    nav: "Навигатсия",
    tagline: "Тибби насли нав",
    aboutTitle: "Дар бораи клиника",
    aboutText:
      "InClinic — клиникаи муосири тиббӣ, ки ҳар бемор кӯмаки касбӣ, диққат ва ғамхориро мегирад.",
    aboutLine1: "Кӯмаки тиббии касбӣ дар ҳамаи самтҳо",
    aboutLine2: "Қабули онлайн дар 60 сония — бе занг ва интизорӣ",
    aboutLine3: "Таҷҳизоти муосир ва мутахассисони бо таҷриба",
    bookCta: "Қабул гирифтан",
    contactsTitle: "Тамос",
    address: "ш. Душанбе, Тоҷикистон",
    dayMonFri: "Дш – Ҷм",
    daySat: "Шанбе",
    daySun: "Якшанбе",
    closed: "Рӯзи истироҳат",
    receiptTitle: "Қабули шумо",
    receiptSubtitle: "Ин чекро дар клиника нишон диҳед",
    receiptCount: "қабул",
    receiptCountMany: "қабул",
    receiptShow: "Чекро нишон диҳед",
    receiptHide: "Чекро пинҳон кунед",
    splashTagline: "Саломатӣ · Эътимод · Касбият",
    closeMenu: "Пӯшидан",
    patient: "Бемор",
    phone: "Телефон",
    doctor: "Духтур",
    service: "Хизматрасонӣ",
    datetime: "Сана ва вақт",
    payment: "Пардохт",
    paid: "Пардохт шуд",
    unpaid: "Пардохт нашуда — дар клиника",
    price: "Нарх",
    receiptId: "Рақами қабул",
    somoni: "сомонӣ",
    showAtClinic: "Ҳангоми воридшавӣ нишон диҳед",
    bookingTitle: "Қабули онлайн",
    bookingSubtitle: "Аввал хизмат → духтур → сана → вақт → тамос",
    stepService: "Хизмат",
    stepDoctor: "Духтур",
    stepDate: "Сана",
    stepTime: "Вақт",
    stepSchedule: "Сана ва вақт",
    stepContact: "Тамос",
    stepDone: "Тайёр",
    selectService: "Хизматрасониро интихоб кунед",
    selectServiceSub: "Хизмати тиббии лозимаро интихоб кунед",
    selectDoctor: "Духтурро интихоб кунед",
    selectDoctorSub: "Мутахассисро барои машварат интихоб кунед",
    selectDate: "Санаро интихоб кунед",
    selectDateSub: "Рӯзи мувофиқро интихоб кунед",
    selectTime: "Вақтро интихоб кунед",
    selectTimeSub: "Вақти дастрасро интихоб кунед",
    yourData: "Маълумоти шумо",
    yourDataSub: "Барои тасдиқ бо шумо тамос мегирем",
    back: "← Бозгашт",
    continue: "Идома →",
    noDoctors: "Барои ин хизмат духтури дастрас нест",
    noSlots: "Вақти холӣ нест",
    noSlotsSub: "Барои ин сана вақти дастрас нест",
    pickOtherDate: "Санаи дигар интихоб кунед",
    pickDateLabel: "Санаи қабулро интихоб кунед",
    selectWorkDay: "Рӯзи кории духтурро интихоб кунед",
    doctorWorks: "Кораш",
    doctorNotDay: "Духтур дар ин рӯз қабул намекунад. Лутфан санаи дигар интихоб кунед.",
    doctorNotWorkDay: "Духтур дар ин рӯз кор намекунад",
    yourBooking: "Қабули шумо",
    firstName: "Ном",
    lastName: "Насаб",
    firstNamePh: "Али",
    lastNamePh: "Алиев",
    phonePh: "+992 XX XXX XX XX",
    confirmBooking: "Қабулро тасдиқ кунед →",
    submitting: "Ирсол карда мешавад...",
    pendingTitle: "Интизори тасдиқ",
    pendingSub: "Менеҷер дархостро дар Telegram месанҷад. Ҳолат худкор навсозӣ мешавад.",
    acceptedTitle: "Қабул тасдиқ шуд!",
    acceptedSub: "Чеки қабул нигоҳ дошта шуд — дар клиника нишон диҳед",
    rejectedTitle: "Дархост рад шуд",
    rejectedSub: "Мутаассифона, менеҷер қабулро тасдиқ накард.",
    rejectionReason: "Сабаб",
    rescheduleTitle: "Вақти дигар интихоб кунед",
    rescheduleSub: "Барои ин сана ва вақт қабули дигар вуҷуд дорад. Лутфан вақти холиро интихоб кунед.",
    pickNewSlot: "Вақти дигар интихоб кунед →",
    weekPrev: "Ҳафтаи қаблӣ",
    weekNext: "Ҳафтаи баъдӣ",
    dayOff: "Рӯзи истироҳат",
    dayFull: "Ҷой нест",
    dayPast: "Гузашта",
    slotsFree: "{n} вақт",
    slotBooked: "Банд",
    slotPast: "Гузашта",
    slotAvailable: "Холӣ",
    workHours: "Қабул",
    pickDayFirst: "Рӯзро дар тақвим интихоб кунед",
    statusPending: "Интизори тасдиқ",
    statusAccepted: "Тасдиқ шуд",
    statusRejected: "Рад шуд",
    successTitle: "Дархост фиристода шуд!",
    successSub: "Чеки қабул сабт шуд — дар клиника нишон диҳед",
    successNote: "Чек пас аз рӯзи қабул нест мешавад",
    receiptHeader: "ЧЕКИ ҚАБУЛ",
    toHome: "Ба асосӣ →",
    loading: "Бор шуда истодааст...",
    loadingPage: "Бор шуда истодааст...",
    min: "дақ",
    days: ["Яш", "Дш", "Сш", "Чш", "Пш", "Ҷм", "Шн"] as const,
    errLoadServices: "Хизматрасониҳоро бор карда нашуд",
    errLoadDoctors: "Духтуронро бор карда нашуд",
    errLoadSlots: "Вақтҳои дастрасро бор карда нашуд",
    errFillFields: "Ҳамаи майдонҳоро пур кунед",
    errCreateBooking: "Хатогии эҷоди қабул",
    errNetwork: "Хатогии шабака. Боз кӯшиш кунед.",
    errPickTime: "Вақтро интихоб кунед",
    openMenu: "Менюро кушодан",
    langLabel: "Интихоби забон",
    themeLabel: "Режими оформ",
    themeDark: "Торик",
    themeLight: "Равшан",
  },
} as const;

export type Labels = (typeof LABELS)["ru"];

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Labels;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === "ru" || saved === "tj") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "tj" ? "tg" : "ru";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang, t: LABELS[lang] as Labels }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function serviceName(
  s: { nameRu: string; nameTj?: string | null },
  lang: Lang,
): string {
  return lang === "tj" && s.nameTj ? s.nameTj : s.nameRu;
}

export function serviceDesc(
  s: { descriptionRu: string; descriptionTj?: string | null },
  lang: Lang,
): string {
  return lang === "tj" && s.descriptionTj ? s.descriptionTj : s.descriptionRu;
}

export function doctorName(
  d: { nameRu: string; nameTj?: string | null },
  lang: Lang,
): string {
  return lang === "tj" && d.nameTj ? d.nameTj : d.nameRu;
}

export function doctorSpecialty(
  d: { specialtyRu: string; specialtyTj?: string | null },
  lang: Lang,
): string {
  return lang === "tj" && d.specialtyTj ? d.specialtyTj : d.specialtyRu;
}
