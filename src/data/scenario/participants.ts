import type { ParticipantProfile } from '../../types/scenario';
import insurerImage from '../../assets/insurer.svg';
import donorImage from '../../assets/donor.png';
import assignee1Image from '../../assets/assignee_1.png';
import assignee2Image from '../../assets/assignee_2.png';
import executorImage from '../../assets/executor.png';
import supremeCourtImage from '../../assets/supreme_court.png';
import ntsImage from '../../assets/nts.png';
import bankImage from '../../assets/bank.webp';
import medicalImage from '../../assets/medical.gif';
import ksdImage from '../../assets/ksd.svg';

export const participantProfiles: ParticipantProfile[] = [
  { id: 'insurer', name: '한화생명', shortName: '한화생명', category: '보험사', imageSrc: insurerImage, imageScale: 0.8 },
  { id: 'donor', name: '양도인', shortName: '양도인', category: 'WillChain 가입자', imageSrc: donorImage, imageScale: 1, imageOffsetYPercent: 4 },
  { id: 'assignee_1', name: '양수인 본인', shortName: '본인', category: '양수인 본인', imageSrc: assignee1Image, imageScale: 1, imageOffsetYPercent: 4 },
  { id: 'assignee_2', name: '타 양수인', shortName: '양수인', category: '양수인', imageSrc: assignee2Image, imageScale: 1, imageOffsetYPercent: 4 },
  { id: 'executor', name: '유언집행자', shortName: '유언집행자', category: '유언집행자', imageSrc: executorImage, imageScale: 1, imageOffsetYPercent: 4 },
  { id: 'supreme_court', name: '대법원', shortName: '대법원', category: '국가기관', imageSrc: supremeCourtImage, imageScale: 0.9, imageOffsetXPercent: 2.5 },
  { id: 'nts', name: '국세청', shortName: '국세청', category: '국가기관', imageSrc: ntsImage, imageScale: 1 },
  // { id: 'family_court', name: '가정법원', shortName: '가정법원', category: '국가기관', imageSrc: '', imageScale: 1 },
  { id: 'bank', name: 'KB국민은행', shortName: 'KB', category: '은행', imageSrc: bankImage, imageScale: 0.6 },
  { id: 'medical', name: '아산병원', shortName: '아산병원', category: '의료기관', imageSrc: medicalImage, imageScale: 0.8 },
  { id: 'ksd', name: '예탁결제원', shortName: 'KSD', category: '예탁결제원', imageSrc: ksdImage, imageScale: 1.8 },
];
