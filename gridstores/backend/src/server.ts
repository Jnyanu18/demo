import { app } from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";

const start = async (): Promise<void> => {
  try {
    await connectDatabase();
    app.listen(env.port, () => {
      console.log(`Grid Stores API listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start API", error);
    process.exit(1);
  }
};

void start();
