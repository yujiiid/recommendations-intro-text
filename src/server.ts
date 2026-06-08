import { app } from './app';
import { env } from './config/env';

const host = '0.0.0.0';

app.listen(env.PORT, host, () => {
  console.log(`Server is running on port ${env.PORT}`);
});
