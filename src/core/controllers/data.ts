import { Container } from "typedi";
import { Request, Response } from "express";

import FakeDatabaseService from "../services/fake-database-service";
import BrokerService from "../services/broker-service";

export const getAllFakeData = async (request: Request, response: Response) => {
  const fakeDatabaseService: FakeDatabaseService =
    Container.get(FakeDatabaseService);

  const brokerService: BrokerService = Container.get(BrokerService);

  response.send({
    ourAccount: fakeDatabaseService.ourAccount,
    users: fakeDatabaseService.users,
    assets: brokerService.fakeAssets,
  });
};
