import { Router } from 'express';
import { introRequestSchema } from '../schemas/intro.schema';
import { generateIntroText } from '../services/intro-generator.service';
import { fetchBestRelatedVideoId } from '../services/related-videos-api.service';
import { fetchVideoById } from '../services/video-metadata-api.service';
import { ValidationError } from '../utils/errors';

export const introRouter = Router();

introRouter.post('/intro-text', async (req, res, next) => {
  const parsedBody = introRequestSchema.safeParse(req.body);
  console.log('-------------')
  console.log(parsedBody.data)
  console.log('-------------')


  if (!parsedBody.success) {
    const message = parsedBody.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    next(new ValidationError(message));
    return;
  }

  try {
    const { article, options } = parsedBody.data;
    const videoId = await fetchBestRelatedVideoId(article.url);
    const videoMetadata = await fetchVideoById(videoId);
    const introText = await generateIntroText({
      article,
      video: videoMetadata,
      options,
    });

    res.json({
      videoId,
      introText,
    });
  } catch (error) {
    next(error);
  }
});
