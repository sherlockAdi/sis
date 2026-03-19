import { env } from './config/env';
import { createApp } from './app';

export const app = createApp();

if (require.main === module) {
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

