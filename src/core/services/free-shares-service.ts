import { Service } from "typedi";
import { Env } from "../types/env";
import BrokerService from "./broker-service";
import { Share, ShareFirm } from "./fake-database-service";

@Service()
export default class FreeSharesService {
  constructor(private brokerService: BrokerService, private env: Env) {}

  /**
   * Return random range price using a weighted distribution set in the environment.
   *
   * For example:
   *
   * The share they receive will be randomly chosen and range in value from £3 to £200.
   * The distribution of these rewards must allow us to keep the cost of each new acquired
   * customer under control, so the algorithm needs to be implemented in a way that forces 95% of
   * distributed rewards to have a value between £3-£10, 3% between £10-£25 and 2% between £25-£200.
   */
  private getRandomRange(): [number, number] {
    const {
      minShareValue,
      midLowShareValue,
      midHighShareValue,
      maxShareValue,

      cheapestPercentage,
      mostExpensivePercentage,
    } = this.env;

    const randomPercentage = Math.random();

    if (randomPercentage <= cheapestPercentage) {
      return [minShareValue, midLowShareValue];
    }
    if (
      cheapestPercentage < randomPercentage &&
      randomPercentage <= cheapestPercentage + mostExpensivePercentage
    ) {
      return [midLowShareValue, midHighShareValue];
    }
    return [midHighShareValue, maxShareValue];
  }

  /**
   * Get the cheapest share that meets our strategy
   * @param firmShares
   */
  getFreeShare(firmShares: ShareFirm[]): ShareFirm {
    const sortedASCSharesByValue = firmShares.sort(
      (s1, s2) => s1.sharePrice - s2.sharePrice
    );

    const [min, max] = this.getRandomRange();
    const freeShare = sortedASCSharesByValue.find(
      (share) => min <= share.sharePrice && share.sharePrice <= max
    );
    if (!freeShare) {
      throw new Error(
        "There are no available free shares right now, try claiming yours later"
      );
    }
    return {
      ...freeShare,
      quantity: 1,
    };
  }

  /*
    Instead of relying on the exact percentage distribution outlined above, 
    add another customisable input parameter to the program which represents 
    the target Cost Per Acquisition (CPA): 
    with a large enough number of new users onboarded (100+), 
    the algorithm needs to distribute rewards in a way that results in 
    total spent to buy shares / number of rewards given = target CPA
    */

  async claimFreeShare(toAccount: string): Promise<Share> {
    const availableShares =
      await this.brokerService.getRewardsAccountPositions();

    const freeShare = this.getFreeShare(availableShares);

    const result = await this.brokerService.moveSharesFromRewardsAccount(
      toAccount,
      freeShare.tickerSymbol,
      freeShare.quantity
    );
    if (result.success) {
      return freeShare;
    }
    throw new Error(
      `There was an error while transfering your free share to your account, please try again later or contact us`
    );
  }
}
