import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { execSync } from "node:child_process";

const DEV_PORT = 8888;
const TARGET_PORT_CANDIDATES = [8080, 8081, 8082, 5173, 5174];

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen({ port }, () => {
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
  const devPortFree = await isPortFree(DEV_PORT);
  if (!devPortFree) {
    try {
      const pidList = execSync(`lsof -ti tcp:${DEV_PORT} -sTCP:LISTEN`, {
        encoding: "utf8",
      })
        .split("\n")
        .map((pid) => pid.trim())
        .filter(Boolean);

      if (pidList.length > 0) {
        execSync(`kill -9 ${pidList.join(" ")}`);
      }
    } catch {
      // If lsof/kill fails, let Netlify report the port issue.
    }
  }

  const devPort = DEV_PORT;
  const targetPort = await findFreePort(TARGET_PORT_CANDIDATES, "Vite");

  console.log(`Netlify Dev porta: ${devPort}`);
  console.log(`Vite porta: ${targetPort}`);

  const command = `netlify dev --port ${devPort} --target-port ${targetPort} --command "vite --port ${targetPort}"`;
  const child = spawn(command, { stdio: "inherit", shell: true });

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
