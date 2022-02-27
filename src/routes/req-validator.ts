import { Request } from "express";
import { body, query, validationResult, oneOf } from "express-validator/check";

export function checkRequest(request: Request): void {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    throw errors;
  }
}

export enum ENDPOINTS {
  POST_ClaimFreeShare,
  POST_BuySharesInRewardsAccount,
  POST_MoveSharesFromRewardsAccount,
}

export const validate = (method: ENDPOINTS) => {
  switch (method) {
    case ENDPOINTS.POST_ClaimFreeShare: {
      return [body("account").exists().isString()];
    }
    case ENDPOINTS.POST_BuySharesInRewardsAccount: {
      return [
        body("tickerSymbol").exists().isString(),
        body("quantity").exists().isNumeric().isInt({ min: 1 }),
      ];
    }
    case ENDPOINTS.POST_MoveSharesFromRewardsAccount: {
      return [
        body("account").exists().isString(),
        body("tickerSymbol").exists().isString(),
        body("quantity").exists().isNumeric().isInt({ min: 1 }),
      ];
    }
    default:
      return [];
  }
};
