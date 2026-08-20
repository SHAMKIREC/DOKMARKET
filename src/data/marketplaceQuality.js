export const offerQuality = {
  "dosudebka-official": {
    version: "1.0",
    reviewedAt: "2026-08-20",
    reviewLabel: "Проверено перед публикацией",
    warnings: [
      "Проверьте название работодателя, адрес, сумму долга и даты перед скачиванием.",
      "Если спор уже дошёл до увольнения, суда или есть риск пропустить срок обращения, лучше подключить специалиста.",
    ],
    relatedIds: ["labor-inspection-template", "labor-lawyer-service"],
    nextStep: "После отправки сохраните подтверждение и отметьте дату в кабинете — так проще контролировать ответ.",
  },
  "lawyer-salary-template": {
    version: "Демо-карточка",
    warnings: ["Этот товар пока используется как демонстрация каталога. Не выдаём его за опубликованный материал реального автора."],
    relatedIds: ["dosudebka-official", "labor-inspection-template"],
  },
  "specialist-salary-form": {
    version: "Демо-карточка",
    warnings: ["Онлайн-форма показывает механику. Перед продажей нужен опубликованный материал автора и подтверждённая карточка специалиста."],
    relatedIds: ["dosudebka-official"],
  },
  "labor-lawyer-service": {
    version: "Демо-карточка",
    warnings: ["Услуга не должна продаваться как реальная, пока специалист не зарегистрирован и не прошёл модерацию ДокМаркета."],
    relatedIds: ["dosudebka-official"],
  },
  "labor-inspection-template": {
    version: "Демо-карточка",
    warnings: ["Перед публикацией нужен финальный файл, дата проверки и подтверждение автора."],
    relatedIds: ["dosudebka-official", "labor-lawyer-service"],
  },
};

export function getOfferQuality(offerId) {
  return offerQuality[offerId] || {};
}
