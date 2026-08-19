import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import {
  MATERIAL_TYPE_LABELS,
  deleteDraftMaterial,
  getSpecialistMaterialFile,
  listSpecialistMaterials,
} from "@/specialist-materials/services/specialistMaterialStorageService";

export const materialStyles = `
  .material-page{min-height:100vh;padding:108px 18px 64px}.material-shell{width:min(1080px,100%);margin:0 auto}.material-glass{background:linear-gradient(145deg,rgba(20,29,50,.84),rgba(13,12,29,.88));border:1px solid rgba(148,163,184,.14);box-shadow:0 18px 50px rgba(0,0,0,.22);backdrop-filter:blur(16px)}.material-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:24px}.material-kicker{display:inline-flex;gap:7px;color:#67e8f9;font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.11em}.material-title{margin:7px 0 8px;color:#fff;font:800 clamp(1.8rem,4vw,2.65rem)/1.1 "Space Grotesk",sans-serif}.material-copy{max-width:720px;margin:0;color:#94a3b8;line-height:1.6}.material-primary,.material-secondary,.material-danger{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 15px;border-radius:11px;text-decoration:none;font-size:.77rem;font-weight:800;cursor:pointer}.material-primary{color:#fff;border:0;background:linear-gradient(135deg,#0891b2,#7c3aed)}.material-secondary{color:#cbd5e1;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.1)}.material-danger{color:#fda4af;background:rgba(244,63,94,.06);border:1px solid rgba(244,63,94,.15)}.material-empty{padding:clamp(34px,7vw,66px);border-radius:22px;text-align:center}.material-empty i{color:#67e8f9;font-size:1.6rem}.material-empty h2{color:#fff}.material-empty p{max-width:580px;margin:0 auto 20px;color:#94a3b8;line-height:1.6}.material-list{display:grid;gap:14px}.material-card{padding:19px;border-radius:17px}.material-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.material-card h2{margin:0 0 5px;color:#fff;font-size:1rem}.material-card p{margin:0;color:#8491a4;font-size:.75rem;line-height:1.5}.material-badges{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}.material-badges span{padding:5px 8px;border-radius:999px;color:#a5f3fc;background:rgba(8,145,178,.07);border:1px solid rgba(103,232,249,.13);font-size:.64rem}.material-price{white-space:nowrap;color:#e9d5ff;font-weight:800}.material-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.material-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,.07)}.material-details div{padding:11px;border-radius:10px;background:rgba(255,255,255,.025)}.material-details span{display:block;color:#64748b;font-size:.62rem}.material-details p{margin:5px 0 0;white-space:pre-line;color:#aeb9ca}.material-notice{margin:16px 0;padding:11px 13px;border-radius:10px;color:#bae6fd;background:rgba(8,145,178,.07);border:1px solid rgba(103,232,249,.15);font-size:.71rem;line-height:1.5}.material-error{color:#fda4af;font-size:.72rem}.material-form-panel{padding:clamp(19px,4vw,32px);border-radius:22px}.material-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin:20px 0}.material-choice{display:flex;flex-direction:column;align-items:flex-start;min-height:185px;padding:18px;border-radius:15px;color:inherit;text-align:left;background:rgba(255,255,255,.027);border:1px solid rgba(255,255,255,.08)}.material-choice.active{border-color:rgba(103,232,249,.4);box-shadow:0 0 26px rgba(8,145,178,.09)}.material-choice i{color:#67e8f9;font-size:1.2rem}.material-choice h2{margin:12px 0 6px;color:#fff;font-size:.92rem}.material-choice p{margin:0 0 15px;color:#8190a4;font-size:.72rem;line-height:1.5}.material-choice b{margin-top:auto;color:#c4b5fd;font-size:.72rem}.material-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}.material-field{display:grid;gap:6px;color:#cbd5e1;font-size:.73rem}.material-field.wide{grid-column:1/-1}.material-field input,.material-field textarea,.material-field select{width:100%;padding:11px;border-radius:10px;color:#fff;background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.15);outline:none}.material-field select option{background:#111827}.material-field small{color:#64748b}.material-check{display:flex;align-items:center;gap:8px;color:#aeb9ca;font-size:.73rem}.material-check input{accent-color:#06b6d4}.material-file{padding:18px;border-radius:13px;background:rgba(8,145,178,.05);border:1px dashed rgba(103,232,249,.25)}@media(max-width:700px){.material-page{padding:88px 13px 48px}.material-head,.material-card-head{align-items:flex-start;flex-direction:column}.material-choice-grid,.material-form,.material-details{grid-template-columns:1fr}.material-field.wide{grid-column:auto}.material-primary,.material-secondary,.material-danger{width:100%}}
`;

export function MaterialFrame({ children }) {
  return <div className="material-page"><style>{materialStyles}</style><main className="material-shell">{children}</main></div>;
}

function base64ToBlob(base64, mimeType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

export default function SpecialistMaterials() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState(() => listSpecialistMaterials(user?.id));
  const [openedId, setOpenedId] = useState("");
  const [error, setError] = useState("");

  function download(material) {
    const file = getSpecialistMaterialFile(material.id, user.id);
    if (!file) return setError("Файл черновика не найден.");
    const url = URL.createObjectURL(base64ToBlob(file.base64, material.fileMimeType));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = material.fileName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function remove(material) {
    if (!window.confirm(`Удалить черновик «${material.title}»?`)) return;
    try {
      deleteDraftMaterial(material.id, user.id);
      setMaterials(listSpecialistMaterials(user.id));
      setOpenedId("");
    } catch {
      setError("Не удалось удалить черновик.");
    }
  }

  return <MaterialFrame>
    <header className="material-head"><div><span className="material-kicker"><i className="fa-solid fa-folder-open" />Кабинет специалиста</span><h1 className="material-title">Мои материалы</h1><p className="material-copy">Готовые файлы, онлайн-формы, услуги и инструкции для будущей публикации в ДокМаркете.</p></div><Link className="material-primary" to="/specialist/materials/new"><i className="fa-solid fa-plus" />Добавить материал</Link></header>
    <p className="material-notice">Материалы сохраняются как черновики и не публикуются в ДокМаркете автоматически. Перед публикацией в production потребуется модерация.</p>
    {error && <p className="material-error">{error}</p>}
    {!materials.length ? <section className="material-empty material-glass"><i className="fa-regular fa-file-lines" /><h2>Пока нет материалов</h2><p>Добавьте готовый DOCX/PDF или перейдите в конструктор, чтобы подготовить онлайн-форму.</p><Link className="material-primary" to="/specialist/materials/new">Добавить материал</Link></section>
      : <div className="material-list">{materials.map(material => <article className="material-card material-glass" key={material.id}>
        <div className="material-card-head"><div><h2>{material.title}</h2><p>{material.description || "Описание не добавлено."}</p><div className="material-badges"><span>{MATERIAL_TYPE_LABELS[material.type]}</span><span>Черновик</span><span>{material.formats.join(" / ")}</span><span>{new Date(material.createdAt).toLocaleDateString("ru-RU")}</span></div></div><strong className="material-price">{material.isFree ? "Бесплатно" : `${material.price.toLocaleString("ru-RU")} ₽`}</strong></div>
        <div className="material-actions"><button className="material-secondary" onClick={() => setOpenedId(openedId === material.id ? "" : material.id)}>Открыть</button><button className="material-secondary" onClick={() => download(material)}>Скачать файл</button><button className="material-secondary" onClick={() => navigate(`/specialist/materials/new?edit=${material.id}`)}>Редактировать</button><button className="material-danger" onClick={() => remove(material)}>Удалить черновик</button></div>
        {openedId === material.id && <><div className="material-details"><div><span>Что получит пользователь</span><p>{material.whatIncluded || "Не указано"}</p></div><div><span>Для кого подходит</span><p>{material.suitableFor || "Не указано"}</p></div><div><span>Инструкция по заполнению</span><p>{material.fillInstructions || "Не указано"}</p></div><div><span>Расположение в каталоге</span><p>{[material.directionSlug, material.sectionSlug, material.categorySlug, material.situationSlug].filter(Boolean).join(" / ") || "Не выбрано"}</p></div></div><p className="material-notice">В MVP скачивание доступно без оплаты. В production скачивание будет после оплаты и проверки доступа.</p></>}
      </article>)}</div>}
  </MaterialFrame>;
}
