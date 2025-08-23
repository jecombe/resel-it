# ReselIT Smart Contract

## Description

This project implements an event ticketing system with NFT tickets (ERC721), featuring:

* Ticket purchase with **dynamic pricing**
* Secure ticket resale via the `ReselIT` contract
* Ownership verification functions to validate entry
* Automated tests using Hardhat and TypeScript

---

## Main Features

* **EventFactory**: dynamically deploys EventTicket contracts
* **EventTicket**: ERC721 NFT contract representing tickets, with dynamic pricing
* **ReselIT**: resale marketplace contract managing listings and secure transfers
* **Utility functions**:

  * `getTicketsOfOwner(address user)`: returns all tickets owned by a user
  * `ownsToken(address user, uint256 tokenId)`: checks if a user owns a specific ticket

---

## Installation

```bash
git clone <repo-url>
cd <repo-folder>
npm install
```

---

## Local Deployment (Hardhat)

```bash
npx hardhat compile
npx hardhat test
```

---

## Tests

The test suite covers:

* Buying tickets with dynamic pricing
* Secure resale and listing management
* ETH refunds on overpayment
* Ticket ownership verification via `getTicketsOfOwner` and `ownsToken`
* Signature-based ownership verification simulating entry validation (e.g. QR code scan)

Run tests with:

```bash
npx hardhat test
```

---

## Example of Entry Verification Using Signatures (Backend Simulation)

The user signs a message client-side with their wallet:

```ts
const message = "Allow entry to event TEST";
const signature = await user.signMessage(message);
```

The backend or security system verifies the signature and ticket ownership:

```ts
const signerAddress = ethers.verifyMessage(message, signature);
const ownsTicket = await event.ownsToken(signerAddress, tokenId);

if (ownsTicket) {
  // Grant entry
} else {
  // Deny entry
}
```

## Addresses Helinsky
ResetlIT: 0x3f03CE1164071722328c14d46a53092aebc8a8B0
FactoryEvent: 0xED075F87025651b8ae5a1B23683C500d48A48dDa

## Addresses Sepolia
ResetlIT: 0x3e192f37fC41a6Ac7a9f5BeAdEF78244CfA1B35D
FactoryEvent: 0xc6265bD02cC681Ab445FE7DFc395183B1eAf97F2
