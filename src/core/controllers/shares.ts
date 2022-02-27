import { Container } from "typedi";
import { Request, Response } from "express";
import { checkRequest } from "../../routes/req-validator";

import FreeSharesService from "../services/free-shares-service";
import BrokerService from "../services/broker-service";

export const claimFreeShare = async (request: Request, response: Response) => {
  checkRequest(request);

  const freeSharesService: FreeSharesService = Container.get(FreeSharesService);

  const toAccount = request.body.account;

  const share = await freeSharesService.claimFreeShare(toAccount);

  response.send(share);
};

export const listTradableAssets = async (
  request: Request,
  response: Response
) => {
  checkRequest(request);

  const brokerService: BrokerService = Container.get(BrokerService);

  const assets = await brokerService.listTradableAssets();

  response.send(assets);
};

export const getLatestPrice = async (request: Request, response: Response) => {
  checkRequest(request);

  const brokerService: BrokerService = Container.get(BrokerService);

  const { tickerSymbol } = request.params;

  const price = await brokerService.getLatestPrice(tickerSymbol);

  response.send(price);
};

export const isMarketOpen = async (request: Request, response: Response) => {
  checkRequest(request);

  const brokerService: BrokerService = Container.get(BrokerService);

  const marketOpen = await brokerService.isMarketOpen();

  response.send(marketOpen);
};

export const buySharesInRewardsAccount = async (
  request: Request,
  response: Response
) => {
  checkRequest(request);

  const brokerService: BrokerService = Container.get(BrokerService);

  const { tickerSymbol, quantity } = request.body;

  const marketOpen = await brokerService.buySharesInRewardsAccount(
    tickerSymbol,
    Number.parseInt(quantity)
  );

  response.send(marketOpen);
};

export const getRewardsAccountPositions = async (
  request: Request,
  response: Response
) => {
  checkRequest(request);

  const brokerService: BrokerService = Container.get(BrokerService);

  const shares = await brokerService.getRewardsAccountPositions();

  response.send(shares);
};

export const moveSharesFromRewardsAccount = async (
  request: Request,
  response: Response
) => {
  checkRequest(request);

  const brokerService: BrokerService = Container.get(BrokerService);

  const { account, tickerSymbol, quantity } = request.body;

  const shares = await brokerService.moveSharesFromRewardsAccount(
    account,
    tickerSymbol,
    Number.parseInt(quantity)
  );

  response.send(shares);
};
