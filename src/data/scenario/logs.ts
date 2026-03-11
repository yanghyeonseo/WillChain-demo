import type { UserLogCard } from '../../types/scenario';

const logMilestones: Array<{
  id: string;
  stageOrder: number;
  title: string;
  description: string;
  date: string;
  icon: string;
}> = [
  {
    id: 'log_join',
    stageOrder: 1,
    title: 'WillChain 가입 완료',
    description: '상속·증여 절차를 위한 기본 계정과 참여자 연결이 생성되었습니다.',
    date: '24.01.06',
    icon: 'ID',
  },
  {
    id: 'log_draft_will',
    stageOrder: 2,
    title: '유언 초안 작성 완료',
    description: '유언 초안이 작성되었습니다. 온체인 등록 전 상태입니다. 보험사에 방문하여 유언 작성을 확정해주세요.',
    date: '24.02.15',
    icon: 'WL',
  },
  {
    id: 'log_register_assets',
    stageOrder: 3,
    title: '자산 등록 완료',
    description: '상속·증여 대상 자산이 등록되었습니다.',
    date: '24.02.16',
    icon: 'AS',
  },
  {
    id: 'log_smart_contract',
    stageOrder: 4,
    title: '스마트 컨트랙트 작성 완료',
    description: '유언/자산 정보를 바탕으로 보험사 시스템에서 스마트 컨트랙트가 자동 작성되었습니다.',
    date: '24.02.16',
    icon: 'SC',
  },
  {
    id: 'log_will_registered',
    stageOrder: 5,
    title: '유언 등록 이벤트 기록 완료',
    description: '유언이 등록되었습니다. 유언의 존재와 시점이 원장에 기록되었습니다.',
    date: '24.02.16',
    icon: 'BC',
  },
  {
    id: 'log_amend_will',
    stageOrder: 6,
    title: '유언 수정 완료',
    description: '유언 수정본이 생성되었습니다. 최신 버전 등록 대기 중입니다.',
    date: '25.03.02',
    icon: 'AM',
  },
  {
    id: 'log_reregister_assets',
    stageOrder: 7,
    title: '자산 재등록 완료',
    description: '수정된 자산 정보가 재등록되었습니다.',
    date: '25.03.03',
    icon: 'AR',
  },
  {
    id: 'log_amend_contract',
    stageOrder: 8,
    title: '스마트 컨트랙트 수정 완료',
    description: '수정된 유언/자산 정보를 반영해 보험사 시스템에서 스마트 컨트랙트가 자동 수정되었습니다.',
    date: '25.03.03',
    icon: 'UP',
  },
  {
    id: 'log_amendment_block',
    stageOrder: 9,
    title: '유언 수정 이벤트 기록 완료',
    description: '최신 유언 버전이 원장에 기록되었습니다.',
    date: '25.03.03',
    icon: 'BC',
  },
  {
    id: 'log_tokenization',
    stageOrder: 11,
    title: '실물자산토큰 발행 완료',
    description: '재산 토큰화 이벤트가 원장에 기록되었습니다.',
    date: '25.04.02',
    icon: 'TK',
  },
  {
    id: 'log_gift',
    stageOrder: 13,
    title: '생전 증여 집행 완료',
    description: '생전 증여가 집행되었습니다. 온체인 기록을 위한 승인 절차가 완료되었습니다.',
    date: '25.04.02',
    icon: 'GF',
  },
  {
    id: 'log_death',
    stageOrder: 15,
    title: '사망 확인 완료',
    description: '사망 확인 이벤트가 원장에 기록되었습니다.',
    date: '26.03.18',
    icon: 'DT',
  },
  {
    id: 'log_post_process',
    stageOrder: 16,
    title: '사후 절차 개시 완료',
    description: '사후 절차 개시 이벤트가 원장에 기록되었습니다.',
    date: '26.03.19',
    icon: 'PP',
  },
  {
    id: 'log_will_access',
    stageOrder: 18,
    title: '유언 자동 열람 완료',
    description: '사후 절차 개시 이후 유언이 자동 열람되었습니다.',
    date: '26.03.19',
    icon: 'OP',
  },
  {
    id: 'log_insurance',
    stageOrder: 20,
    title: '보험금 지급 완료',
    description: '보험금 지급이 완료되어 이벤트가 원장에 기록되었습니다.',
    date: '26.03.20',
    icon: 'IP',
  },
  {
    id: 'log_inheritance',
    stageOrder: 22,
    title: '상속 집행 완료',
    description: '상속 집행 이벤트가 원장에 기록되었습니다. 전체 절차가 종료되었습니다.',
    date: '26.03.25',
    icon: 'IN',
  },
];

export const createLogsUntil = () => {
  return (order: number): UserLogCard[] => {
    return logMilestones
      .filter((log) => log.stageOrder <= order)
      .map((log) => ({
        id: log.id,
        title: log.title,
        description: log.description,
        date: log.date,
        icon: log.icon,
        status: 'completed',
        stageOrder: log.stageOrder,
      }));
  };
};
