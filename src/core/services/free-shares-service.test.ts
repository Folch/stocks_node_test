import assert from "assert";
import sinon from "sinon";
import { Env } from "../types/env";
import BrokerService from "./broker-service";
import FakeDatabaseService, { ShareFirm } from "./fake-database-service";
import FreeSharesService from "./free-shares-service";

describe("freeShares", function () {
  const assets: ShareFirm[] = [
    { tickerSymbol: "A", quantity: 10, sharePrice: 15 },
    { tickerSymbol: "B", quantity: 20, sharePrice: 20 },
    { tickerSymbol: "C", quantity: 30, sharePrice: 25 },
  ];
  const env: Env = {
    minShareValue: 3,
    midLowShareValue: 10,
    midHighShareValue: 25,
    maxShareValue: 200,
    cheapestPercentage: 0.95,
    mostExpensivePercentage: 0.02,
  };
  const users = [{ id: "1", shares: [] }];
  const ourAccount = {
    moneyLeft: 1000,
    shares: [
      { tickerSymbol: "A", quantity: 3, sharePrice: 12 },
      { tickerSymbol: "B", quantity: 4, sharePrice: 19 },
      { tickerSymbol: "C", quantity: 5, sharePrice: 24 },
    ],
  };
  let fakeDatabaseService: FakeDatabaseService;
  let brokerService: BrokerService;
  let freeSharesService: FreeSharesService;
  let randomStub: sinon.SinonStub<[], number>;
  beforeEach(async () => {
    fakeDatabaseService = new FakeDatabaseService(users, ourAccount);
    brokerService = new BrokerService(fakeDatabaseService);
    brokerService.setAssets(assets);
    freeSharesService = new FreeSharesService(brokerService, env);
  });
  describe("getRandomRange", function () {
    it("should return the £3-£10 if the value is 95% or lower", async function () {
      randomStub = sinon.stub(Math, "random").returns(0.95);
      // To test private function
      // @ts-ignore
      const range = freeSharesService.getRandomRange();
      assert.deepStrictEqual(range, [env.minShareValue, env.midLowShareValue]);
    });
    it("should return the £10-£25 if the value is 96-98%", async function () {
      randomStub = sinon.stub(Math, "random").returns(0.96);
      // To test private function
      // @ts-ignore
      const range = freeSharesService.getRandomRange();
      assert.deepStrictEqual(range, [
        env.midLowShareValue,
        env.midHighShareValue,
      ]);
    });
    it("should return the £25-£200 if the value is 99-100%", async function () {
      randomStub = sinon.stub(Math, "random").returns(0.99);
      // To test private function
      // @ts-ignore
      const range = freeSharesService.getRandomRange();
      assert.deepStrictEqual(range, [env.midHighShareValue, env.maxShareValue]);
    });
  });
  describe("getFreeShare", function () {
    it("should error out as no share matches the range £3-£10", async function () {
      randomStub = sinon.stub(Math, "random").returns(0.1); // range £3-£10
      const assets: ShareFirm[] = [
        { tickerSymbol: "B", quantity: 20, sharePrice: 20 },
        { tickerSymbol: "A", quantity: 10, sharePrice: 2 },
        { tickerSymbol: "C", quantity: 30, sharePrice: 25 },
      ];
      assert.throws(
        () => freeSharesService.getFreeShare(assets),
        new Error(
          "There are no available free shares right now, try claiming yours later"
        )
      );
    });
    it("should give an A share as it's the cheapest available stock in the range £10-£25", async function () {
      randomStub = sinon.stub(Math, "random").returns(0.96); // range £10-£25
      const freeShare = freeSharesService.getFreeShare(assets);
      assert.deepStrictEqual(freeShare, { ...assets[0], quantity: 1 });
    });
  });
  describe("claimFreeShare", function () {
    it("should claim a free share successfully", async function () {
      randomStub = sinon.stub(Math, "random").returns(0.96); // range £10-£25
      const freeShare = await freeSharesService.claimFreeShare(users[0].id);
      assert.deepStrictEqual(freeShare, {
        tickerSymbol: ourAccount.shares[0].tickerSymbol,
        sharePrice: ourAccount.shares[0].sharePrice,
        quantity: 1,
      });
    });
    it("should NOT claim a free share as the ones the firm has are too expensive and would not keep the rewards under control", async function () {
      randomStub = sinon.stub(Math, "random").returns(0.8); // range £3-£10
      assert.rejects(
        freeSharesService.claimFreeShare(users[0].id),
        new Error(
          "There are no available free shares right now, try claiming yours later"
        )
      );
    });
    it("should NOT claim a free share as the user does not exist", async function () {
      assert.rejects(
        freeSharesService.claimFreeShare("made up user id"),
        new Error(
          `There was an error while transfering your free share to your account, please try again later or contact us`
        )
      );
    });
  });
  afterEach(() => {
    randomStub.restore();
  });
});
