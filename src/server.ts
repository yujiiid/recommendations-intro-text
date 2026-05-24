import { app } from './app';
import { env } from './config/env';

const startServer = (port: number) => {
  const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Trying http://localhost:${nextPort}`);
      startServer(nextPort);
      return;
    }

    throw error;
  });
};

startServer(env.PORT);
