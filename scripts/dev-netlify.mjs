import { createServer } from "node:net";
import { spawn } from "node:child_process";

const DEV_PORT_CANDIDATES = [8888, 8889, 8890, 8891, 9000];
const TARGET_PORT_CANDIDATES = [8080, 8081, 8082, 5173, 5174];

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen({ port, host: "127.0.0.1" }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function findFreePort(candidates, label) {
  for (const port of candidates) {
    if (await isPortFree(port)) {
      return port;
    }
  }
  throw new Error(`Nenhuma porta livre encontrada para ${label}.`);
}

async function main() {
  const devPort = await findFreePort(DEV_PORT_CANDIDATES, "Netlify Dev");
  const targetPort = await findFreePort(TARGET_PORT_CANDIDATES, "Vite");

  console.log(`Netlify Dev porta: ${devPort}`);
  console.log(`Vite porta: ${targetPort}`);

  const child = spawn(
    "netlify",
    [
      "dev",
      "--port",
      String(devPort),
      "--targetPort",
      String(targetPort),
      "--command",
      `vite --strictPort --port ${targetPort}`,
    ],
    { stdio: "inherit", shell: true },
  );

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
