# Backend Engineering Challenge 2022

👏Congratulations on getting to this stage of our interview process.

This test aims to show us your understanding of backend development and craftsmanship when it comes to delivering a small well tested/documented project. 

Take your time to finish the test properly (**you have 7 days from the day this was sent**). When we grade a submission, we’re evaluating it like we would a pull request on our codebase; we expect it to be of ****high quality and we hope you’ll find it interesting and fun!

### Background

We want to reward new users with a free share when they sign up to use our free stock trading service or when they refer a friend. 

The share they receive will be randomly chosen and range in value from £3 to £200. The distribution of these rewards must allow us to keep the cost of each new acquired customer under control, so the algorithm needs to be implemented in a way that forces 95% of distributed rewards to have a value between £3-£10, 3% between £10-£25 and 2% between £25-£200. 

These are the methods that form our Broker API and that you’ll need to use to implement the task:

```sql
// To fetch a list of assets available for trading
Broker.listTradableAssets(): Promise<Array<{ tickerSymbol: string }>>

// To fetch the latest price for an asset
Broker.getLatestPrice(tickerSymbol: string): Promise<{ sharePrice: number }>

// To check if the stock market is currently open or closed
Broker.isMarketOpen(): Promise<{ open: bool, nextOpeningTime: string, nextClosingTime: string }>

// To purchase a share in our Firm's rewards account.
// NOTE: this works only while the stock market is open otherwise throws an error.
// NOTE 2: quantity is an integer, no fractional shares allowed.
Broker.buySharesInRewardsAccount(tickerSymbol: string, quantity: number): Promise<{ success: bool, sharePricePaid: number }>

// To view the shares that are available in the Firm's rewards account
Broker.getRewardsAccountPositions(): Promise< { tickerSymbol: string, quantity: number, sharePrice: number }> 

// To move shares from our Firm's rewards account to a user's own account
Broker.moveSharesFromRewardsAccount(toAccount: string, tickerSymbol: string, quantity: number): Promise<{ success: bool }>
```

### The Challenge

You are asked to implement an endpoint `POST /claim-free-share` which will be hit by the frontend when the user taps on the “Claim my free share” button. This method will choose a random share and put it in the user’s account.

If your solution requires us to run something beforehand, like a one-off script or a regular job, you’re asked to implement that as well. 

The minimum and maximum share value that can be rewarded needs to be configurable from environment variables. 

You will need to mock the behaviour of the aforementioned Broker API methods.  Assume they work reliably as described, as black boxes, no need to simulate all possible failures and you can assume that there is at least one share for any arbitrary price range.

If you need to store or cache any extra data, you are free to do so with your database of choice. 

Bonus tasks:

1. Instead of relying on the exact percentage distribution outlined above, add another customisable input parameter to the program which represents the target Cost Per Acquisition (CPA): with a large enough number of new users onboarded (100+), the algorithm needs to distribute rewards in a way that results in `total spent to buy shares / number of rewards given = target CPA`
2. Assume that now support fractional shares and we decide to start awarding free portions of shares from popular companies like Apple, Google, Tesla because they’re more popular amongst users. Giving a whole Tesla is not feasible because the current price is £500+ so we need to give out a random fraction of it between £3-£200. State how you would adapt your system to achieve with that.  

### Notes

- We expect you to implement this using modern JavaScript, extra points if you use TypeScript or Flow for type safety.
- Keep it simple and to the point (e.g. no need to implement any authentication)
- **Tests are not optional**. While we don’t expect perfect test coverage, we want to see tests to demonstrate that your solution works plus some tests on the parts of your backend where you think tests are most helpful.
- Have a short README file explaining how to run the tests and start the service (bonus points if you Dockerize it)
- You are free to make assumptions if you find anything ambiguous in the above instructions, just make sure to list those in the README or in comments
- We expect an HTTP RESTful API, but you are free to do this with alternative approaches such as gRPC
- Your submission should go in a Git repository. You are free to use any hosting, just make sure we can access it. Don't commit secrets :)

Happy coding!