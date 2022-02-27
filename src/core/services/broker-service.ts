import moment from "moment";
import { Service } from "typedi";
import FakeDatabaseService, { ShareFirm } from "./fake-database-service";

@Service()
export default class BrokerService {
  // available stocks from the stock market, they would not be here in a real scenario
  private assets: {
    tickerSymbol: string;
    sharePrice: number; // selling price
    quantity: number;
  }[] = [
    { tickerSymbol: "A", quantity: 10, sharePrice: 15 },
    { tickerSymbol: "B", quantity: 20, sharePrice: 20 },
    { tickerSymbol: "C", quantity: 30, sharePrice: 25 },
    { tickerSymbol: "D", quantity: 2, sharePrice: 100 },
  ];

  get fakeAssets() {
    return this.assets;
  }

  get ourAccount() {
    return this.fakeDatabaseService.ourAccount;
  }

  get users() {
    return this.fakeDatabaseService.users;
  }

  constructor(private fakeDatabaseService: FakeDatabaseService) {}

  setAssets(assets: typeof this.assets) {
    this.assets = assets;
  }

  // To fetch a list of assets available for trading
  async listTradableAssets(): Promise<Array<{ tickerSymbol: string }>> {
    return this.assets.map((asset) => ({ tickerSymbol: asset.tickerSymbol }));
  }

  // To fetch the latest price for an asset
  async getLatestPrice(tickerSymbol: string): Promise<{ sharePrice: number }> {
    const asset = this.assets.find(
      (asset) => asset.tickerSymbol === tickerSymbol
    );
    if (!asset) {
      throw new Error(
        `There are no assets with this tickerSymbol=${tickerSymbol}`
      );
    }
    return {
      sharePrice: asset.sharePrice,
    };
  }

  // To check if the stock market is currently open or closed
  // Stock market here opens during weekdays between 8h and 16h
  async isMarketOpen(): Promise<{
    open: boolean;
    nextOpeningTime: string;
    nextClosingTime: string;
  }> {
    const now = moment();
    const nWeekday = now.isoWeekday();
    const MondayIdx = 1;
    const FridayIdx = 5;
    const SaturdayIdx = 6;
    const SundayIdx = 7;
    const isWeekday = nWeekday >= MondayIdx && nWeekday <= FridayIdx;

    const currentHour = now.hours();
    const openingTime = 8;
    const closingTime = 16;
    const beforeOpenTime = currentHour < openingTime;
    const afterOpenTime = currentHour > openingTime;
    const beforeClosingTime = currentHour < closingTime;
    const afterClosingTime = currentHour >= closingTime;

    const nextOpenMonday = now
      .clone()
      .startOf("isoWeek")
      .add(1, "week")
      .set("hours", openingTime);
    const nextClosingMonday = nextOpenMonday.clone().set("hours", closingTime);
    const sameOpenDay = now.clone().set("hours", openingTime);
    const nextOpenDay = now.clone().set("hours", openingTime).add(1, "day");
    const sameClosingDay = now.clone().set("hours", closingTime);
    const nextClosingDay = now.clone().set("hours", closingTime).add(1, "day");
    return {
      open:
        isWeekday && currentHour >= openingTime && currentHour < closingTime,
      nextClosingTime: ([SundayIdx, SaturdayIdx].includes(nWeekday) ||
      (FridayIdx === nWeekday && afterClosingTime)
        ? nextClosingMonday
        : beforeClosingTime
        ? sameClosingDay
        : nextClosingDay
      ).format(),
      nextOpeningTime: ([SundayIdx, SaturdayIdx].includes(nWeekday) ||
      (FridayIdx === nWeekday && afterOpenTime)
        ? nextOpenMonday
        : beforeOpenTime
        ? sameOpenDay
        : nextOpenDay
      ).format(),
    };
  }

  // To purchase a share in our Firm's rewards account.
  // NOTE: this works only while the stock market is open otherwise throws an error.
  // NOTE 2: quantity is an integer, no fractional shares allowed.
  async buySharesInRewardsAccount(
    tickerSymbol: string,
    quantity: number
  ): Promise<{ success: boolean; sharePricePaid: number }> {
    if (!Number.isInteger(quantity)) {
      throw new Error(
        `You can only buy shares using integer quantities, please try again.`
      );
    }
    const { open, nextOpeningTime, nextClosingTime } =
      await this.isMarketOpen();
    if (open) {
      const { moneyLeft } = this.ourAccount;
      const { sharePrice } = await this.getLatestPrice(tickerSymbol);
      const moneyToPayShares = quantity * sharePrice;
      if (moneyLeft < moneyToPayShares) {
        return { success: false, sharePricePaid: 0 };
      }
      this.ourAccount.moneyLeft -= moneyToPayShares;
      const ourShare = this.ourAccount.shares.find(
        (share) =>
          share.tickerSymbol === tickerSymbol && share.sharePrice === sharePrice
      );
      if (ourShare) {
        ourShare.quantity += quantity;
        ourShare.sharePrice = sharePrice;
      } else {
        this.ourAccount.shares.push({
          sharePrice,
          quantity,
          tickerSymbol,
        });
      }
      return { success: true, sharePricePaid: moneyToPayShares };
    }
    throw new Error(
      `Stock market is closed. Check again on ${nextOpeningTime}. Next closing time will be: ${nextClosingTime}`
    );
  }

  // To view the shares that are available in the Firm's rewards account
  async getRewardsAccountPositions(): Promise<Array<ShareFirm>> {
    return this.ourAccount.shares.filter((share) => share.quantity); // non-empty shares
  }

  // To move shares from our Firm's rewards account to a user's own account
  async moveSharesFromRewardsAccount(
    toAccount: string,
    tickerSymbol: string,
    quantity: number
  ): Promise<{ success: boolean }> {
    if (!quantity) {
      return { success: false };
    }
    const matchingShare = this.ourAccount.shares.find(
      (share) => share.tickerSymbol === tickerSymbol && share.quantity
    );
    if (!matchingShare || matchingShare.quantity < quantity) {
      return { success: false };
    }
    matchingShare.quantity -= quantity;
    const user = this.users.find((user) => user.id === toAccount);
    if (!user) {
      return { success: false };
    }
    const userShare = user.shares.find(
      (share) => share.tickerSymbol === tickerSymbol && share.sharePrice === matchingShare.sharePrice
    );
    if (userShare) {
      userShare.quantity += quantity;
    } else {
      user.shares.push({
        ...matchingShare,
        quantity
      });
    }
    return { success: true };
  }
}
