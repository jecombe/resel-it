import { expect } from "chai";
import { ethers } from "hardhat";
import type { EventFactory, EventTicket, ReselIT } from "../typechain-types";

describe("ReselIT & EventTicket integration", function () {
  let eventFactory: EventFactory;
  let resale: ReselIT;
  let event: EventTicket;
  let owner: any, user1: any, user2: any;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy EventFactory
    const Factory = await ethers.getContractFactory("EventFactory");
    eventFactory = (await Factory.deploy()) as EventFactory;
    await eventFactory.waitForDeployment();

    // Deploy ReselIT
    const ReselITFactory = await ethers.getContractFactory("ReselIT");
    resale = (await ReselITFactory.deploy()) as ReselIT;
    await resale.waitForDeployment();

    // Create Event with dynamic pricing
    const tx = await eventFactory.createEvent(
      "Test Event",
      "TEST",
      3, // maxTickets
      ethers.parseEther("1"), // base price
      true, // dynamic pricing
      ethers.parseEther("0.5") // increment
    );
    await tx.wait();

    const events = await eventFactory.getEvents();
    event = (await ethers.getContractAt("EventTicket", events[0])) as EventTicket;
  });

  it("User1 buys ticket #0 with dynamic pricing, price should be base price", async () => {
    expect(await event.getCurrentPrice()).to.equal(ethers.parseEther("1"));
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });
    expect(await event.ownerOf(0)).to.equal(user1.address);
  });

  it("Price increases dynamically after each ticket sold", async () => {
    expect(await event.getCurrentPrice()).to.equal(ethers.parseEther("1"));
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });
    expect(await event.getCurrentPrice()).to.equal(ethers.parseEther("1.5"));
    await event.connect(user2).buyTicket({ value: ethers.parseEther("1.5") });
    expect(await event.getCurrentPrice()).to.equal(ethers.parseEther("2"));
  });

  it("Should revert if trying to buy a sold out event", async () => {
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });
    await event.connect(user2).buyTicket({ value: ethers.parseEther("1.5") });
    await event.connect(owner).buyTicket({ value: ethers.parseEther("2") });

    // Using try/catch because revertedWith is broken in ethers v6
    try {
      await event.connect(user1).buyTicket({ value: ethers.parseEther("2.5") });
      expect.fail("Expected revert for sold out");
    } catch (e: any) {
      expect(e.message).to.include("Sold out");
    }
  });

it("Should refund excess ETH on buyTicket", async () => {
  const user1BalanceBefore = await ethers.provider.getBalance(user1.address);

  const tx = await event.connect(user1).buyTicket({ value: ethers.parseEther("2") });
  const receipt = await tx.wait();
  if (!receipt) return;

  // Calcul du gas payé
  const gasUsed = receipt.cumulativeGasUsed * tx.gasPrice; // bigint

  const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
  const spent = user1BalanceBefore - user1BalanceAfter; // bigint
  const ticketPrice = ethers.parseEther("1");

  expect(spent >= ticketPrice && spent <= ticketPrice + gasUsed).to.be.true;
});

  it("User1 lists a ticket and User2 buys it from resale", async () => {
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });
    await event.connect(user1).approve(resale.target, 0);
    await resale.connect(user1).listTicket(event.target, 0, ethers.parseEther("2"));

    const listing = await resale.listings(event.target, 0);
    expect(listing.seller).to.equal(user1.address);
    expect(listing.price).to.equal(ethers.parseEther("2"));

    const sellerBalanceBefore = await ethers.provider.getBalance(user1.address);

    await resale.connect(user2).buyTicketResale(event.target, 0, { value: ethers.parseEther("2") });

    expect(await event.ownerOf(0)).to.equal(user2.address);

    const emptyListing = await resale.listings(event.target, 0);
    expect(emptyListing.seller).to.equal(ethers.ZeroAddress);
    expect(emptyListing.price).to.equal(0n);

    const sellerBalanceAfter = await ethers.provider.getBalance(user1.address);
const diff = sellerBalanceAfter - sellerBalanceBefore; // bigint
const expected = ethers.parseEther("2");

expect(diff >= expected - ethers.parseEther("0.01") &&
       diff <= expected + ethers.parseEther("0.01")).to.be.true;  });

  it("Should fail to list a ticket if caller is not owner", async () => {
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });

    try {
      await resale.connect(user2).listTicket(event.target, 0, ethers.parseEther("1"));
      expect.fail("Expected revert for not owner");
    } catch (e: any) {
      expect(e.message).to.include("Not ticket owner");
    }
  });

  it("Should fail to buy resale ticket with insufficient ETH", async () => {
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });
    await event.connect(user1).approve(resale.target, 0);
    await resale.connect(user1).listTicket(event.target, 0, ethers.parseEther("2"));

    try {
      await resale.connect(user2).buyTicketResale(event.target, 0, { value: ethers.parseEther("1") });
      expect.fail("Expected revert for insufficient ETH");
    } catch (e: any) {
      expect(e.message).to.include("Insufficient ETH");
    }
  });

 it("Should refund excess ETH when buying resale ticket", async () => {
  await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });
  await event.connect(user1).approve(resale.target, 0);
  await resale.connect(user1).listTicket(event.target, 0, ethers.parseEther("2"));

  const user2BalanceBefore = await ethers.provider.getBalance(user2.address);

  const tx = await resale.connect(user2).buyTicketResale(event.target, 0, { value: ethers.parseEther("3") });
  const receipt = await tx.wait();

  const user2BalanceAfter = await ethers.provider.getBalance(user2.address);

  // On calcule l'ETH réellement dépensé en ignorant le gas
  const spent = user2BalanceBefore - user2BalanceAfter; // bigint
  const ticketPrice = ethers.parseEther("2");

  // On fait une assertion "approx" pour tenir compte du gas
  expect(spent >= ticketPrice && spent <= ticketPrice + ethers.parseEther("0.01")).to.be.true;
});


  it("getTicketsOfOwner should return all tokenIds owned by user", async () => {
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });    // tokenId 0
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1.5") });  // tokenId 1

    const tickets = await event.getTicketsOfOwner(user1.address);
    expect(tickets.length).to.equal(2);
    expect(tickets[0]).to.equal(0n);
    expect(tickets[1]).to.equal(1n);
  });

  it("OwnsToken should correctly confirm ownership", async () => {
    await event.connect(user2).buyTicket({ value: ethers.parseEther("1") }); // tokenId 0
    expect(await event.ownsToken(user2.address, 0)).to.be.true;

    // tokenId 1 does not exist, should return false
    let owns = false;
    try {
      owns = await event.ownsToken(user2.address, 1);
    } catch {
      owns = false;
    }
    expect(owns).to.be.false;

    expect(await event.ownsToken(owner.address, 0)).to.be.false;
  });

  it("Should verify signature and ticket ownership", async () => {
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });
    const message = "Allow entry to event TEST";
    const signature = await user1.signMessage(message);
    const signerAddress = ethers.verifyMessage(message, signature);

    const ownsTicket = await event.ownsToken(signerAddress, 0);
    expect(ownsTicket).to.be.true;
    expect(signerAddress).to.equal(user1.address);
  });

  it("Current price should decrease by priceIncrement after resale", async () => {
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });
    const priceAfterBuy = await event.getCurrentPrice(); // 1 + 0.5 = 1.5 ETH

    await event.connect(user1).approve(resale.target, 0);
    await resale.connect(user1).listTicket(event.target, 0, ethers.parseEther("2"));
    await resale.connect(user2).buyTicketResale(event.target, 0, { value: ethers.parseEther("2") });

    expect(await event.ownerOf(0)).to.equal(user2.address);

    const priceAfterResale = await event.getCurrentPrice();
    const expectedPrice = priceAfterBuy - (await event.priceIncrement());
    expect(priceAfterResale).to.equal(expectedPrice);
  });
});
