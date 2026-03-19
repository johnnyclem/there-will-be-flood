import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(import.meta.dirname, '..', '..', '..', '.env') });

import app from "./app";

const rawPort = process.env["API_PORT"] || process.env["PORT"] || "3001";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
