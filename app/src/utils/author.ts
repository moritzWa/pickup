export const extractDomain = (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split(".");
    return parts.slice(-2, -1)[0];
  } catch {
    return url;
  }
};
