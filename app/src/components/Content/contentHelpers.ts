import { BaseContentFields } from "src/api/fragments";

export const getDescription = (content: BaseContentFields) => {
  if (content.summary) return content.summary;
  if (content.ogDescription) return content.ogDescription;
  if (content.content)
    return (
      content.content.slice(0, 300) +
      (content.content.length > 300 ? "..." : "")
    );
  return "";
};
