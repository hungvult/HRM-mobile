export enum PermissionStatus {
  GRANTED = "granted",
  DENIED = "denied",
  UNDETERMINED = "undetermined",
}

export enum Accuracy {
  Lowest = 1,
  Low = 2,
  Balanced = 3,
  High = 4,
  Highest = 5,
  BestForNavigation = 6,
}

export let mockPermissionStatus: PermissionStatus = PermissionStatus.GRANTED;
export let mockServicesEnabled: boolean = true;
export let mockCoords = { latitude: 10.776889, longitude: 106.700806 };

export const setMockPermissionStatus = (status: PermissionStatus) => {
  mockPermissionStatus = status;
};

export const setMockServicesEnabled = (enabled: boolean) => {
  mockServicesEnabled = enabled;
};

export const setMockCoords = (coords: {
  latitude: number;
  longitude: number;
}) => {
  mockCoords = coords;
};

export const getForegroundPermissionsAsync = async () => ({
  status: mockPermissionStatus,
});

export const requestForegroundPermissionsAsync = async () => ({
  status: mockPermissionStatus,
});

export const hasServicesEnabledAsync = async () => mockServicesEnabled;

export const getCurrentPositionAsync = async (_opts?: any) => ({
  coords: { ...mockCoords, altitude: 0, accuracy: 5, heading: 0, speed: 0 },
  timestamp: Date.now(),
});
