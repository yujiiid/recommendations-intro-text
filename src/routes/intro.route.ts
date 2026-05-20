import { Router } from 'express';
import { introRequestSchema } from '../schemas/intro.schema';
import { generateIntroText } from '../services/intro-generator.service';
import { fetchVideoById } from '../services/video-metadata-api.service';
import { ValidationError } from '../utils/errors';

export const introRouter = Router();

introRouter.post('/intro-text', async (req, res, next) => {
  const parsedBody = introRequestSchema.safeParse(req.body);

  if (!parsedBody.success) {
    const message = parsedBody.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    next(new ValidationError(message));
    return;
  }

  try {
    const { article, video, options } = parsedBody.data;
    const videoMetadata = await fetchVideoById(video.id);
    const introText = await generateIntroText({
      article,
      video: videoMetadata,
      options,
    });

    res.json({
      videoId: video.id,
      introText,
    });
  } catch (error) {
    next(error);
  }
});
