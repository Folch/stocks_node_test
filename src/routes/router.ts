import { Router, Request, Response } from "express";
import { getAllFakeData } from "../core/controllers/data";
import { buySharesInRewardsAccount, claimFreeShare, getLatestPrice, getRewardsAccountPositions, isMarketOpen, listTradableAssets, moveSharesFromRewardsAccount } from "../core/controllers/shares";
import { ENDPOINTS, validate } from "./req-validator";

// all routes are /api/*
export const apiRouter = () => {
  const router: Router = Router();

  router.post(
    "/claim-free-share",
    validate(ENDPOINTS.POST_ClaimFreeShare),
    handledException(claimFreeShare)
  );

  router.get(
    "/tradable-assets",
    handledException(listTradableAssets)
  );

  router.get(
    "/latest-price/:tickerSymbol",
    handledException(getLatestPrice)
  );

  router.get(
    "/status/market",
    handledException(isMarketOpen)
  );

  router.post(
    "/buy-shares-firm",
    validate(ENDPOINTS.POST_BuySharesInRewardsAccount),
    handledException(buySharesInRewardsAccount)
  );

  router.get(
    "/shares-firm",
    handledException(getRewardsAccountPositions)
  );

  router.post(
    "/buy-shares-firm",
    validate(ENDPOINTS.POST_MoveSharesFromRewardsAccount),
    handledException(moveSharesFromRewardsAccount)
  );

  router.get(
    "/debug/data",
    handledException(getAllFakeData)
  );

  return router;
};

const handledException = (
  callback: (request: Request, response: Response) => Promise<void>
) => {
  return async (req: Request, res: Response) => {
    try {
      await callback(req, res);
    } catch (error) {
      console.error("There has been an error:", error);
      res.status(500).send({
        isError: true,
        message:
          error instanceof Error
            ? error.message
            : "There has been an unknown error",
      });
    }
  };
};
