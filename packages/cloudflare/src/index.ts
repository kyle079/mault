import { Container, getContainer } from "@cloudflare/containers";
import { containerEnvironment, type ServerEnvironment } from "./environment";
import { routeRequest } from "./routing";

interface Env extends ServerEnvironment {
  API: DurableObjectNamespace<MagicVaultApi>;
  ASSETS: Fetcher;
}

export class MagicVaultApi extends Container<Env> {
  defaultPort = 3001;
  enableInternet = true;
  sleepAfter = "10m";
  envVars = containerEnvironment(this.env);

  override async onActivityExpired() {
    // Sync jobs and SSE subscribers live in Node memory and may outlive requests.
    this.renewActivityTimeout();
  }
}

export default {
  fetch(request: Request, env: Env): Promise<Response> {
    // All organizations share the API's in-memory sync coordinator and streams.
    return routeRequest(request, env.ASSETS, () => getContainer(env.API, "magic-vault"));
  },
} satisfies ExportedHandler<Env>;
