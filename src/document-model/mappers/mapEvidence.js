import { safeString } from "../normalization/index.js";

function normalizeFiles(rawFiles) {
  const list = Array.isArray(rawFiles) ? rawFiles : rawFiles ? [rawFiles] : [];
  return list.filter(Boolean).map((file, index) => {
    const name = safeString(file.name || file.fileName);
    const extension = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
    return {
      id: safeString(file.id) || `file-${index + 1}`,
      name,
      mimeType: safeString(file.type || file.mimeType),
      extension,
      size: Number.isFinite(Number(file.size)) ? Number(file.size) : 0,
      isImage: /^(?:jpg|jpeg|png|webp)$/i.test(extension),
      availableSeparately: true,
    };
  });
}

export function mapEvidence(claimData = {}) {
  const selected = Array.isArray(claimData.evidence) ? claimData.evidence : [];
  const filesByEvidence = claimData.evidenceFiles && typeof claimData.evidenceFiles === "object"
    ? claimData.evidenceFiles
    : {};
  const labels = [...new Set([...selected.map(safeString), ...Object.keys(filesByEvidence).map(safeString)])]
    .filter(Boolean);

  return labels.map((label, index) => ({
    id: `evidence-${index + 1}`,
    order: index + 1,
    label,
    description: index === 0 ? safeString(claimData.evidenceComment) : "",
    participantId: "",
    files: normalizeFiles(filesByEvidence[label]),
  }));
}
