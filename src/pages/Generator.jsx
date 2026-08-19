import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { addParticipant, claimParticipantSlot, getCompletedParticipants, getParticipant, getRoom, getTotalParticipants, updateRoom } from "@/services/collectiveService";
import StepIndicator from "@/components/generator/StepIndicator";
import Step1Category from "@/components/generator/Step1Category";
import Step2Mode from "@/components/generator/Step2Mode";
import Step3Respondent from "@/components/generator/Step3Respondent";
import Step4Claimants from "@/components/generator/Step4Claimants";
import Step5Circumstances from "@/components/generator/Step5Circumstances";
import Step6Evidence from "@/components/generator/Step6Evidence";
import Step7Generate from "@/components/generator/Step7Generate";
import CollectiveProgress from "@/components/generator/CollectiveProgress";

const LS_KEY = "legalpro_generator_v2";
const LEGACY_DRAFT_KEYS = ["dosudebka_generator_draft", "dosudebka_generator_v2"];
const ACTIVE_OWNER_ROOM_KEY = "legalpro_collective_active_owner_room";
const joinParticipantKey = roomId => `dosudebka_join_participant_${roomId}`;
const joinDraftKey = (roomId, participantId) => `dosudebka_join_draft_${roomId}_${participantId}`;
const ownerDraftKey = roomId => `dosudebka_owner_draft_${roomId}`;

const initialClaimData = () => ({
  type: "",
  mode: "individual",
  workers: [{ id: 0 }],
  employer: {},
  circumstances: {},
  evidence: [],
  witness: null,
  collectiveFinalized: false,
});

function normalizeClaimData(raw = {}) {
  const type = raw.type || raw.category || "";
  const employer = raw.employer || raw.respondent || {};
  const workers = raw.workers?.length
    ? raw.workers
    : raw.claimant
      ? [{ ...raw.claimant, id: raw.claimant.id ?? 0 }]
      : [{ id: 0 }];
  return {
    ...initialClaimData(),
    ...raw,
    type,
    category: type,
    employer,
    respondent: employer,
    workers,
    claimant: workers[0] || {},
    circumstances: raw.circumstances || {},
    evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
  };
}

function readSoloDraft() {
  try {
    for (const key of [LS_KEY, ...LEGACY_DRAFT_KEYS]) {
      const saved = localStorage.getItem(key);
      if (!saved) continue;
      const parsed = JSON.parse(saved);
      if (!parsed?.claimData || parsed.claimData.mode === "collective" || parsed.claimData.isJoiner) continue;
      return {
        claimData: normalizeClaimData(parsed.claimData),
        currentStep: Math.min(7, Math.max(1, Number(parsed.currentStep) || 1)),
        sourceKey: key,
      };
    }
  } catch {
    console.error("Не удалось прочитать локальный черновик генератора.");
  }
  return null;
}

export default function Generator() {
  const location = useLocation();
  const initialDraftRef = useRef(null);
  if (initialDraftRef.current === null) initialDraftRef.current = readSoloDraft() || false;
  const [currentStep, setCurrentStep] = useState(() => initialDraftRef.current?.currentStep || 1);
  const [claimData, setClaimData] = useState(() => initialDraftRef.current?.claimData || initialClaimData());
  const [showCollectiveProgress, setShowCollectiveProgress] = useState(false);
  const [isJoiner, setIsJoiner] = useState(false);
  const [joinRoom, setJoinRoom] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState("");
  const hasStartedRef = useRef(false);

  const totalSteps = 7;

  useEffect(() => {
    try {
      if (initialDraftRef.current?.sourceKey && initialDraftRef.current.sourceKey !== LS_KEY) {
        localStorage.setItem(LS_KEY, JSON.stringify({
          claimData: initialDraftRef.current.claimData,
          currentStep: initialDraftRef.current.currentStep,
        }));
      }
    } catch {
      console.error("Не удалось перенести локальный черновик генератора.");
    }
  }, []);

  // Check if arriving via join link
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const roomParam = params.get("room");
      if (roomParam) initJoiner(roomParam);
      else restoreOwnerRoom();
    } catch {
      console.error("Не удалось прочитать данные входа в коллективную комнату.");
      setError("Не удалось открыть коллективную комнату из локального хранилища.");
    }
  }, []);

  function memberToWorker(member, index = 0) {
    return {
      ...(member?.claimantData || {}),
      id: index,
      name: member?.claimantData?.name || member?.name || "",
      address: member?.claimantData?.address || member?.address || "",
      phone: member?.claimantData?.phone || member?.phone || "",
      email: member?.claimantData?.email || member?.email || "",
    };
  }

  function restoreOwnerRoom() {
    const activeRoomId = localStorage.getItem(ACTIVE_OWNER_ROOM_KEY) || localStorage.getItem("legalpro_room_owner");
    if (!activeRoomId) return;
    const room = getRoom(activeRoomId);
    if (!room || room.mode !== "collective") {
      localStorage.removeItem(ACTIVE_OWNER_ROOM_KEY);
      if (!room) localStorage.removeItem("legalpro_room_owner");
      return;
    }

    const completedMembers = getCompletedParticipants(room);
    const owner = room.members.find(member => member.role === "owner");
    const restored = {
      ...initialClaimData(),
      mode: "collective",
      type: room.type || room.claim_type || "labor",
      subtype: room.subtype || room.claim_subtype || "",
      roomId: room.room_id,
      collectiveRoomId: room.room_id,
      maxMembers: getTotalParticipants(room),
      totalParticipants: getTotalParticipants(room),
      employer: room.employer || room.commonData?.employer || {},
      selectedLegalOptions: room.commonData?.selectedLegalOptions || [],
      circumstances: owner?.circumstancesData || {},
      evidence: owner?.evidenceData?.selected || [],
      evidenceFiles: owner?.evidenceData?.files || {},
      workers: owner ? [memberToWorker(owner)] : [{ id: 0 }],
    };
    localStorage.setItem(ACTIVE_OWNER_ROOM_KEY, room.room_id);
    localStorage.setItem("legalpro_room_owner", room.room_id);
    setJoinRoom(room);
    setIsJoiner(false);

    if (room.collectiveFinalized && completedMembers.length >= 2) {
      setClaimData({
        ...restored,
        collectiveFinalized: true,
        collectiveMembers: completedMembers,
        completedParticipantsCount: completedMembers.length,
        workers: completedMembers.map(memberToWorker),
      });
      setCurrentStep(7);
      setShowCollectiveProgress(false);
    } else if (owner?.status === "completed") {
      setClaimData(restored);
      setCurrentStep(7);
      setShowCollectiveProgress(true);
    } else {
      const saved = localStorage.getItem(ownerDraftKey(room.room_id)) || localStorage.getItem(LS_KEY);
      const draft = saved ? JSON.parse(saved) : null;
      const belongsToRoom = draft?.claimData?.roomId === room.room_id;
      setClaimData(belongsToRoom ? { ...restored, ...draft.claimData } : restored);
      setCurrentStep(belongsToRoom ? Math.max(3, Number(draft.currentStep || 3)) : 3);
    }
  }

  async function initJoiner(roomId) {
    setJoinLoading(true);
    try {
      const r = getRoom(roomId);
      if (!r) {
        setError("Комната коллективной претензии не найдена. Проверьте ссылку.");
        return;
      }
      let participantId = localStorage.getItem(joinParticipantKey(roomId))
        || localStorage.getItem(`legalpro_collective_participant_${roomId}`);
      let member = participantId ? getParticipant(r, participantId) : null;
      if (!member) {
        participantId = `participant:${roomId}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
        member = claimParticipantSlot(roomId, participantId);
        if (!member) {
          setError("Все места в коллективной претензии уже заполнены.");
          return;
        }
      }
      localStorage.setItem(joinParticipantKey(roomId), participantId);
      localStorage.removeItem(`legalpro_collective_participant_${roomId}`);

      setJoinRoom(r);
      setIsJoiner(true);
      const newData = {
        ...initialClaimData(),
        mode: "collective",
        isJoiner: true,
        roomId,
        collectiveParticipantId: participantId,
        maxMembers: getTotalParticipants(r),
        totalParticipants: getTotalParticipants(r),
        employer: r.employer || {},
        type: r.type || r.claim_type || "",
        subtype: r.subtype || r.claim_subtype || "",
        workers: [memberToWorker(member)],
        circumstances: member.circumstancesData || {},
        evidence: member.evidenceData?.selected || [],
        evidenceFiles: member.evidenceData?.files || {},
      };
      const savedDraft = member.status === "completed"
        ? null
        : localStorage.getItem(joinDraftKey(roomId, participantId));
      const parsedDraft = savedDraft ? JSON.parse(savedDraft) : null;
      const restoredData = parsedDraft?.claimData
        ? { ...newData, ...parsedDraft.claimData, roomId, collectiveParticipantId: participantId, isJoiner: true }
        : newData;
      setClaimData(restoredData);
      setCurrentStep(member.status === "completed" ? 7 : Math.max(3, Number(parsedDraft?.currentStep || 3)));
      setShowCollectiveProgress(member.status === "completed");
      setError("");
    } catch {
      console.error("Не удалось открыть коллективную комнату.");
      setError("Не удалось открыть коллективную комнату. Попробуйте ещё раз.");
    } finally {
      setJoinLoading(false);
    }
  }

  // Only persist to localStorage when user has actually started filling (type is set)
  useEffect(() => {
    if (!claimData.type) return;
    hasStartedRef.current = true;
    try {
      const storageKey = claimData.isJoiner && claimData.roomId && claimData.collectiveParticipantId
        ? joinDraftKey(claimData.roomId, claimData.collectiveParticipantId)
        : claimData.mode === "collective" && claimData.roomId
          ? ownerDraftKey(claimData.roomId)
          : LS_KEY;
      localStorage.setItem(storageKey, JSON.stringify({ claimData, currentStep }));
    } catch {
      console.error("Не удалось сохранить локальный черновик генератора.");
      setError("Не удалось сохранить черновик. Проверьте доступность локального хранилища.");
    }
  }, [claimData, currentStep]);

  const nextStep = () => setCurrentStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setCurrentStep(s => Math.max(s - 1, 1));
  const updateClaimData = useCallback((updates) => setClaimData(prev => {
    const next = { ...prev, ...updates };
    if ("type" in updates || "category" in updates) {
      next.type = updates.type || updates.category || prev.type || prev.category || "";
      next.category = next.type;
    }
    if ("employer" in updates || "respondent" in updates) {
      next.employer = updates.employer || updates.respondent || {};
      next.respondent = next.employer;
    }
    if ("workers" in updates || "claimant" in updates) {
      next.workers = updates.workers || (updates.claimant ? [{ ...updates.claimant, id: updates.claimant.id ?? 0 }] : prev.workers);
      next.claimant = next.workers?.[0] || {};
    }
    return next;
  }), []);

  const reset = () => {
    setClaimData(initialClaimData());
    setCurrentStep(1);
    setShowCollectiveProgress(false);
    setIsJoiner(false);
    setJoinRoom(null);
    try {
      localStorage.removeItem(LS_KEY);
      if (!isJoiner) {
        localStorage.removeItem(ACTIVE_OWNER_ROOM_KEY);
        localStorage.removeItem("legalpro_room_owner");
      }
    } catch {
      console.error("Не удалось удалить локальный черновик генератора.");
    }
  };

  const clearCompletedSoloDraft = useCallback(() => {
    try {
      localStorage.removeItem(LS_KEY);
      LEGACY_DRAFT_KEYS.forEach(key => localStorage.removeItem(key));
    } catch {
      console.error("Не удалось удалить завершённый черновик генератора.");
    }
  }, []);

  // After step 7 is submitted in collective mode, save member data and show progress
  async function handleCollectiveComplete(finalClaimData) {
    try {
      const isOwner = !isJoiner && localStorage.getItem("legalpro_room_owner") === finalClaimData.roomId;
      const room = getRoom(finalClaimData.roomId);
      if (room) {
        const claimantData = finalClaimData.workers?.[0] || {};
        let participantId = isOwner
          ? room.ownerParticipantId
          : (finalClaimData.collectiveParticipantId || localStorage.getItem(joinParticipantKey(finalClaimData.roomId)));
        if (!participantId) {
          setError("Не удалось определить участника коллективной претензии.");
          return false;
        }
        const memberEntry = {
          participantId,
          label: isOwner ? "Вы (организатор)" : "Участник",
          role: isOwner ? "owner" : "participant",
          name: claimantData.name || "Участник",
          address: claimantData.address || "",
          phone: claimantData.phone || "",
          email: claimantData.email || "",
          claimantData,
          circumstances: finalClaimData.circumstances || {},
          circumstancesData: finalClaimData.circumstances || {},
          evidence: finalClaimData.evidence || [],
          evidenceData: {
            selected: finalClaimData.evidence || [],
            files: finalClaimData.evidenceFiles || {},
          },
          status: "completed",
          isOwner,
          completedAt: new Date().toISOString(),
        };
        const savedRoom = addParticipant(room.room_id, memberEntry);
        const savedMember = getParticipant(savedRoom, participantId);
        if (!savedRoom || savedMember?.status !== "completed") {
          setError("Не удалось сохранить данные участника коллективной претензии.");
          return false;
        }
        if (!isOwner) localStorage.removeItem(joinDraftKey(room.room_id, participantId));
        updateRoom(room.id, {
          employer: isOwner ? (finalClaimData.employer || room.employer) : room.employer,
          commonData: isOwner ? {
            type: finalClaimData.type,
            subtype: finalClaimData.subtype,
            employer: finalClaimData.employer || room.employer,
            selectedLegalOptions: finalClaimData.selectedLegalOptions || [],
          } : room.commonData,
        });
      } else {
        setError("Комната коллективной претензии не найдена. Данные участника не сохранены.");
        return false;
      }
      setError("");
      setShowCollectiveProgress(true);
      return true;
    } catch {
      console.error("Не удалось сохранить участника коллективной претензии.");
      setError("Не удалось сохранить данные участника. Проверьте локальное хранилище и попробуйте ещё раз.");
      return false;
    }
  }

  async function handleFinalize() {
    // Load latest room data, merge members into claimData, go to step 7 for generation/payment
    try {
      const r = getRoom(claimData.roomId);
      if (r) {
        const completedMembers = getCompletedParticipants(r);
        if (completedMembers.length < 2) {
          setError("Для коллективной претензии нужны минимум 2 заполненных участника.");
          return;
        }
        updateRoom(r.room_id, {
          collectiveFinalized: true,
          completedParticipantsCount: completedMembers.length,
          collectiveMembers: completedMembers,
          finalizedAt: new Date().toISOString(),
        });
        setClaimData(prev => ({
          ...prev,
          employer: r.employer || prev.employer,
          collectiveMembers: completedMembers,
          collectiveFinalized: true,
          completedParticipantsCount: completedMembers.length,
          // Use first member's circumstances as base for document generation
          workers: completedMembers.map((m, i) => ({
            ...(m.claimantData || {}),
            id: i,
            name: m.claimantData?.name || m.name || "",
            address: m.claimantData?.address || m.address || "",
            phone: m.claimantData?.phone || m.phone || "",
            email: m.claimantData?.email || m.email || "",
          })),
        }));
      } else {
        setError("Комната коллективной претензии не найдена. Обновите страницу или проверьте ссылку.");
        return;
      }
      setError("");
    } catch {
      console.error("Не удалось подготовить коллективную претензию.");
      setError("Не удалось загрузить данные коллективной комнаты. Попробуйте ещё раз.");
      return;
    }
    setShowCollectiveProgress(false);
    setCurrentStep(7);
  }

  if (joinLoading) return (
    <div className="min-h-screen pt-24 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin"></div>
    </div>
  );

  // Show collective progress screen after member submitted
  if (showCollectiveProgress && claimData.mode === "collective") {
    return (
      <div className="min-h-screen pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <CollectiveProgress
            claimData={claimData}
            isOwner={!isJoiner}
            onFinalize={isJoiner ? undefined : handleFinalize}
          />
        </div>
      </div>
    );
  }

  const steps = {
    1: <Step1Category claimData={claimData} updateClaimData={updateClaimData} nextStep={nextStep} />,
    2: <Step2Mode claimData={claimData} updateClaimData={updateClaimData} nextStep={nextStep} prevStep={prevStep} />,
    3: <Step3Respondent claimData={claimData} updateClaimData={updateClaimData} nextStep={nextStep} prevStep={prevStep} isJoiner={isJoiner} />,
    4: <Step4Claimants claimData={claimData} updateClaimData={updateClaimData} nextStep={nextStep} prevStep={prevStep} />,
    5: <Step5Circumstances claimData={claimData} updateClaimData={updateClaimData} nextStep={nextStep} prevStep={prevStep} />,
    6: <Step6Evidence claimData={claimData} updateClaimData={updateClaimData} nextStep={nextStep} prevStep={prevStep} />,
    7: <Step7Generate
      claimData={claimData}
      reset={reset}
      prevStep={prevStep}
      onSuccessfulSave={claimData.mode === "individual" ? clearCompletedSoloDraft : undefined}
      onCollectiveComplete={claimData.mode === "collective" && !claimData.collectiveFinalized ? handleCollectiveComplete : undefined}
    />,
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && <p style={{ color: "#fbbf24", marginBottom: 16, fontSize: "0.85rem" }}>{error}</p>}
        {isJoiner && (
          <div style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <i className="fa-solid fa-users" style={{ color: "#a78bfa" }}></i>
            <span style={{ color: "#d1d5db", fontSize: "0.88rem" }}>
              <b style={{ color: "#a78bfa" }}>Вы участник групповой претензии</b> — заполните только свои личные данные
            </span>
          </div>
        )}
        {/* Hide step indicator for joiner (they skip steps 1-2) */}
        <StepIndicator currentStep={isJoiner ? currentStep - 1 : currentStep} totalSteps={isJoiner ? totalSteps - 2 : totalSteps} />
        <div className="mt-8">
          {steps[currentStep]}
        </div>
      </div>
    </div>
  );
}
