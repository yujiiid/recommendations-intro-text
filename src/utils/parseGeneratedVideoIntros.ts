import { z } from 'zod';
import { cleanVideoIntroText } from './cleanVideoIntroText';
import { ExternalApiError } from './errors';

export const generatedVideoIntrosSchema = z.array(
  z
    .object({
      id: z.string().min(1),
      introText: z.string().min(1),
    })
    .strict(),
);

export interface GeneratedVideoIntro {
  id: string;
  introText: string;
}

export const validateAndOrderGeneratedVideoIntros = (
  generatedVideoIntros: z.infer<typeof generatedVideoIntrosSchema>,
  expectedVideoIds: string[],
): GeneratedVideoIntro[] => {
  const introTextByVideoId = new Map(
    generatedVideoIntros.map(({ id, introText }) => [
      id,
      cleanVideoIntroText(introText),
    ]),
  );

  if (
    generatedVideoIntros.length !== expectedVideoIds.length ||
    introTextByVideoId.size !== generatedVideoIntros.length
  ) {
    throw new ExternalApiError('AI Gateway returned invalid video intros');
  }

  return expectedVideoIds.map((id) => {
    const introText = introTextByVideoId.get(id);

    if (!introText) {
      throw new ExternalApiError('AI Gateway returned invalid video intros');
    }

    return { id, introText };
  });
};
