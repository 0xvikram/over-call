import { expect } from "chai";
import hre from "hardhat";

const DOT = 1, RUNS = 2, BOUNDARY = 3, WICKET = 4;

async function setup() {
  const [host, a, b, c] = await hre.viem.getWalletClients();
  const game = await hre.viem.deployContract("OverCall");
  const as = (w: typeof a) =>
    hre.viem.getContractAt("OverCall", game.address, { client: { wallet: w } });
  const [ga, gb, gc] = await Promise.all([as(a), as(b), as(c)]);
  await ga.write.join(["Asha"]);
  await gb.write.join(["Bilal"]);
  await gc.write.join(["Chirag"]);
  return { game, host, a, b, c, ga, gb, gc };
}

async function expectRevert(p: Promise<unknown>, name: string) {
  try {
    await p;
  } catch (e) {
    expect(String(e)).to.contain(name);
    return;
  }
  throw new Error(`expected revert ${name}`);
}

describe("OverCall", () => {
  it("scores correct callers, builds streaks and resets wrong ones", async () => {
    const { game, a, b, c, ga, gb, gc } = await setup();

    await game.write.openBall([30n]);
    await ga.write.call([BOUNDARY]);
    await gb.write.call([DOT]);
    // c skips this ball
    await game.write.settle([BOUNDARY]);
    expect(await game.read.points([a.account.address])).to.equal(10n);
    expect(await game.read.points([b.account.address])).to.equal(0n);

    await game.write.openBall([30n]);
    await ga.write.call([WICKET]);
    await gb.write.call([WICKET]);
    await gc.write.call([RUNS]);
    expect((await game.read.tallyOf([2n]))[WICKET]).to.equal(2n);
    await game.write.settle([WICKET]);

    // a: 10 + (10 + 1*5) ; b: 10 ; c: 0
    expect(await game.read.points([a.account.address])).to.equal(25n);
    expect(await game.read.points([b.account.address])).to.equal(10n);
    expect(await game.read.streak([a.account.address])).to.equal(2n);
    expect(await game.read.streak([c.account.address])).to.equal(0n);

    const [addrs, names, pts] = await game.read.board();
    expect(addrs.length).to.equal(3);
    expect(names[0]).to.equal("Asha");
    expect(pts[0]).to.equal(25n);
  });

  it("enforces the rules", async () => {
    const { game, ga, gb } = await setup();
    await expectRevert(ga.write.call([DOT]), "NoOpenBall");
    await expectRevert(ga.write.openBall([5n]), "NotHost");
    await game.write.openBall([5n]);
    await expectRevert(game.write.openBall([5n]), "BallStillOpen");
    await expectRevert(ga.write.call([0]), "BadPick");
    await ga.write.call([DOT]);
    await expectRevert(ga.write.call([RUNS]), "AlreadyCalled");
    await expectRevert(ga.write.join(["Again"]), "AlreadyJoined");

    await hre.network.provider.send("evm_increaseTime", [10]);
    await hre.network.provider.send("evm_mine");
    await expectRevert(gb.write.call([DOT]), "WindowClosed");

    await game.write.settle([DOT]);
    await expectRevert(game.write.settle([DOT]), "AlreadySettled");
  });

  it("caps the streak bonus", async () => {
    const { game, a, ga } = await setup();
    for (let i = 0; i < 7; i++) {
      await game.write.openBall([30n]);
      await ga.write.call([DOT]);
      await game.write.settle([DOT]);
    }
    // bonuses 0,5,10,15,20,20,20 on top of 7 x 10
    expect(await game.read.points([a.account.address])).to.equal(160n);
  });
});
