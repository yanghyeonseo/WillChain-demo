import type { ParticipantProfile } from '../../types/scenario';

export const participantProfiles: ParticipantProfile[] = [
  { id: 'insurer', name: '한화생명', shortName: '한화생명', category: '보험사', imageSrc: 'src/assets/insurer.svg', imageScale: 0.8 },
  { id: 'donor', name: '양도인', shortName: '양도인', category: '당사자', imageSrc: 'src/assets/donor.png', imageScale: 1, imageOffsetYPercent: 4 },
  { id: 'assignee_1', name: '양수인 본인', shortName: '본인', category: '양수인 본인', imageSrc: 'src/assets/assignee_1.png', imageScale: 1, imageOffsetYPercent: 4 },
  { id: 'assignee_2', name: '타 양수인', shortName: '타 양수인', category: '타 양수인', imageSrc: 'src/assets/assignee_2.png', imageScale: 1, imageOffsetYPercent: 4 },
  { id: 'executor', name: '유언집행자', shortName: '집행자', category: '집행주체', imageSrc: 'src/assets/executor.png', imageScale: 1, imageOffsetYPercent: 4 },
  { id: 'supreme_court', name: '대법원', shortName: '대법원', category: '국가기관', imageSrc: 'src/assets/supreme_court.png', imageScale: 0.9, imageOffsetXPercent: 2.5 },
  { id: 'nts', name: '국세청', shortName: '국세청', category: '국가기관', imageSrc: 'src/assets/nts.png', imageScale: 1 },
  // { id: 'family_court', name: '가정법원', shortName: '가정법원', category: '국가기관', imageSrc: '', imageScale: 1 },
  { id: 'bank', name: 'KB국민은행', shortName: 'KB', category: '은행', imageSrc: 'src/assets/bank.webp', imageScale: 0.6 },
  { id: 'medical', name: '아산병원', shortName: '아산병원', category: '의료기관', imageSrc: 'src/assets/medical.gif', imageScale: 0.8 },
  { id: 'ksd', name: '예탁결제원', shortName: 'KSD', category: '예탁결제원', imageSrc: 'src/assets/ksd.svg', imageScale: 1.8 },
];
