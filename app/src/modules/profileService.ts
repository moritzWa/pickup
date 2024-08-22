const getInitials = (name: string, username: string) => {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .join("") ||
    username.slice(0, 2) ||
    "?"
  ); // Fallback to username, otherwise "?"
};

export const ProfileService = {
  getInitials,
};
