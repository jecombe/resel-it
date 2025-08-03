// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./EventTicket.sol";

contract EventFactory {
    address[] public events;

    event EventCreated(address eventAddress);

    function createEvent(
        string memory name,
        string memory symbol,
        uint256 maxTickets,
        uint256 basePrice,
        bool dynamicPricing,
        uint256 priceIncrement
    ) external {
        EventTicket newEvent = new EventTicket(
            name,
            symbol,
            maxTickets,
            basePrice,
            dynamicPricing,
            priceIncrement,
            msg.sender
        );
        events.push(address(newEvent));
        emit EventCreated(address(newEvent));
    }

    function getEvents() external view returns (address[] memory) {
        return events;
    }
}
