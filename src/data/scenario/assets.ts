import type { AssetCardId, AssetState } from '../../types/scenario';

const assetTitles: Record<AssetCardId, string> = {
  will_document: '유언장',
  asset_registry: '자산 등록부',
  smart_contract: '스마트 컨트랙트',
  rwa_tokens: '실물자산토큰',
  donor_account: '양도인 계좌',
  assignee_1_account: '양수인 본인 계좌',
  assignee_2_account: '타 양수인 계좌',
  insurance_payout: '보험금 상태',
  post_process_status: '사후 절차 상태',
};

const baseAssets: AssetState[] = [
  {
    assetId: 'will_document',
    title: assetTitles.will_document,
    statusText: '미등록',
    tone: 'gray',
    helperText: '작성/등록 전 상태입니다.',
  },
  {
    assetId: 'asset_registry',
    title: assetTitles.asset_registry,
    statusText: '미등록',
    tone: 'gray',
    helperText: '부동산, 자동차, 예금 정보가 아직 입력되지 않았습니다.',
  },
  {
    assetId: 'smart_contract',
    title: assetTitles.smart_contract,
    statusText: '미설정',
    tone: 'gray',
    helperText: '자동 집행 규칙이 아직 없습니다.',
  },
  {
    assetId: 'rwa_tokens',
    title: assetTitles.rwa_tokens,
    statusText: '미발행',
    tone: 'gray',
    helperText: '토큰화가 시작되지 않았습니다.',
  },
  {
    assetId: 'donor_account',
    title: assetTitles.donor_account,
    statusText: '활성',
    tone: 'blue',
    valueLabel: '₩1,000,000,000',
  },
  {
    assetId: 'assignee_1_account',
    title: assetTitles.assignee_1_account,
    statusText: '수령 대기',
    tone: 'gray',
    valueLabel: '₩0',
  },
  {
    assetId: 'assignee_2_account',
    title: assetTitles.assignee_2_account,
    statusText: '수령 대기',
    tone: 'gray',
    valueLabel: '₩0',
  },
  {
    assetId: 'insurance_payout',
    title: assetTitles.insurance_payout,
    statusText: '지급 전',
    tone: 'gray',
    helperText: '사망 확인 후 지급 심사가 시작됩니다.',
    valueLabel: '₩300,000,000',
  },
  {
    assetId: 'post_process_status',
    title: assetTitles.post_process_status,
    statusText: '생전 단계',
    tone: 'blue',
    helperText: '사후 절차는 아직 시작되지 않았습니다.',
  },
];

export const createAssetMerger = () => {
  let previousAssetsSnapshot: AssetState[] = baseAssets.map((asset) => ({ ...asset }));

  return (
    overrides: Partial<Record<AssetCardId, Partial<AssetState>>>,
    updatedAt: string,
  ): AssetState[] => {
    const nextAssets = previousAssetsSnapshot.map((asset) => {
      const override = overrides[asset.assetId] ?? {};
      const hasStatusOverride = Object.prototype.hasOwnProperty.call(override, 'statusText');
      const hasHelperOverride = Object.prototype.hasOwnProperty.call(override, 'helperText');
      return {
        ...asset,
        ...(hasStatusOverride && !hasHelperOverride ? { helperText: undefined } : {}),
        ...override,
        title: assetTitles[asset.assetId],
        lastUpdated: override.lastUpdated ?? updatedAt,
      };
    });

    previousAssetsSnapshot = nextAssets.map((asset) => ({ ...asset }));
    return nextAssets;
  };
};
