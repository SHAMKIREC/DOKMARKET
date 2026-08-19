export const laborSoloMinimalClaimData = {
  type: "labor",
  subtype: "salary-debt",
  mode: "individual",
  workers: [{
    id: 0,
    name: "Иванов Иван Иванович",
    gender: "male",
    address: "г. Саратов, ул. Рабочая, д. 10",
    phone: "+7 900 123-45-67",
    email: "ivanov@example.ru",
    position: "Менеджер",
  }],
  employer: {
    name: "ООО «Работодатель»",
    address: "г. Саратов, ул. Деловая, д. 1",
    inn: "6450123456",
    ogrn: "1156450000000",
    type: "legal-entity",
  },
  circumstances: {
    workStart: "2025-01-15",
    stillWorking: true,
    workplace: "г. Саратов, ул. Деловая, д. 1",
    debtAmount: "125000",
    paymentForm: ["банковский перевод"],
    description: "Заработная плата за отработанный период не выплачена.",
  },
  selectedLegalOptions: [],
  evidence: [],
  evidenceFiles: {},
  evidenceComment: "",
  witness: null,
};

export default laborSoloMinimalClaimData;

