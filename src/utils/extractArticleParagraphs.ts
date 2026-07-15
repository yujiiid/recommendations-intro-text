const decodeHtmlEntities = (text: string): string => {
  const namedEntities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  };

  const withNamedEntities = Object.entries(namedEntities).reduce(
    (accumulator, [entity, value]) => accumulator.split(entity).join(value),
    text,
  );

  const decodeCodePoint = (
    rawCode: string,
    radix: number,
    fallback: string,
  ): string => {
    const parsedCode = Number.parseInt(rawCode, radix);

    if (
      Number.isNaN(parsedCode) ||
      parsedCode < 0 ||
      parsedCode > 0x10ffff
    ) {
      return fallback;
    }

    try {
      return String.fromCodePoint(parsedCode);
    } catch {
      return fallback;
    }
  };

  return withNamedEntities
    .replace(/&#(\d+);/g, (_match, code) => {
      return decodeCodePoint(code, 10, _match);
    })
    .replace(/&#x([\da-f]+);/gi, (_match, code) => {
      return decodeCodePoint(code, 16, _match);
    });
};

export const extractArticleParagraphs = (html: string): string[] => {
  const paragraphRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs: string[] = [];

  for (const match of html.matchAll(paragraphRegex)) {
    const paragraphHtml = match[1];
    const paragraphText = decodeHtmlEntities(
      paragraphHtml
        .replace(/<br\s*\/?\s*>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .trim(),
    )
      .replace(/\s+/g, ' ')
      .trim();

    if (paragraphText) {
      paragraphs.push(paragraphText);
    }
  }

  return paragraphs;
};
