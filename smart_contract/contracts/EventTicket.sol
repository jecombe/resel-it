// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EventTicket is ERC721Enumerable, Ownable {
    uint256 public maxTickets;
    uint256 public ticketsSold;
    uint256 public basePrice;
    uint256 public currentPrice;
    bool public dynamicPricing;
    uint256 public priceIncrement;

    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxTickets,
        uint256 _basePrice,
        bool _dynamicPricing,
        uint256 _priceIncrement,
        address creator
    ) ERC721(name, symbol) Ownable(creator) {
        maxTickets = _maxTickets;
        basePrice = _basePrice;
        dynamicPricing = _dynamicPricing;
        priceIncrement = _priceIncrement;

        currentPrice = basePrice;
    }

    function getTicketsOfOwner(
        address user
    ) external view returns (uint256[] memory) {
        uint256 count = balanceOf(user);
        uint256[] memory tokenIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(user, i);
        }
        return tokenIds;
    }

    function ownsToken(
        address user,
        uint256 tokenId
    ) public view returns (bool) {
        return ownerOf(tokenId) == user;
    }

    function getCurrentPrice() public view returns (uint256) {
        return currentPrice;
    }

    function buyTicket() external payable {
        require(ticketsSold < maxTickets, "Sold out");
        uint256 price = currentPrice;
        require(msg.value >= price, "Insufficient ETH");

        _safeMint(msg.sender, ticketsSold);
        ticketsSold++;

        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }

        payable(owner()).transfer(price);

        if (dynamicPricing) {
            currentPrice = basePrice + (ticketsSold * priceIncrement);
        }
    }

    function decreaseBasePrice() external {
        require(currentPrice >= priceIncrement, "Price cannot go below 0");
        currentPrice -= priceIncrement;

        if (dynamicPricing && basePrice >= priceIncrement) {
            basePrice -= priceIncrement;
        }
    }
}
