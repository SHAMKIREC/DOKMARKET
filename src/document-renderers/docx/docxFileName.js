function filePart(value) {
  return String(value || "")
    .toLocaleLowerCase("ru-RU")
    .replace(/[^a-zа-яё0-9]+/giu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function docxFileName(model) {
  const claimant = filePart(model.claimant?.fullName) || "zayavitel";
  const date = String(model.generatedAt || new Date().toISOString()).slice(0, 10);
  return `pretenziya-trudovoy-spor-${claimant}-${date}.docx`;
}

