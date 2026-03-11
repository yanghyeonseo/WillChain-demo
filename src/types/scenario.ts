export type StageType = 'real_event_stage' | 'block_commit_stage';

export type TimelineLane = 'real' | 'chain';

export type ParticipantId =
  | 'supreme_court'
  | 'nts'
  | 'family_court'
  | 'ksd'
  | 'bank'
  | 'insurer'
  | 'medical'
  | 'executor'
  | 'donor'
  | 'assignee_1'
  | 'assignee_2';

export type ActorId = ParticipantId | 'smart_contract';

export type AssetCardId =
  | 'will_document'
  | 'asset_registry'
  | 'smart_contract'
  | 'rwa_tokens'
  | 'donor_account'
  | 'assignee_1_account'
  | 'assignee_2_account'
  | 'insurance_payout'
  | 'post_process_status';

export type StatusTone = 'gray' | 'yellow' | 'green' | 'blue' | 'purple' | 'red';

export type ApprovalButtonType = 'approve' | 'approved' | 'issued' | 'none';

export type UserActionType =
  | 'join'
  | 'draft_will'
  | 'register_assets'
  | 'create_smart_contract'
  | 'request_will_registration'
  | 'amend_will'
  | 'reregister_assets'
  | 'amend_smart_contract'
  | 'request_tokenization'
  | 'execute_lifetime_gift'
  | 'confirm_death_notice'
  | 'auto_open_will'
  | 'execute_insurance_payout'
  | 'execute_inheritance'
  | 'participant_approval';

export type BlockEventType =
  | 'Will_Registration_Event'
  | 'Will_Amendment_Event'
  | 'Death_Confirmation_Event'
  | 'Post_Process_Initiation_Event'
  | 'RWA_Tokenization_Event'
  | 'Will_Access_Authorization_Event'
  | 'Gift_Execution_Event'
  | 'Inheritance_Execution_Event'
  | 'Insurance_Payout_Event';

export interface ParticipantProfile {
  id: ParticipantId;
  name: string;
  shortName: string;
  category: string;
  imageSrc?: string;
  imageScale?: number;
  imageOffsetXPercent?: number;
  imageOffsetYPercent?: number;
}

export interface ParticipantActionState {
  participantId: ActorId;
  isActive: boolean;
  isFocused?: boolean;
  description?: string;
  buttonType?: ApprovalButtonType;
  buttonLabel?: '승인' | '승인됨' | '발행됨';
  buttonDisabled?: boolean;
}

export interface AssetState {
  assetId: AssetCardId;
  title: string;
  statusText: string;
  tone: StatusTone;
  helperText?: string;
  valueLabel?: string;
  lastUpdated?: string;
}

export interface UserLogCard {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'completed' | 'current' | 'pending';
  icon: string;
  stageOrder?: number;
}

export interface UserModal {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  actionType?: UserActionType;
}

export interface BlockPreview {
  title: string;
  status: 'Pending Signatures' | 'Committed';
  prevBlockHash: string;
  eventId: string;
  eventTimestamp: string;
  eventType: BlockEventType;
  eventDataHash: string;
  relatedWillId?: string;
  rwaTokensId?: string[];
  offChainReference?: string;
  approvingParties: string[];
  signatureSet: string[];
  blockHash: string;
  summary?: string;
  issuer?: string;
}

export interface StageDefinition {
  id: string;
  order: number;
  type: StageType;
  timelineLane: TimelineLane;
  timelineLabel: string;
  timelineAnchorRealStageId?: string;
  date: string;
  shortTitle: string;
  longTitle: string;
  description: string;
  autoAdvanceTo?: string;
  previousStageId?: string;
  nextStageId?: string;
  activeParticipants: ParticipantActionState[];
  assetStates: AssetState[];
  userLogCards: UserLogCard[];
  userModal?: UserModal;
  blockPreview?: BlockPreview;
  requiredApprovals?: ParticipantId[];
  issuedBy?: ActorId;
}
