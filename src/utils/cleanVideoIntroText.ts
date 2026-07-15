export const cleanVideoIntroText = (text: string): string => {
  return text
    .trim()
    .replace(/^```(?:text)?/i, '')
    .replace(/```$/i, '')
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .trim();
};
