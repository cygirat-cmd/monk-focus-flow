export type Provider = 'mock' | 'admob' | 'gpt';

export const ADS_CONFIG: {
  provider: Provider;
  admob?: { appId: string; rewardedUnitId: string };
} = {
  // Note: AdMob is for native mobile apps. This web app uses a mock provider.
  // To enable real web rewarded ads, switch to 'gpt' and integrate Google Ad Manager/IMA.
  provider: 'mock',
  admob: {
    appId: 'ca-app-pub-7576669421392770~6738536185',
    rewardedUnitId: 'ca-app-pub-7576669421392770/9173127830',
  },
};
