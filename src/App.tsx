import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { participantProfiles, stageDefinitions } from './data/willchainDemoScenario';
import type { ActorId, ParticipantId, StageDefinition, StatusTone } from './types/scenario';
import willChainLogo from './assets/will_chain.png';
import smartContractLogo from './assets/smart_contract.png';

const statusTagClasses: Record<StatusTone, string> = {
  gray: 'bg-slate-100 text-slate-700',
  yellow: 'bg-amber-100 text-amber-700',
  green: 'bg-emerald-100 text-emerald-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-indigo-100 text-indigo-700',
  red: 'bg-rose-100 text-rose-700',
};
const statusPulseColorByTone: Record<StatusTone, string> = {
  gray: 'rgba(100,116,139,0.34)',
  yellow: 'rgba(245,158,11,0.38)',
  green: 'rgba(16,185,129,0.38)',
  blue: 'rgba(59,130,246,0.38)',
  purple: 'rgba(99,102,241,0.38)',
  red: 'rgba(244,63,94,0.38)',
};

const actorName: Record<ActorId, string> = {
  supreme_court: '대법원',
  nts: '국세청',
  family_court: '가정법원',
  ksd: '예탁결제원',
  bank: 'KB국민은행',
  insurer: '한화생명',
  medical: '아산병원',
  executor: '유언집행자',
  donor: '양도인',
  assignee_1: '양수인 본인',
  assignee_2: '타 양수인',
  smart_contract: '스마트 컨트랙트',
};
const actorImageOverride: Partial<Record<ActorId, string>> = {
  smart_contract: smartContractLogo,
};
const actorImageScaleOverride: Partial<Record<ActorId, number>> = {
  smart_contract: 0.7,
};

const firstStage = stageDefinitions[0];
const lastStage = stageDefinitions[stageDefinitions.length - 1];

const initials = (name: string): string => {
  const clean = name.replace(/[\s·]/g, '');
  return clean.slice(0, 2).toUpperCase();
};

function App() {
  const [currentStageId, setCurrentStageId] = useState<string>(firstStage.id);
  const [approvalState, setApprovalState] = useState<Record<string, ParticipantId[]>>({});
  const [hoveredBlockStageId, setHoveredBlockStageId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showIntroModal, setShowIntroModal] = useState<boolean>(true);
  const [showScenarioEndModal, setShowScenarioEndModal] = useState<boolean>(false);
  const participantItemRefs = useRef<Partial<Record<ActorId, HTMLElement | null>>>({});
  const participantPrevTopRef = useRef<Map<ActorId, number>>(new Map());

  const stageById = useMemo(() => {
    return Object.fromEntries(stageDefinitions.map((stage) => [stage.id, stage]));
  }, []);

  const currentStage = stageById[currentStageId] as StageDefinition;
  const currentApprovals = approvalState[currentStage.id] ?? [];
  const userSideApprovers: ParticipantId[] =
    currentStage.type === 'block_commit_stage'
      ? (currentStage.requiredApprovals ?? []).filter(
          (id) => id === 'assignee_1',
        )
      : [];

  const isCommitted =
    currentStage.type === 'block_commit_stage'
      ? (currentStage.requiredApprovals ?? []).every((id) => currentApprovals.includes(id))
      : false;

  const transitionTo = (stageId?: string) => {
    if (!stageId) return;
    const targetStage = stageById[stageId];
    if (targetStage?.type === 'block_commit_stage') {
      setApprovalState((prev) => ({
        ...prev,
        [stageId]: [],
      }));
    }
    setCurrentStageId(stageId);
  };
  const resetToFirstStage = () => {
    setShowScenarioEndModal(false);
    setApprovalState({});
    setHoveredBlockStageId(null);
    setCurrentStageId(firstStage.id);
  };
  const handleNextStage = () => {
    if (currentStage.id === lastStage.id) {
      setShowScenarioEndModal(true);
      return;
    }
    transitionTo(currentStage.nextStageId);
  };

  const handleApprove = (participantId: ParticipantId) => {
    if (currentStage.type !== 'block_commit_stage') return;
    if (!(currentStage.requiredApprovals ?? []).includes(participantId)) return;

    setApprovalState((prev) => {
      const existing = prev[currentStage.id] ?? [];
      if (existing.includes(participantId)) return prev;
      return {
        ...prev,
        [currentStage.id]: [...existing, participantId],
      };
    });
  };

  const handleModalConfirm = () => {
    if (currentStage.id === lastStage.id) {
      setShowScenarioEndModal(true);
      return;
    }
    if (currentStage.type === 'real_event_stage') {
      handleNextStage();
      return;
    }
    if (currentStage.type === 'block_commit_stage' && isCommitted) {
      handleNextStage();
    }
  };

  const renderButton = (stageId: string, actor: ActorId, isBlock: boolean, requiredApprovals?: ParticipantId[]) => {
    const action = currentStage.activeParticipants.find((row) => row.participantId === actor);
    if (!action?.buttonType || action.buttonType === 'none') return null;

    if (
      isBlock &&
      actor !== 'smart_contract' &&
      requiredApprovals?.includes(actor as ParticipantId)
    ) {
      const approved = (approvalState[stageId] ?? []).includes(actor as ParticipantId);
      return (
        <button
          type="button"
          disabled={approved}
          onClick={() => handleApprove(actor as ParticipantId)}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
            approved
              ? 'cursor-not-allowed border border-emerald-200 bg-emerald-100 text-emerald-700'
              : 'border border-blue-300 bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {approved ? '승인됨' : '승인'}
        </button>
      );
    }

    const issued = action.buttonType === 'issued';
    const approved = action.buttonType === 'approved';

    return (
      <button
        type="button"
        disabled
        className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
          issued
            ? 'border border-indigo-200 bg-indigo-100 text-indigo-700'
            : approved
              ? 'border border-emerald-200 bg-emerald-100 text-emerald-700'
              : 'border border-slate-200 bg-slate-100 text-slate-500'
        }`}
      >
        {issued ? '발행됨' : approved ? '승인됨' : action.buttonLabel ?? '승인'}
      </button>
    );
  };

  const hoverStage = hoveredBlockStageId ? stageById[hoveredBlockStageId] : null;
  const isPastHoveredBlock = Boolean(
    hoverStage &&
      hoverStage.type === 'block_commit_stage' &&
      hoverStage.order < currentStage.order,
  );
  const hoverPreview =
    hoverStage?.blockPreview && hoverStage.type === 'block_commit_stage' && isPastHoveredBlock
      ? {
          ...hoverStage.blockPreview,
          status: (hoverStage.requiredApprovals ?? []).every((id) =>
            (approvalState[hoverStage.id] ?? []).includes(id),
          )
            ? 'Committed'
            : 'Pending Signatures',
          signatureSet: [
            ...(hoverStage.issuedBy ? [`Sig_${String(hoverStage.issuedBy)}`] : []),
            ...(hoverStage.requiredApprovals ?? []).map((participantId) =>
              (approvalState[hoverStage.id] ?? []).includes(participantId)
                ? `Sig_${participantId}`
                : 'Pending',
            ),
          ],
        }
      : null;
  const handleBlockHoverMove = (stageId: string, event: ReactMouseEvent) => {
    const stage = stageById[stageId];
    if (!stage || stage.type !== 'block_commit_stage' || stage.order >= currentStage.order) {
      setHoveredBlockStageId(null);
      return;
    }
    setHoveredBlockStageId(stageId);
    setHoverPosition({ x: event.clientX, y: event.clientY });
  };

  const baseRows: ActorId[] = [
    ...participantProfiles
      .map((profile) => profile.id)
      .filter((id) => id !== 'assignee_1'),
    ...(currentStage.activeParticipants.some((row) => row.participantId === 'smart_contract')
      ? (['smart_contract'] as ActorId[])
      : []),
  ];
  const rows = [...baseRows].sort((a, b) => {
    const participantOrder = new Map(
      participantProfiles.map((profile, index) => [profile.id, index]),
    );
    const getPriority = (actor: ActorId): number => {
      const action = currentStage.activeParticipants.find((row) => row.participantId === actor);
      const isIssuer = currentStage.issuedBy === actor || action?.isFocused;
      const isApprover =
        currentStage.type === 'block_commit_stage' &&
        currentStage.requiredApprovals?.includes(actor as ParticipantId);
      const isRelated = Boolean(action?.isActive);
      if (isIssuer) return 0;
      if (isApprover) return 1;
      if (isRelated) return 2;
      return 3;
    };
    const pa = getPriority(a);
    const pb = getPriority(b);
    if (pa !== pb) return pa - pb;
    const ia = participantOrder.get(a as ParticipantId);
    const ib = participantOrder.get(b as ParticipantId);
    return (ia ?? Number.MAX_SAFE_INTEGER) - (ib ?? Number.MAX_SAFE_INTEGER);
  });
  const timelineColumns = useMemo(() => {
    const columns: Array<{ real?: StageDefinition; chain?: StageDefinition }> = [];
    const realColumnByStageId = new Map<string, number>();
    let mostRecentRealStageId: string | undefined;

    for (const stage of stageDefinitions) {
      if (stage.timelineLane === 'real') {
        const realColumnIndex = columns.length;
        columns[realColumnIndex] = columns[realColumnIndex] ?? {};
        columns[realColumnIndex].real = stage;
        realColumnByStageId.set(stage.id, realColumnIndex);
        mostRecentRealStageId = stage.id;
      } else {
        const anchorRealStageId = stage.timelineAnchorRealStageId ?? mostRecentRealStageId;
        let columnIndex =
          (anchorRealStageId ? realColumnByStageId.get(anchorRealStageId) : undefined) ?? -1;
        if (columnIndex < 0) {
          columnIndex = Math.max(columns.length - 1, 0);
        }
        while (columns[columnIndex]?.chain) {
          columnIndex += 1;
        }
        columns[columnIndex] = columns[columnIndex] ?? {};
        columns[columnIndex].chain = stage;
      }
    }

    return columns;
  }, []);
  const maxIndex = timelineColumns.length - 1;
  const chainLineBounds = useMemo(() => {
    const firstIndex = timelineColumns.findIndex((column) => Boolean(column.chain));
    const lastIndex =
      timelineColumns.length -
      1 -
      [...timelineColumns].reverse().findIndex((column) => Boolean(column.chain));
    if (firstIndex < 0 || lastIndex < 0 || lastIndex < firstIndex) {
      return null;
    }
    const leftPercent = ((firstIndex + 0.5) / timelineColumns.length) * 100;
    const rightPercent = ((lastIndex + 0.5) / timelineColumns.length) * 100;
    return { leftPercent, rightPercent };
  }, [timelineColumns]);
  const laneFillPercent = (lane: 'real' | 'chain') => {
    const idx = timelineColumns.reduce((acc, column, i) => {
      const stage = lane === 'real' ? column.real : column.chain;
      if (stage && stage.order <= currentStage.order) return i;
      return acc;
    }, -1);
    if (idx < 0 || maxIndex <= 0) return 0;
    return ((idx + 0.5) / timelineColumns.length) * 100;
  };
  const chainFillRightPercent = (() => {
    const rawFill = laneFillPercent('chain');
    if (!chainLineBounds) return 0;
    if (rawFill <= chainLineBounds.leftPercent) return chainLineBounds.leftPercent;
    return Math.min(rawFill, chainLineBounds.rightPercent);
  })();
  const timelineLabel = (stage: StageDefinition): string =>
    stage.timelineLane === 'chain'
      ? stage.timelineLabel.replaceAll(' 이벤트 블록', '')
      : stage.timelineLabel;
  const shouldRenderParticipantButton = (actor: ActorId): boolean => {
    if (actor === 'assignee_1') {
      if (
        currentStage.type === 'block_commit_stage' &&
        currentStage.requiredApprovals?.includes(actor as ParticipantId)
      ) {
        return false;
      }
    }
    return true;
  };
  const stageTypeByOrder = useMemo(() => {
    return new Map(stageDefinitions.map((stage) => [stage.order, stage.type]));
  }, []);
  const mergedActivityLogs = useMemo(() => {
    const completedLogs = currentStage.userLogCards
      .filter((log) => (log.stageOrder ?? Number.NEGATIVE_INFINITY) < currentStage.order)
      .map((log) => ({
        ...log,
        activityType:
          log.stageOrder !== undefined
            ? stageTypeByOrder.get(log.stageOrder) ?? 'real_event_stage'
            : 'real_event_stage',
      }))
      .reverse();
    const currentLog = {
      id: `current-${currentStage.id}`,
      title: currentStage.shortTitle,
      description: currentStage.description,
      date: currentStage.date,
      status: 'in_progress' as const,
      activityType: currentStage.type,
    };
    return [currentLog, ...completedLogs];
  }, [currentStage, stageTypeByOrder]);
  const userUiActorLabel = currentStage.order < 13 ? '양도인' : '양수인 본인';
  const isJoinLandingStage = currentStage.id === 'stage_01_join_willchain';
  const activityTimelineVars = {
    '--activity-marker-size': '1rem',
    '--activity-log-gap': '0.5rem',
  } as CSSProperties;
  const worldAssetOrder = [
    'will_document',
    'smart_contract',
    'asset_registry',
    'rwa_tokens',
    'donor_account',
    'insurance_payout',
    'assignee_1_account',
    'assignee_2_account',
  ] as const;
  const orderedWorldAssets = useMemo(() => {
    const assetMap = new Map(currentStage.assetStates.map((asset) => [asset.assetId, asset]));
    return worldAssetOrder
      .map((assetId) => assetMap.get(assetId))
      .filter((asset): asset is NonNullable<typeof asset> => Boolean(asset));
  }, [currentStage.assetStates]);

  useLayoutEffect(() => {
    const currentPositions = new Map<ActorId, number>();
    rows.forEach((actor) => {
      const element = participantItemRefs.current[actor];
      if (!element) return;
      currentPositions.set(actor, element.getBoundingClientRect().top);
    });

    if (typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      rows.forEach((actor) => {
        const element = participantItemRefs.current[actor];
        if (!element) return;
        const previousTop = participantPrevTopRef.current.get(actor);
        const currentTop = currentPositions.get(actor);
        if (previousTop === undefined || currentTop === undefined) return;
        const deltaY = previousTop - currentTop;
        if (Math.abs(deltaY) < 1) return;
        element.animate(
          [
            { transform: `translateY(${deltaY}px)` },
            { transform: 'translateY(0)' },
          ],
          {
            duration: 360,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          },
        );
      });
    }

    participantPrevTopRef.current = currentPositions;
  }, [rows, currentStage.id]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,#dbeafe_0,#f8fafc_42%,#f1f5f9_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em]">WillChain Scenario Timeline</p>

          <div className="overflow-x-auto pb-1">
            <div className="min-w-[980px] space-y-0">
              <div className="flex items-center gap-2">
                <div className="w-14" />
                <div
                  className="grid flex-1 gap-1"
                  style={{ gridTemplateColumns: `repeat(${timelineColumns.length}, minmax(0, 1fr))` }}
                >
                  {timelineColumns.map((column, idx) => (
                    <button
                      key={`real-label-${idx}`}
                      type="button"
                      onClick={() => {
                        if (column.real) transitionTo(column.real.id);
                      }}
                      className="min-h-8 whitespace-pre-line px-1 text-center text-[11px] leading-4 text-slate-700"
                    >
                      {column.real ? timelineLabel(column.real) : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <p className="w-14 text-right text-[13px] font-bold text-slate-700">현실 사건</p>
                <div
                  className="relative grid flex-1 gap-1"
                  style={{ gridTemplateColumns: `repeat(${timelineColumns.length}, minmax(0, 1fr))` }}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-300" />
                  <div
                    className="pointer-events-none absolute left-0 top-1/2 h-px -translate-y-1/2 bg-emerald-500"
                    style={{ width: `${laneFillPercent('real')}%` }}
                  />
                  {timelineColumns.map((column, idx) => {
                    const stage = column.real;
                    const isDot = Boolean(stage);
                    const isCurrent = stage ? stage.id === currentStage.id : false;
                    const isCompleted = stage ? stage.order < currentStage.order : false;
                    const dotClass = isCurrent
                      ? 'h-4 w-4 border-blue-500 bg-blue-600 ring-4 ring-blue-200 animate-pulse-soft'
                      : isCompleted
                        ? 'h-3.5 w-3.5 border-emerald-500 bg-emerald-600'
                        : 'h-3.5 w-3.5 border-slate-300 bg-white';

                    return (
                      <div key={`real-dot-${idx}`} className="relative z-10 flex h-6 items-center justify-center">
                        {isDot ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (stage) transitionTo(stage.id);
                            }}
                            className={`rounded-full border-2 transition ${dotClass}`}
                            aria-label={`${stage?.timelineLabel ?? ''} (${stage?.date ?? ''})`}
                          />
                        ) : (
                          <span className="h-3.5 w-3.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-14" />
                <div
                  className="grid flex-1 gap-1"
                  style={{ gridTemplateColumns: `repeat(${timelineColumns.length}, minmax(0, 1fr))` }}
                >
                  {timelineColumns.map((column, idx) => (
                    <div key={`connector-${idx}`} className="flex h-2 items-center justify-center">
                      {column.real && column.chain ? (
                        <span
                          className="w-px"
                          style={{
                            height: 'calc(100% + 24px)',
                            backgroundImage:
                              'repeating-linear-gradient(to bottom, rgb(148 163 184) 0px, rgb(148 163 184) 2px, transparent 2px, transparent 5px)',
                          }}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <p className="w-14 text-right text-[13px] font-bold text-slate-700">블록체인</p>
                <div
                  className="relative grid flex-1 gap-1"
                  style={{ gridTemplateColumns: `repeat(${timelineColumns.length}, minmax(0, 1fr))` }}
                >
                  {chainLineBounds ? (
                    <div
                      className="pointer-events-none absolute top-1/2 h-px -translate-y-1/2 bg-slate-300"
                      style={{
                        left: `${chainLineBounds.leftPercent}%`,
                        right: `${100 - chainLineBounds.rightPercent}%`,
                      }}
                    />
                  ) : null}
                  {chainLineBounds && chainFillRightPercent > chainLineBounds.leftPercent ? (
                    <div
                      className="pointer-events-none absolute top-1/2 h-px -translate-y-1/2 bg-emerald-500"
                      style={{
                        left: `${chainLineBounds.leftPercent}%`,
                        width: `${chainFillRightPercent - chainLineBounds.leftPercent}%`,
                      }}
                    />
                  ) : null}
                  {timelineColumns.map((column, idx) => {
                    const stage = column.chain;
                    const isDot = Boolean(stage);
                    const isCurrent = stage ? stage.id === currentStage.id : false;
                    const isCompleted = stage ? stage.order < currentStage.order : false;
                    const dotClass = isCurrent
                      ? 'h-4 w-4 border-blue-500 bg-blue-600 ring-4 ring-blue-200 animate-pulse-soft'
                      : isCompleted
                        ? 'h-3.5 w-3.5 border-emerald-500 bg-emerald-600'
                        : 'h-3.5 w-3.5 border-slate-300 bg-white';

                    return (
                      <div key={`chain-dot-${idx}`} className="relative z-10 flex h-6 items-center justify-center">
                        {isDot ? (
                          <button
                            type="button"
                            onMouseEnter={() => {
                              if (stage && stage.order < currentStage.order) setHoveredBlockStageId(stage.id);
                            }}
                            onMouseMove={(event) => {
                              if (stage) handleBlockHoverMove(stage.id, event);
                            }}
                            onMouseLeave={() => setHoveredBlockStageId(null)}
                            onClick={() => {
                              if (stage) transitionTo(stage.id);
                            }}
                            className={`border-2 transition ${dotClass} rounded-sm`}
                            aria-label={`${stage?.timelineLabel ?? ''} (${stage?.date ?? ''})`}
                          />
                        ) : (
                          <span className="h-3.5 w-3.5" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-14" />
                <div
                  className="grid flex-1 gap-1"
                  style={{ gridTemplateColumns: `repeat(${timelineColumns.length}, minmax(0, 1fr))` }}
                >
                  {timelineColumns.map((column, idx) => (
                    <button
                      key={`chain-label-${idx}`}
                      type="button"
                      onMouseEnter={(event) => {
                        if (column.chain) {
                          if (column.chain.order < currentStage.order) {
                            setHoveredBlockStageId(column.chain.id);
                            setHoverPosition({ x: event.clientX, y: event.clientY });
                          } else {
                            setHoveredBlockStageId(null);
                          }
                        }
                      }}
                      onMouseMove={(event) => {
                        if (column.chain) {
                          handleBlockHoverMove(column.chain.id, event);
                        }
                      }}
                      onMouseLeave={() => setHoveredBlockStageId(null)}
                      onClick={() => {
                        if (column.chain) transitionTo(column.chain.id);
                      }}
                      className="min-h-8 whitespace-pre-line px-1 text-center text-[11px] leading-4 text-slate-700"
                    >
                      {column.chain ? timelineLabel(column.chain) : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="grid items-start gap-4 xl:grid-cols-[minmax(320px,1fr)_minmax(380px,460px)_minmax(320px,1fr)]">
          <section className="h-full rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl backdrop-blur xl:order-1 xl:self-stretch">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Participants</p>
              <h2 className="text-lg font-semibold">네트워크 참여 주체</h2>
            </div>
            <div className="space-y-2">
              {rows.map((actor) => {
                const profile = participantProfiles.find((p) => p.id === actor);
                const action = currentStage.activeParticipants.find((row) => row.participantId === actor);
                const active = Boolean(action?.isActive);
                const focused = Boolean(action?.isFocused);
                const label = profile?.name ?? actorName[actor];
                const subLabel = profile?.category ?? '시스템';
                const imageSrc = profile?.imageSrc ?? actorImageOverride[actor];
                const imageScale = profile?.imageScale && profile.imageScale > 0
                  ? profile.imageScale
                  : actorImageScaleOverride[actor] ?? 1;
                const imageOffsetXPercent = profile?.imageOffsetXPercent ?? 0;
                const imageOffsetYPercent = profile?.imageOffsetYPercent ?? 0;

                return (
                  <article
                    key={actor}
                    ref={(element) => {
                      participantItemRefs.current[actor] = element;
                    }}
                    className={`flex items-center gap-3 px-1 py-2 transition ${active ? '' : 'opacity-45 grayscale'}`}
                  >
                    <div className="flex min-w-[68px] flex-col items-center">
                      {imageSrc ? (
                        <div
                          className={`h-14 w-14 overflow-hidden rounded-full border transition ${
                            focused
                              ? 'border-blue-500 ring-4 ring-blue-200 shadow-md'
                              : active
                                ? 'border-slate-300 shadow-sm'
                                : 'border-slate-200'
                          }`}
                        >
                          <img
                            src={imageSrc}
                            alt={`${label} 로고`}
                            className="block h-full w-full object-contain"
                            style={{
                              transform: `translate(${imageOffsetXPercent}%, ${imageOffsetYPercent}%) scale(${imageScale})`,
                              transformOrigin: '50% 50%',
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-full border bg-gradient-to-br from-blue-50 to-indigo-100 text-sm font-bold text-slate-700 transition ${
                            focused
                              ? 'border-blue-500 ring-4 ring-blue-200 shadow-md'
                              : active
                                ? 'border-slate-300 shadow-sm'
                                : 'border-slate-200'
                          }`}
                        >
                          {initials(label)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold leading-5 text-slate-900">
                          {label}
                          <span className="ml-2 text-[12px] font-semibold text-slate-500">{subLabel}</span>
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-700">{action?.description ?? '해당 단계 액션 없음'}</p>
                      </div>
                      {shouldRenderParticipantButton(actor)
                        ? renderButton(
                            currentStage.id,
                            actor,
                            currentStage.type === 'block_commit_stage',
                            currentStage.requiredApprovals,
                          )
                        : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="flex h-full flex-col rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl backdrop-blur xl:order-3 xl:self-stretch">
            <div className="mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">World State</p>
                <h2 className="text-lg font-semibold">현실 세계 상태 패널</h2>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm">
              <div className="grid auto-rows-[9rem] content-start sm:grid-cols-2">
                {orderedWorldAssets.map((asset, index) => {
                  const isLeftCol = index % 2 === 0;
                  const isLastRow = index >= orderedWorldAssets.length - 2;
                  const shouldPulseStateTag =
                    (currentStage.order === 12 || currentStage.order === 19 || currentStage.order === 21) &&
                    (asset.assetId === 'rwa_tokens' || asset.assetId === 'donor_account' || asset.assetId === 'assignee_1_account');
                  return (
                    <article
                      key={asset.assetId}
                      className={`h-full p-3 transition ${
                        isLeftCol ? 'sm:border-r sm:border-slate-200' : ''
                      } ${!isLastRow ? 'border-b border-slate-200' : ''}`}
                    >
                      <div className="-mx-3 -mt-3 mb-2 flex h-12 items-center justify-between border-b border-slate-200 bg-slate-50/85 px-3">
                        <h3 className="whitespace-pre-line text-sm font-semibold leading-4">{asset.title}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            statusTagClasses[asset.tone]
                          } ${shouldPulseStateTag ? 'animate-state-tag-pulse' : ''}`}
                          style={
                            shouldPulseStateTag
                              ? ({ '--state-tag-pulse-color': statusPulseColorByTone[asset.tone] } as CSSProperties)
                              : undefined
                          }
                        >
                          {asset.statusText}
                        </span>
                      </div>
                      <div className="mt-2 flex h-[84px] flex-col gap-1">
                        {asset.valueLabel ? (
                          <p
                            className={`whitespace-pre-line text-sm font-bold text-slate-900 ${
                              asset.assetId === 'smart_contract'
                                ? 'whitespace-pre-wrap font-mono text-[11px] leading-[0.92rem]'
                                : asset.assetId === 'will_document'
                                  ? 'whitespace-pre-wrap text-[11px] leading-[0.92rem]'
                                  : ''
                            }`}
                          >
                            {asset.valueLabel}
                          </p>
                        ) : null}
                        {asset.helperText ? <p className="mt-auto line-clamp-3 text-right text-xs leading-5 text-slate-600">{asset.helperText}</p> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

          </section>

          <section className="flex flex-col items-center xl:order-2">
            <div className="mb-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">User Device</p>
              <h2 className="text-lg font-semibold">
                <span className="font-extrabold text-slate-900 underline decoration-indigo-700 underline-offset-4">
                  {userUiActorLabel}
                </span>
                <span className="ml-1">안내 UI</span>
              </h2>
            </div>

            <div className="relative w-full max-w-[390px] aspect-[9/17] rounded-[2rem] border-8 border-slate-900 bg-slate-950 p-2 shadow-[0_40px_90px_rgba(15,23,42,0.42),0_16px_34px_rgba(15,23,42,0.32),0_3px_10px_rgba(15,23,42,0.22)]">
              <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2">
                <div className="flex h-7 w-28 items-center justify-end rounded-full border border-slate-800 bg-black/95 px-2">
                  <span className="h-2.5 w-2.5 rounded-full border border-slate-600 bg-slate-700/90 shadow-inner" />
                </div>
              </div>
              <div
                className={`h-full overflow-y-auto overscroll-contain rounded-[1.4rem] bg-slate-50 ${
                  isJoinLandingStage ? 'p-0' : 'px-3 pb-3 pt-10'
                }`}
              >
                {isJoinLandingStage ? (
                  <section className="flex h-full flex-col items-center justify-start gap-0 rounded-[1.4rem] bg-[radial-gradient(circle_at_24%_10%,#f5f3ff_0,#ede9fe_36%,#ddd6fe_66%,#c4b5fd_100%)] pt-36">
                    <img
                      src={willChainLogo}
                      alt="WillChain 로고"
                      className="h-[180px] w-[180px] max-w-[72%] object-contain drop-shadow-[0_18px_32px_rgba(109,40,217,0.28)]"
                    />
                    <div className="mt-[-22px] flex flex-col items-center gap-3">
                      <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">WillChain</h3>
                      <button
                        type="button"
                        onClick={() => transitionTo(currentStage.nextStageId)}
                        className="mt-2 rounded-xl border border-violet-500 bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(109,40,217,0.3)] hover:bg-violet-700"
                      >
                        가입하기
                      </button>
                    </div>
                  </section>
                ) : (
                  <>
                {currentStage.userModal?.visible ? (
                  <section className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs font-semibold text-blue-700">현재 액션</p>
                    <h4 className="mt-1 text-sm font-semibold text-slate-900">{currentStage.userModal.title}</h4>
                    <p className="mt-2 text-xs leading-5 text-slate-700">{currentStage.userModal.body}</p>
                    <div className="mt-3 flex gap-2">
                      {currentStage.userModal.cancelLabel ? (
                        <button
                          type="button"
                          className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                        >
                          {currentStage.userModal.cancelLabel}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleModalConfirm}
                        disabled={currentStage.type === 'block_commit_stage' && !isCommitted}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold text-white ${
                          currentStage.type === 'block_commit_stage' && !isCommitted
                            ? 'cursor-not-allowed bg-slate-400'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {currentStage.type === 'block_commit_stage'
                          ? isCommitted
                            ? '다음 단계로'
                            : '승인 완료 대기'
                          : currentStage.userModal.confirmLabel ?? '확인'}
                      </button>
                    </div>
                  </section>
                ) : null}

                {currentStage.type === 'block_commit_stage' ? (
                  <section
                    className={`mb-3 rounded-2xl border p-3 ${
                      isCommitted
                        ? 'border-emerald-200 bg-gradient-to-b from-emerald-50 to-white'
                        : 'border-amber-200 bg-gradient-to-b from-amber-50 to-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={`text-xs font-semibold uppercase tracking-[0.14em] ${
                            isCommitted ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          승인 진행 현황
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {currentApprovals.length} / {(currentStage.requiredApprovals ?? []).length} 승인 완료
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          isCommitted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {Math.round(
                          (currentApprovals.length /
                            Math.max((currentStage.requiredApprovals ?? []).length, 1)) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div
                      className={`mt-3 h-2.5 rounded-full ${
                        isCommitted ? 'bg-emerald-100' : 'bg-amber-100'
                      }`}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCommitted ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{
                          width: `${
                            (currentApprovals.length /
                              Math.max((currentStage.requiredApprovals ?? []).length, 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    {userSideApprovers.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {userSideApprovers.map((participantId) => {
                          const action = currentStage.activeParticipants.find(
                            (row) => row.participantId === participantId,
                          );
                          const approved = currentApprovals.includes(participantId);
                          return (
                            <div
                              key={`user-approve-${participantId}`}
                              className="rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-[11px] font-semibold text-slate-800">
                                    {actorName[participantId]}
                                  </p>
                                  <p className="mt-1 text-[11px] leading-5 text-slate-600">
                                    {action?.description ?? '승인 요청이 도착했습니다.'}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(participantId)}
                                  disabled={approved}
                                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${
                                    approved
                                      ? 'cursor-not-allowed border border-emerald-200 bg-emerald-100 text-emerald-700'
                                      : 'border border-blue-300 bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {approved ? '승인됨' : '승인'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    {isCommitted ? (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={handleNextStage}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          확인
                        </button>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                <section className="mx-auto w-full max-w-[94%]">
                  <div className="mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">활동 로그</h4>
                  </div>
                  {mergedActivityLogs.length === 0 ? (
                    <p className="text-xs text-slate-500">누적 로그가 아직 없습니다.</p>
                  ) : (
                    <ol className="space-y-2" style={activityTimelineVars}>
                      {mergedActivityLogs.map((log, index) => {
                        const inProgress = log.status === 'in_progress';
                        const isBlockLog = log.activityType === 'block_commit_stage';
                        const inProgressTone =
                          currentStage.type === 'real_event_stage'
                            ? 'blue'
                            : isCommitted
                              ? 'emerald'
                              : 'amber';
                        const markerClass = inProgress
                          ? inProgressTone === 'blue'
                            ? 'border-blue-500 bg-blue-600 ring-4 ring-blue-200 animate-pulse-soft'
                            : inProgressTone === 'amber'
                              ? 'border-amber-500 bg-amber-500 ring-4 ring-amber-200 animate-pulse-soft'
                              : 'border-emerald-500 bg-emerald-500 ring-4 ring-emerald-200 animate-pulse-soft'
                          : 'border-emerald-500 bg-emerald-600';
                        const markerShapeClass = isBlockLog ? 'rounded-sm' : 'rounded-full';
                        const cardClass = inProgress
                          ? inProgressTone === 'blue'
                            ? 'border-blue-200 bg-blue-50/70'
                            : inProgressTone === 'amber'
                              ? 'border-amber-200 bg-amber-50/70'
                              : 'border-emerald-200 bg-emerald-50/70'
                          : 'border-slate-200 bg-slate-50';
                        const badgeClass = inProgress
                          ? inProgressTone === 'blue'
                            ? 'bg-blue-100 text-blue-700'
                            : inProgressTone === 'amber'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          : 'bg-emerald-100 text-emerald-700';
                        return (
                          <li key={log.id} className="grid grid-cols-[var(--activity-marker-size)_1fr] gap-2">
                            <div className="relative">
                              {index < mergedActivityLogs.length - 1 ? (
                                <span
                                  className="absolute left-1/2 w-px -translate-x-1/2 bg-slate-200"
                                  style={{
                                    top: 'calc(var(--activity-marker-size) / 2)',
                                    bottom: 'calc(var(--activity-log-gap) / -2)',
                                  }}
                                />
                              ) : null}
                              <span
                                className={`relative block h-[var(--activity-marker-size)] w-[var(--activity-marker-size)] border-2 ${markerClass} ${markerShapeClass}`}
                              />
                            </div>
                            <article
                              className={`rounded-xl border p-2.5 ${cardClass}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-semibold text-slate-900">{log.title}</p>
                                  <p className="text-[10px] font-medium text-slate-500">{log.date}</p>
                                </div>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
                                  {inProgress ? '진행 중' : '완료'}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] leading-5 text-slate-600">{log.description}</p>
                            </article>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </section>
                  </>
                )}
              </div>
            </div>
          </section>
        </main>

      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 px-5">
        <div className="pointer-events-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => transitionTo(currentStage.previousStageId)}
            disabled={currentStage.id === firstStage.id}
            className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold backdrop-blur-2xl backdrop-saturate-150 ring-1 transition shadow-[0_28px_56px_rgba(15,23,42,0.34),0_10px_22px_rgba(15,23,42,0.24),inset_0_1px_0_rgba(255,255,255,0.5)] ${
              currentStage.id === firstStage.id
                ? 'cursor-not-allowed border-white/45 bg-white/25 text-slate-400 ring-white/35'
                : 'border-white/80 bg-white/42 text-slate-800 ring-white/75 hover:bg-white/52'
            }`}
          >
            ◀ 이전 단계
          </button>
          <button
            type="button"
            onClick={handleNextStage}
            disabled={!currentStage.nextStageId && currentStage.id !== lastStage.id}
            className={`rounded-2xl border px-5 py-2.5 text-sm font-semibold backdrop-blur-2xl backdrop-saturate-150 ring-1 transition shadow-[0_28px_56px_rgba(15,23,42,0.34),0_10px_22px_rgba(15,23,42,0.24)] ${
              !currentStage.nextStageId && currentStage.id !== lastStage.id
                ? 'cursor-not-allowed border-white/45 bg-white/25 text-slate-400 ring-white/35'
                : 'border-black bg-black text-white ring-black/10 hover:bg-black/90'
            }`}
          >
            다음 단계 ▶
          </button>
        </div>
      </div>
      {showIntroModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/72 px-4 backdrop-blur-md">
          <div className="w-full max-w-[760px] overflow-hidden rounded-3xl border border-white/30 bg-white/95 shadow-[0_35px_90px_rgba(15,23,42,0.45)]">
            <div className="px-6 py-7 text-center">
              <img src={willChainLogo} alt="WillChain 로고" className="mx-auto mb-4 h-28 w-28 object-contain" />
              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">안녕하세요, WillChain 시연 웹페이지입니다.</h3>
              <p className="mx-auto mt-4 max-w-[640px] text-sm leading-6 text-slate-700">
                본 웹페이지는 한화생명 미래금융인재 공모전을 위한 시연용 페이지이며, 실제 서비스가 아닙니다.
                <br />
                페이지에 나타나는 기관 및 기업은 이해를 돕기 위해 임의로 선정되었고, 제작자와 직접적인 연관이 없습니다.
                <br />
                인물들의 사진은 생성형 인공지능을 활용해 제작되었습니다.
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-900">Team 경통통</p>
            </div>
            <div className="border-t border-slate-200/80 bg-slate-50/80 px-6 py-4 text-center">
              <button
                type="button"
                onClick={() => setShowIntroModal(false)}
                className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                시작하기
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showScenarioEndModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/72 px-4 backdrop-blur-md">
          <div className="w-full max-w-[560px] overflow-hidden rounded-3xl border border-white/30 bg-white/95 shadow-[0_35px_90px_rgba(15,23,42,0.45)]">
            <div className="px-6 py-7 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700">
                ✓
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">WillChain을 사용해주셔서 감사합니다!</h3>
              <p className="mt-4 text-sm leading-6 text-slate-700">
                시연이 종료되었습니다.
                <br />
                저희가 준비한 시나리오는 여기까지입니다. 감사합니다.
              </p>
              <p className="mt-3 text-sm font-semibold text-slate-900">Team 경통통</p>
            </div>
            <div className="border-t border-slate-200/80 bg-slate-50/80 px-6 py-4 text-center">
              <button
                type="button"
                onClick={resetToFirstStage}
                className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                처음으로 돌아가기
              </button>
              <p className="mt-3 text-xs tracking-tight text-slate-900">제작 | 양현서</p>
              <a className="mt-3 text-xs tracking-tight text-slate-900" href="https://github.com/yanghyeonseo/WillChain-demo">Github | https://github.com/yanghyeonseo/WiilChain-demo </a>
            </div>
          </div>
        </div>
      ) : null}
      {hoverPreview ? (
        <div
          className="pointer-events-none fixed z-50 w-[460px] max-w-[min(460px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50/95 p-3 text-xs text-slate-800 shadow-xl backdrop-blur-sm font-mono"
          style={{
            left: Math.max(8, Math.min(hoverPosition.x + 16, window.innerWidth - 472)),
            top: Math.max(8, Math.min(hoverPosition.y + 16, window.innerHeight - 320)),
          }}
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold">{hoverPreview.title}</h3>
          </div>
          <div className="grid gap-1 text-[11px] leading-5">
            <p className="break-all"><strong>Prev_Block_Hash:</strong> {hoverPreview.prevBlockHash}</p>
            <p className="break-all"><strong>Block_Hash:</strong> {hoverPreview.blockHash}</p>
            <p className="break-all"><strong>Event_ID:</strong> {hoverPreview.eventId}</p>
            <p className="break-all"><strong>Event_Timestamp:</strong> {hoverPreview.eventTimestamp}</p>
            <p className="break-all"><strong>Event_Type:</strong> {hoverPreview.eventType}</p>
            <p className="break-all"><strong>Event_Data_Hash:</strong> {hoverPreview.eventDataHash}</p>
            <p className="break-all"><strong>Related_Will_ID:</strong> {hoverPreview.relatedWillId ?? '-'}</p>
            <p className="break-all"><strong>RWA_Tokens_ID:</strong> {hoverPreview.rwaTokensId?.join(', ') ?? '-'}</p>
            <p className="break-all"><strong>OffChain_Reference:</strong> {hoverPreview.offChainReference ?? '-'}</p>
            <p className="break-words"><strong>Approving_Parties:</strong> {hoverPreview.approvingParties.join(', ')}</p>
            <p className="break-words"><strong>Signature_Set:</strong> {hoverPreview.signatureSet.join(', ')}</p>
          </div>
          <div className="mt-2 rounded-xl border border-indigo-200 bg-white/80 p-2 font-sans">
            <p className="break-words text-center text-sm leading-6 text-slate-800">
              {hoverPreview.summary ?? '-'} [{hoverPreview.issuer ?? '-'} 발행]
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
