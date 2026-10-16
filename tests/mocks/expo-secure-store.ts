let storedToken: string | null = "mock-jwt-access-token";

export const getItemAsync = async (_key: string): Promise<string | null> => {
  return storedToken;
};

export const setItemAsync = async (
  _key: string,
  val: string,
): Promise<void> => {
  storedToken = val;
};

export const deleteItemAsync = async (_key: string): Promise<void> => {
  storedToken = null;
};
