import assert from "assert";
import moment from "moment";
import sinon from "sinon";
import BrokerService from "./broker-service";
import FakeDatabaseService from "./fake-database-service";

describe("brokerService", function () {
  const assets = [
    { tickerSymbol: "A", quantity: 10, sharePrice: 15 },
    { tickerSymbol: "B", quantity: 20, sharePrice: 20 },
    { tickerSymbol: "C", quantity: 30, sharePrice: 25 },
  ];
  let fakeDatabaseService: FakeDatabaseService;
  let brokerService: BrokerService;
  beforeEach(async () => {
    fakeDatabaseService = new FakeDatabaseService();
    brokerService = new BrokerService(fakeDatabaseService);
    brokerService.setAssets(assets);
  });
  describe("listTradableAssets", function () {
    it("should return all the available tickerSymbol", async function () {
      const tickerSymbols = await brokerService.listTradableAssets();
      assert.deepStrictEqual(
        tickerSymbols,
        assets.map((asset) => ({ tickerSymbol: asset.tickerSymbol }))
      );
    });
  });
  describe("getLatestPrice", function () {
    it("should return the latest price for an asset", async function () {
      const latestPrice = await brokerService.getLatestPrice("B");
      const [, BAsset] = assets;
      assert.deepStrictEqual(latestPrice, { sharePrice: BAsset.sharePrice });
    });
    it("should error out if an asset doesn't exist", async function () {
      const madeUpTickerSymbol = "made up";
      await assert.rejects(
        brokerService.getLatestPrice(madeUpTickerSymbol),
        new Error(
          `There are no assets with this tickerSymbol=${madeUpTickerSymbol}`
        )
      );
    });
  });
  describe("isMarketOpen", function () {
    let clock: sinon.SinonFakeTimers;
    it("should say market is closed on Monday before 8h", async function () {
      const mondayMorning7h = moment("2022-02-21T07:00:00+01:00");
      const mondayMorning8h = moment("2022-02-21T08:00:00+01:00");
      const mondayAfternoon = moment("2022-02-21T16:00:00+01:00");

      clock = sinon.useFakeTimers(mondayMorning7h.toDate().getTime());

      const result = await brokerService.isMarketOpen();
      assert.deepStrictEqual(result, {
        open: false,
        nextClosingTime: mondayAfternoon.format(),
        nextOpeningTime: mondayMorning8h.format(),
      });
    });
    it("should say market is open on Monday at 8h", async function () {
      const mondayMorning = moment("2022-02-21T08:00:00+01:00");
      const mondayAfternoon = moment("2022-02-21T16:00:00+01:00");
      const tuesdayMorning = moment("2022-02-22T08:00:00+01:00");

      clock = sinon.useFakeTimers(mondayMorning.toDate().getTime());

      const result = await brokerService.isMarketOpen();
      assert.deepStrictEqual(result, {
        open: true,
        nextClosingTime: mondayAfternoon.format(),
        nextOpeningTime: tuesdayMorning.format(),
      });
    });
    it("should say market is closed on Monday at 16h", async function () {
      const mondayAfternoon16h = moment("2022-02-21T16:00:00+01:00");
      const tuesdayMorning8h = moment("2022-02-22T08:00:00+01:00");
      const tuesdayAfternoon16h = moment("2022-02-22T16:00:00+01:00");

      clock = sinon.useFakeTimers(mondayAfternoon16h.toDate().getTime());

      const result = await brokerService.isMarketOpen();
      assert.deepStrictEqual(result, {
        open: false,
        nextClosingTime: tuesdayAfternoon16h.format(),
        nextOpeningTime: tuesdayMorning8h.format(),
      });
    });
    it("should say market is closed on Friday at 16h", async function () {
      const fridayAfternoon16h = moment("2022-02-25T16:00:00+01:00");
      const nextMondayMorning8h = moment("2022-02-28T08:00:00+01:00");
      const nextMondayAfternoon16h = moment("2022-02-28T16:00:00+01:00");

      clock = sinon.useFakeTimers(fridayAfternoon16h.toDate().getTime());

      const result = await brokerService.isMarketOpen();
      assert.deepStrictEqual(result, {
        open: false,
        nextClosingTime: nextMondayAfternoon16h.format(),
        nextOpeningTime: nextMondayMorning8h.format(),
      });
    });
    it("should say market is closed on Saturday", async function () {
      const saturdayAfternoon13h = moment("2022-02-26T13:00:00+01:00");
      const nextMondayMorning8h = moment("2022-02-28T08:00:00+01:00");
      const nextMondayAfternoon16h = moment("2022-02-28T16:00:00+01:00");

      clock = sinon.useFakeTimers(saturdayAfternoon13h.toDate().getTime());

      const result = await brokerService.isMarketOpen();
      assert.deepStrictEqual(result, {
        open: false,
        nextClosingTime: nextMondayAfternoon16h.format(),
        nextOpeningTime: nextMondayMorning8h.format(),
      });
    });
    afterEach(() => {
      clock.restore();
    });
  });
  describe("buySharesInRewardsAccount", function () {
    let clock: sinon.SinonFakeTimers;
    beforeEach(() => {
      const mondayMorning = moment("2022-02-21T08:00:00+01:00");

      clock = sinon.useFakeTimers(mondayMorning.toDate().getTime());
    });
    it("should not be able to buy shares if the stock market is closed", async function () {
      const sundayMorning7h = moment("2022-02-27T07:00:00+01:00");

      clock = sinon.useFakeTimers(sundayMorning7h.toDate().getTime());

      await assert.rejects(
        brokerService.buySharesInRewardsAccount("A", 1),
        new Error(
          `Stock market is closed. Check again on 2022-02-28T08:00:00+01:00. Next closing time will be: 2022-02-28T16:00:00+01:00`
        )
      );
    });
    it("should not be able to buy shares if the quantity is not an integer", async function () {
      await assert.rejects(
        brokerService.buySharesInRewardsAccount("A", 1.5),
        new Error(
          `You can only buy shares using integer quantities, please try again.`
        )
      );
    });
    it("should buy 2 shares of type A when we don't have any", async function () {
      const quantity = 2;
      const result = await brokerService.buySharesInRewardsAccount(
        "A",
        quantity
      );
      const assetASharePrice = assets[0].sharePrice;
      const sharePricePaid = assetASharePrice * quantity;
      assert.deepStrictEqual(result, {
        success: true,
        sharePricePaid: sharePricePaid,
      });
      assert.deepStrictEqual(fakeDatabaseService.ourAccount, {
        moneyLeft:
          new FakeDatabaseService().ourAccount.moneyLeft - sharePricePaid,
        shares: [
          ...new FakeDatabaseService().ourAccount.shares,
          {
            tickerSymbol: "A",
            quantity,
            sharePrice: assetASharePrice,
          },
        ],
      });
    });
    it("should buy 2 shares of type A when we have 1 of the same price", async function () {
      const assetASharePrice = assets[0].sharePrice;

      fakeDatabaseService = new FakeDatabaseService([], {
        moneyLeft: 1000 - assetASharePrice,
        shares: [
          {
            tickerSymbol: "A",
            quantity: 1,
            sharePrice: assetASharePrice,
          },
        ],
      });
      brokerService = new BrokerService(fakeDatabaseService);
      brokerService.setAssets(assets);

      const previousMoneyLeft = fakeDatabaseService.ourAccount.moneyLeft;
      const previousQuantity =
        fakeDatabaseService.ourAccount.shares[0].quantity;

      const quantity = 2;
      const result = await brokerService.buySharesInRewardsAccount(
        "A",
        quantity
      );
      const sharePricePaid = assetASharePrice * quantity;
      assert.deepStrictEqual(result, {
        success: true,
        sharePricePaid: sharePricePaid,
      });
      assert.deepStrictEqual(fakeDatabaseService.ourAccount, {
        moneyLeft: previousMoneyLeft - sharePricePaid,
        shares: [
          {
            tickerSymbol: "A",
            quantity: previousQuantity + quantity,
            sharePrice: assetASharePrice,
          },
        ],
      });
    });
    it("should buy 2 shares of type A when we have already have 1 but at a different price", async function () {
      const previousAssetASharePrice = 7;
      fakeDatabaseService = new FakeDatabaseService([], {
        moneyLeft: 1000 - previousAssetASharePrice,
        shares: [
          {
            tickerSymbol: "A",
            quantity: 1,
            sharePrice: previousAssetASharePrice,
          },
        ],
      });
      brokerService = new BrokerService(fakeDatabaseService);
      brokerService.setAssets(assets);
      const assetASharePrice = assets[0].sharePrice;

      const previousMoneyLeft = fakeDatabaseService.ourAccount.moneyLeft;
      const previousQuantity =
        fakeDatabaseService.ourAccount.shares[0].quantity;

      const quantity = 2;
      const result = await brokerService.buySharesInRewardsAccount(
        "A",
        quantity
      );
      const sharePricePaid = assetASharePrice * quantity;
      assert.deepStrictEqual(result, {
        success: true,
        sharePricePaid: sharePricePaid,
      });
      assert.deepStrictEqual(fakeDatabaseService.ourAccount, {
        moneyLeft: previousMoneyLeft - sharePricePaid,
        shares: [
          {
            tickerSymbol: "A",
            quantity: previousQuantity,
            sharePrice: previousAssetASharePrice,
          },
          {
            tickerSymbol: "A",
            quantity: quantity,
            sharePrice: assetASharePrice,
          },
        ],
      });
    });
    afterEach(() => {
      clock.restore();
    });
  });
  describe("getRewardsAccountPositions", function () {
    it("should return shares with a non-zero quantity", async function () {
      const shares = [
        {
          tickerSymbol: "A",
          quantity: 1,
          sharePrice: 22,
        },
        {
          tickerSymbol: "A",
          quantity: 0,
          sharePrice: 33,
        },
        {
          tickerSymbol: "B",
          quantity: 3,
          sharePrice: 44,
        },
      ];
      fakeDatabaseService = new FakeDatabaseService([], {
        moneyLeft: 1000,
        shares,
      });
      brokerService = new BrokerService(fakeDatabaseService);
      brokerService.setAssets(assets);
      const firmShares = await brokerService.getRewardsAccountPositions();
      assert.deepStrictEqual(
        firmShares,
        shares.filter((share) => share.quantity)
      );
    });
  });
  describe("moveSharesFromRewardsAccount", function () {
    it("should NOT move a share if you want 0 of them", async function () {
      const shares = [
        {
          tickerSymbol: "A",
          quantity: 1,
          sharePrice: 22,
        },
      ];
      const users = [
        {
          id: "1",
          shares: [],
        },
      ];
      fakeDatabaseService = new FakeDatabaseService(users, {
        moneyLeft: 1000,
        shares,
      });
      brokerService = new BrokerService(fakeDatabaseService);
      brokerService.setAssets(assets);
      const result = await brokerService.moveSharesFromRewardsAccount(
        users[0].id,
        "A",
        0
      );
      assert.deepStrictEqual(result, { success: false });
    });
    it("should NOT move a share when there is not enough quantity", async function () {
      const shares = [
        {
          tickerSymbol: "A",
          quantity: 1,
          sharePrice: 22,
        },
        {
          tickerSymbol: "A",
          quantity: 0,
          sharePrice: 33,
        },
        {
          tickerSymbol: "B",
          quantity: 3,
          sharePrice: 44,
        },
      ];
      const users = [
        {
          id: "1",
          shares: [],
        },
      ];
      fakeDatabaseService = new FakeDatabaseService(users, {
        moneyLeft: 1000,
        shares,
      });
      brokerService = new BrokerService(fakeDatabaseService);
      brokerService.setAssets(assets);
      const result = await brokerService.moveSharesFromRewardsAccount(
        users[0].id,
        shares[0].tickerSymbol,
        300 // not enough quantity of A
      );
      assert.deepStrictEqual(result, { success: false });
    });
    it("should NOT move a share we don't have", async function () {
      const shares = [
        {
          tickerSymbol: "A",
          quantity: 1,
          sharePrice: 22,
        },
        {
          tickerSymbol: "A",
          quantity: 0,
          sharePrice: 33,
        },
        {
          tickerSymbol: "B",
          quantity: 3,
          sharePrice: 44,
        },
      ];
      const users = [
        {
          id: "1",
          shares: [],
        },
      ];
      fakeDatabaseService = new FakeDatabaseService(users, {
        moneyLeft: 1000,
        shares,
      });
      brokerService = new BrokerService(fakeDatabaseService);
      brokerService.setAssets(assets);
      const result = await brokerService.moveSharesFromRewardsAccount(
        users[0].id,
        "C",
        1
      );
      assert.deepStrictEqual(result, { success: false });
    });
    it("should NOT move a share to an unexisting user", async function () {
      const shares = [
        {
          tickerSymbol: "A",
          quantity: 1,
          sharePrice: 22,
        },
      ];
      const users = [
        {
          id: "1",
          shares: [],
        },
      ];
      fakeDatabaseService = new FakeDatabaseService(users, {
        moneyLeft: 1000,
        shares,
      });
      brokerService = new BrokerService(fakeDatabaseService);
      brokerService.setAssets(assets);
      const result = await brokerService.moveSharesFromRewardsAccount(
        "made up user",
        "A",
        1
      );
      assert.deepStrictEqual(result, { success: false });
    });
    it("should move a share to a user that doesn't already have it", async function () {
      const shares = [
        {
          tickerSymbol: "A",
          quantity: 3,
          sharePrice: 22,
        },
        {
          tickerSymbol: "A",
          quantity: 0,
          sharePrice: 33,
        },
        {
          tickerSymbol: "B",
          quantity: 3,
          sharePrice: 44,
        },
      ];
      const users = [
        {
          id: "1",
          shares: [],
        },
      ];
      fakeDatabaseService = new FakeDatabaseService(users, {
        moneyLeft: 1000,
        shares: [...shares.map((s) => ({ ...s }))], // deep clone
      });
      brokerService = new BrokerService(fakeDatabaseService);
      brokerService.setAssets(assets);
      const result = await brokerService.moveSharesFromRewardsAccount(
        users[0].id,
        "A",
        3
      );
      assert.deepStrictEqual(result, { success: true });
      assert.deepStrictEqual(fakeDatabaseService.users, [
        {
          id: "1",
          shares: [shares[0]],
        },
      ]);
      assert.deepStrictEqual(fakeDatabaseService.ourAccount.shares, [
        {
          tickerSymbol: "A",
          quantity: 0,
          sharePrice: 22,
        },
        {
          tickerSymbol: "A",
          quantity: 0,
          sharePrice: 33,
        },
        {
          tickerSymbol: "B",
          quantity: 3,
          sharePrice: 44,
        },
      ]);
    });
    it("should move a share to a user that DOES already have it", async function () {
      const shares = [
        {
          tickerSymbol: "A",
          quantity: 3,
          sharePrice: 22,
        },
        {
          tickerSymbol: "A",
          quantity: 0,
          sharePrice: 33,
        },
        {
          tickerSymbol: "B",
          quantity: 3,
          sharePrice: 44,
        },
      ];
      const users = [
        {
          id: "1",
          shares: [
            {
              tickerSymbol: "A",
              quantity: 4,
              sharePrice: 11,
            },
          ],
        },
      ];
      fakeDatabaseService = new FakeDatabaseService(users, {
        moneyLeft: 1000,
        shares,
      });
      brokerService = new BrokerService(fakeDatabaseService);
      brokerService.setAssets(assets);
      const result = await brokerService.moveSharesFromRewardsAccount(
        users[0].id,
        "A",
        2
      );
      assert.deepStrictEqual(result, { success: true });
      assert.deepStrictEqual(fakeDatabaseService.users, [
        {
          id: "1",
          shares: [
            {
              tickerSymbol: "A",
              quantity: 4,
              sharePrice: 11,
            },
            {
              tickerSymbol: "A",
              quantity: 2,
              sharePrice: 22,
            },
          ],
        },
      ]);
      assert.deepStrictEqual(fakeDatabaseService.ourAccount.shares, [
        {
          tickerSymbol: "A",
          quantity: 1,
          sharePrice: 22,
        },
        {
          tickerSymbol: "A",
          quantity: 0,
          sharePrice: 33,
        },
        {
          tickerSymbol: "B",
          quantity: 3,
          sharePrice: 44,
        },
      ]);
    });
  });
});
