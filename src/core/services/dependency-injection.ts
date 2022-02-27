import { Container } from "typedi";
import { Env } from "../types/env";
import BrokerService from "./broker-service";
import FakeDatabaseService from "./fake-database-service";
import FreeSharesService from "./free-shares-service";

export function initializeDI(env: Env): void {
  const fakeDatabaseService = new FakeDatabaseService();
  Container.set(FakeDatabaseService, fakeDatabaseService);

  const brokerService = new BrokerService(fakeDatabaseService);
  Container.set(BrokerService, brokerService);

  const freeSharesService = new FreeSharesService(brokerService, env);
  Container.set(FreeSharesService, freeSharesService);
}
