export const Platform = {
  OS: "ios",
  select: (obj: any) => obj.ios ?? obj.default,
};
export const StyleSheet = { create: (styles: any) => styles };
export const Alert = { alert: () => {} };
export default {};
