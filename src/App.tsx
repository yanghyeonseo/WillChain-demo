import { useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { participantProfiles, stageDefinitions } from './data/willchainDemoScenario';
import type { ActorId, ParticipantId, StageDefinition, StatusTone } from './types/scenario';

const toneClasses: Record<StatusTone, string> = {
  gray: 'border-slate-300 bg-slate-50 text-slate-700',
  yellow: 'border-amber-300 bg-amber-50 text-amber-800',
  green: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  blue: 'border-blue-300 bg-blue-50 text-blue-800',
  purple: 'border-indigo-300 bg-indigo-50 text-indigo-800',
  red: 'border-rose-300 bg-rose-50 text-rose-800',
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
    setCurrentStageId(stageId);
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
    if (currentStage.type === 'real_event_stage') {
      transitionTo(currentStage.nextStageId);
      return;
    }
    if (currentStage.type === 'block_commit_stage' && isCommitted) {
      transitionTo(currentStage.nextStageId);
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
    let colIndex = 0;
    let prevLane: 'real' | 'chain' | null = null;

    for (const stage of stageDefinitions) {
      if (stage.timelineLane === 'real') {
        colIndex += 1;
        columns[colIndex - 1] = columns[colIndex - 1] ?? {};
        columns[colIndex - 1].real = stage;
        prevLane = 'real';
      } else {
        if (prevLane === 'chain') {
          colIndex += 1;
        } else if (colIndex === 0) {
          colIndex = 1;
        }
        columns[colIndex - 1] = columns[colIndex - 1] ?? {};
        columns[colIndex - 1].chain = stage;
        prevLane = 'chain';
      }
    }

    return columns;
  }, []);
  const maxIndex = timelineColumns.length - 1;
  const laneFillPercent = (lane: 'real' | 'chain') => {
    const idx = timelineColumns.reduce((acc, column, i) => {
      const stage = lane === 'real' ? column.real : column.chain;
      if (stage && stage.order <= currentStage.order) return i;
      return acc;
    }, -1);
    if (idx < 0 || maxIndex <= 0) return 0;
    return ((idx + 0.5) / timelineColumns.length) * 100;
  };
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
  const assigneeOneAction = currentStage.activeParticipants.find(
    (row) => row.participantId === 'assignee_1',
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,#dbeafe_0,#f8fafc_42%,#f1f5f9_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-4">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">WillChain Scenario Timeline</p>

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
                      className="min-h-8 px-1 text-center text-[11px] leading-4 text-slate-700"
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
                  <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-300" />
                  <div
                    className="pointer-events-none absolute left-0 top-1/2 h-px -translate-y-1/2 bg-emerald-500"
                    style={{ width: `${laneFillPercent('chain')}%` }}
                  />
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
                      className="min-h-8 px-1 text-center text-[11px] leading-4 text-slate-700"
                    >
                      {column.chain ? timelineLabel(column.chain) : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="grid gap-4 xl:grid-cols-[1.05fr_1.2fr_1fr]">
          <section className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl backdrop-blur">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">Participants</p>
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
                const imageScale = profile?.imageScale && profile.imageScale > 0 ? profile.imageScale : 1;
                const imageOffsetXPercent = profile?.imageOffsetXPercent ?? 0;
                const imageOffsetYPercent = profile?.imageOffsetYPercent ?? 0;

                return (
                  <article
                    key={actor}
                    className={`flex items-center gap-3 px-1 py-2 transition ${active ? '' : 'opacity-45 grayscale'}`}
                  >
                    <div className="flex min-w-[68px] flex-col items-center">
                      {profile?.imageSrc ? (
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
                            src={profile.imageSrc}
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

          <section className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl backdrop-blur">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">World State</p>
                <h2 className="text-lg font-semibold">현실 세계 상태 패널</h2>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                {currentStage.longTitle}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {currentStage.assetStates.map((asset) => (
                <article
                  key={asset.assetId}
                  className={`rounded-2xl border p-3 ${toneClasses[asset.tone]} ${
                    (currentStage.order === 12 || currentStage.order === 19 || currentStage.order === 21) &&
                    (asset.assetId === 'rwa_tokens' || asset.assetId === 'donor_account' || asset.assetId === 'assignee_1_account')
                      ? 'animate-value-shift'
                      : ''
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{asset.title}</h3>
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold">
                      {asset.statusText}
                    </span>
                  </div>
                  {asset.valueLabel ? <p className="text-base font-semibold">{asset.valueLabel}</p> : null}
                  {asset.helperText ? <p className="mt-1 text-xs leading-5">{asset.helperText}</p> : null}
                  <p className="mt-2 text-[11px] text-slate-500">업데이트: {asset.lastUpdated}</p>
                </article>
              ))}
            </div>

          </section>

          <section className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-xl backdrop-blur">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">User Device</p>
              <h2 className="text-lg font-semibold">사용자 안내 UI</h2>
            </div>

            <div className="rounded-[2rem] border-8 border-slate-900 bg-slate-950 p-2 shadow-2xl">
              <div className="max-h-[670px] overflow-y-auto rounded-[1.4rem] bg-slate-50 p-3">
                <header className="mb-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">진행 현황</p>
                  <h3 className="text-sm font-semibold text-slate-900">{currentStage.shortTitle}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{currentStage.description}</p>
                  <div className="mt-2 flex gap-2 text-[11px]">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700">{currentStage.date}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                      {currentStage.type === 'real_event_stage' ? '현실 이벤트' : '온체인 블록'}
                    </span>
                  </div>
                </header>

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
                  <section className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-800">승인 진행 상태</p>
                    <p className="mt-1 text-xs text-amber-900">
                      {currentApprovals.length} / {(currentStage.requiredApprovals ?? []).length} 승인 완료
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-amber-100">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all"
                        style={{
                          width: `${
                            (currentApprovals.length /
                              Math.max((currentStage.requiredApprovals ?? []).length, 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </section>
                ) : null}

                {assigneeOneAction ? (
                  <section className="mb-3 rounded-2xl border border-sky-200 bg-sky-50 p-3">
                    <p className="text-xs font-semibold text-sky-700">양수인 본인 상태</p>
                    <p className="mt-1 text-xs leading-5 text-slate-700">{assigneeOneAction.description}</p>
                  </section>
                ) : null}

                {userSideApprovers.length > 0 ? (
                  <section className="mb-3 rounded-2xl border border-blue-200 bg-white p-3 shadow-sm">
                    <p className="text-xs font-semibold text-blue-700">당사자 승인 팝업</p>
                    <div className="mt-2 space-y-2">
                      {userSideApprovers.map((participantId) => {
                        const action = currentStage.activeParticipants.find(
                          (row) => row.participantId === participantId,
                        );
                        const approved = currentApprovals.includes(participantId);
                        return (
                          <div
                            key={`user-approve-${participantId}`}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-2"
                          >
                            <p className="text-[11px] font-semibold text-slate-800">
                              {actorName[participantId]}
                            </p>
                            <p className="mt-1 text-[11px] leading-5 text-slate-600">
                              {action?.description ?? '승인 요청이 도착했습니다.'}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleApprove(participantId)}
                              disabled={approved}
                              className={`mt-2 rounded-xl px-3 py-1.5 text-xs font-semibold ${
                                approved
                                  ? 'cursor-not-allowed border border-emerald-200 bg-emerald-100 text-emerald-700'
                                  : 'border border-blue-300 bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {approved ? '승인됨' : '승인'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                <section className="rounded-2xl border border-slate-200 bg-white p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">활동 로그</h4>
                  <div className="mt-2 space-y-2">
                    {currentStage.userLogCards.length === 0 ? (
                      <p className="text-xs text-slate-500">누적 로그가 아직 없습니다.</p>
                    ) : (
                      currentStage.userLogCards.map((log) => (
                        <article key={log.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-900">{log.title}</p>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              완료
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] leading-5 text-slate-600">{log.description}</p>
                          <p className="mt-1 text-[10px] font-medium text-slate-500">{log.date}</p>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          </section>
        </main>

        <footer className="rounded-3xl border border-white/70 bg-white/85 p-3 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => transitionTo(currentStage.previousStageId)}
              disabled={currentStage.id === firstStage.id}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                currentStage.id === firstStage.id
                  ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                  : 'bg-slate-900 text-white hover:bg-slate-700'
              }`}
            >
              이전 단계
            </button>
            <p className="text-sm text-slate-600">
              {currentStage.order}. {currentStage.timelineLabel} ({currentStage.date})
            </p>
            <button
              type="button"
              onClick={() => transitionTo(currentStage.nextStageId)}
              disabled={currentStage.id === lastStage.id}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                currentStage.id === lastStage.id
                  ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              다음 단계
            </button>
          </div>
        </footer>
      </div>
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
