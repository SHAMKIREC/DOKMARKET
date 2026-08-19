export function resolveLaborDemands(outstandingAmount) {
  return [
    {
      id: "pay-salary-debt",
      order: 1,
      title: "Выплатить задолженность",
      text: "Выплатить задолженность по заработной плате в полном размере.",
      amount: outstandingAmount,
      currency: "RUB",
    },
    {
      id: "pay-delay-compensation",
      order: 2,
      title: "Выплатить компенсацию",
      text: "Выплатить денежную компенсацию за задержку выплат в соответствии со ст. 236 ТК РФ.",
      amount: 0,
      currency: "RUB",
    },
    {
      id: "provide-written-response",
      order: 3,
      title: "Предоставить письменный ответ",
      text: "Предоставить письменный мотивированный ответ по существу требований.",
      amount: 0,
      currency: "",
    },
  ];
}

