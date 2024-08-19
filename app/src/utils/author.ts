export const extractDomain = (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split(".");
    if (parts.length > 2) {
      // Check for common subdomains
      if (parts[0] === "www" || parts[0] === "blog") {
        return parts[1];
      }
      // For other cases, join all parts except the last two
      return parts.slice(0, -2).join(".");
    }
    return parts[parts.length - 2];
  } catch {
    return url;
  }
};
