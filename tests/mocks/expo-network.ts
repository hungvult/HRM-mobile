export enum NetworkStateType {
  NONE = "NONE",
  UNKNOWN = "UNKNOWN",
  CELLULAR = "CELLULAR",
  WIFI = "WIFI",
  BLUETOOTH = "BLUETOOTH",
  ETHERNET = "ETHERNET",
  WIMAX = "WIMAX",
  VPN = "VPN",
  OTHER = "OTHER",
}

export let mockNetworkType: NetworkStateType = NetworkStateType.WIFI;
export let mockIsConnected: boolean = true;

export const setMockNetworkType = (type: NetworkStateType) => {
  mockNetworkType = type;
};

export const setMockIsConnected = (connected: boolean) => {
  mockIsConnected = connected;
};

export const getNetworkStateAsync = async () => ({
  type: mockNetworkType,
  isConnected: mockIsConnected,
  isInternetReachable: mockIsConnected,
});

export const addNetworkStateListener = (_callback: (event: any) => void) => {
  return {
    remove: () => {},
  };
};
