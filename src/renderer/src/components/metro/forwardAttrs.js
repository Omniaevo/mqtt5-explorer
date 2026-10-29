/** Attributes for the inner element: everything except class and style, which stay on the root. */
export const withoutClassAndStyle = (attrs) =>
  Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style")
  );
