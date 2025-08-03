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

    // Deploy ReselIT (resale marketplace)
    const ReselITFactory = await ethers.getContractFactory("ReselIT");
    resale = (await ReselITFactory.deploy()) as ReselIT;
    await resale.waitForDeployment();

    // Create an Event via factory with dynamic pricing enabled
    const tx = await eventFactory.createEvent(
      "Test Event",
      "TEST",
      3, // maxTickets = 3 for tests
      ethers.parseEther("1"), // base price 1 ETH
      true, // dynamic pricing ON
      ethers.parseEther("0.5") // price increment 0.5 ETH
    );
    await tx.wait();

    // Get event address from factory
    const events = await eventFactory.getEvents();
    const eventAddress = events[0];

    // Attach the EventTicket contract instance
    event = await ethers.getContractAt("EventTicket", eventAddress) as EventTicket;
  });

  it("User1 buys ticket #0 with dynamic pricing, price should be base price", async () => {
    expect(await event.getCurrentPrice()).to.equal(ethers.parseEther("1"));
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });
    expect(await event.ownerOf(0)).to.equal(user1.address);
  });

  it("Price increases dynamically after each ticket sold", async () => {
    // Ticket 0 price = 1 ETH
    expect(await event.getCurrentPrice()).to.equal(ethers.parseEther("1"));
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });

    // Ticket 1 price = 1 + 0.5 = 1.5 ETH
    expect(await event.getCurrentPrice()).to.equal(ethers.parseEther("1.5"));
    await event.connect(user2).buyTicket({ value: ethers.parseEther("1.5") });

    // Ticket 2 price = 1 + (2 * 0.5) = 2 ETH
    expect(await event.getCurrentPrice()).to.equal(ethers.parseEther("2"));
  });

  it("Should revert if trying to buy a sold out event", async () => {
    // Sell all 3 tickets
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });
    await event.connect(user2).buyTicket({ value: ethers.parseEther("1.5") });
    await event.connect(owner).buyTicket({ value: ethers.parseEther("2") });

    // Try to buy a 4th ticket
    await expect(
      event.connect(user1).buyTicket({ value: ethers.parseEther("2.5") })
    ).to.be.revertedWith("Sold out");
  });

  it("Should refund excess ETH on buyTicket", async () => {
    const price = await event.getCurrentPrice(); // Should be 1 ETH at start

    const user1BalanceBefore = await ethers.provider.getBalance(user1.address);

    // User1 sends 2 ETH, price is 1 ETH, should refund 1 ETH minus gas
    const tx = await event.connect(user1).buyTicket({ value: ethers.parseEther("2") });
    const receipt = await tx.wait();

    const user1BalanceAfter = await ethers.provider.getBalance(user1.address);

    // user1 balance after should be less than before but difference should be close to price (consider gas fees)
    const spent = user1BalanceBefore - user1BalanceAfter;

    expect(spent).to.be.lessThan(ethers.parseEther("1.1"));
    expect(spent).to.be.greaterThan(ethers.parseEther("0.9"));
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
    const diff = sellerBalanceAfter - sellerBalanceBefore;
    expect(diff).to.be.closeTo(ethers.parseEther("2"), ethers.parseEther("0.01"));
  });

  it("Should fail to list a ticket if caller is not owner", async () => {
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });

    await expect(
      resale.connect(user2).listTicket(event.target, 0, ethers.parseEther("1"))
    ).to.be.revertedWith("Not ticket owner");
  });

  it("Should fail to buy resale ticket with insufficient ETH", async () => {
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });
    await event.connect(user1).approve(resale.target, 0);
    await resale.connect(user1).listTicket(event.target, 0, ethers.parseEther("2"));

    await expect(
      resale.connect(user2).buyTicketResale(event.target, 0, { value: ethers.parseEther("1") })
    ).to.be.revertedWith("Insufficient ETH");
  });

  it("Should refund excess ETH when buying resale ticket", async () => {
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });
    await event.connect(user1).approve(resale.target, 0);
    await resale.connect(user1).listTicket(event.target, 0, ethers.parseEther("2"));

    const user2BalanceBefore = await ethers.provider.getBalance(user2.address);

    // User2 sends 3 ETH but price is 2 ETH, should refund 1 ETH minus gas
    const tx = await resale.connect(user2).buyTicketResale(event.target, 0, { value: ethers.parseEther("3") });
    await tx.wait();

    const user2BalanceAfter = await ethers.provider.getBalance(user2.address);
    const spent = user2BalanceBefore - user2BalanceAfter;

    expect(spent).to.be.lessThan(ethers.parseEther("2.1"));
    expect(spent).to.be.greaterThan(ethers.parseEther("1.9"));
  });

    it("getTicketsOfOwner should return all tokenIds owned by user", async () => {
    // user1 buys 2 tickets
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });    // tokenId 0
    await event.connect(user1).buyTicket({ value: ethers.parseEther("1.5") });  // tokenId 1

    const tickets = await event.getTicketsOfOwner(user1.address);

    expect(tickets.length).to.equal(2);
    expect(tickets[0]).to.equal(0);
    expect(tickets[1]).to.equal(1);
  });

it("OwnsToken should correctly confirm ownership", async () => {
  // user2 buys ticket #0
  await event.connect(user2).buyTicket({ value: ethers.parseEther("1") }); // tokenId 0

  // user2 only owns tokenId 0, tokenId 1 doesn't exist yet
  expect(await event.ownsToken(user2.address, 0)).to.be.true;

  // tokenId 1 does not exist, should not own it
  await expect(event.ownsToken(user2.address, 1)).to.be.revertedWithCustomError(event, "ERC721NonexistentToken");

  expect(await event.ownsToken(owner.address, 0)).to.be.false;
});

it("Should verify signature and ticket ownership", async () => {
  const message = "Allow entry to event TEST";

  // user1 buys ticket #0 first!
  await event.connect(user1).buyTicket({ value: ethers.parseEther("1") });

  // user1 signs the message
  const signature = await user1.signMessage(message);

  // Recover signer address (simulate backend or contract behavior)
  const signerAddress = ethers.verifyMessage(message, signature);

  // Verify signer owns a ticket (tokenId 0)
  const ownsTicket = await event.ownsToken(signerAddress, 0);
  expect(ownsTicket).to.be.true;

  expect(signerAddress).to.equal(user1.address);
});


});
