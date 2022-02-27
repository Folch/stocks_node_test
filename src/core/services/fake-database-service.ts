import { Service } from "typedi";

export type Share = {
  tickerSymbol: string;
  quantity: number;
  sharePrice: number;
};

export type ShareFirm = Share & {
  sharePrice: number; // the price we bought the stocks at
};

@Service()
export default class FakeDatabaseService {
  constructor(
    public users: { id: string; shares: Share[] }[] = [
      {
        id: "1",
        shares: [],
      },
      {
        id: "2",
        shares: [{ tickerSymbol: "A", quantity: 10, sharePrice: 15 }],
      },
    ],
    public ourAccount: { moneyLeft: number; shares: ShareFirm[] } = {
      moneyLeft: 1000,
      shares: [
        { tickerSymbol: "A", quantity: 1, sharePrice: 4 },
        { tickerSymbol: "B", quantity: 20, sharePrice: 20 },
        { tickerSymbol: "C", quantity: 30, sharePrice: 25 },
        { tickerSymbol: "D", quantity: 2, sharePrice: 100 },
      ], // can have duplicated tickerSymbols because we can buy at different prices
    }
  ) {}
}
