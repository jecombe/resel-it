// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./EventTicket.sol";

contract ReselIT {
    struct Listing {
        address seller;
        uint256 price;
    }

    // eventAddress => tokenId => Listing
    mapping(address => mapping(uint256 => Listing)) public listings;

    event TicketListed(address eventAddress, uint256 tokenId, uint256 price, address seller);
    event TicketBought(address eventAddress, uint256 tokenId, uint256 price, address buyer);

    // Liste un ticket à la vente
    function listTicket(address eventAddress, uint256 tokenId, uint256 price) external {
        EventTicket eventContract = EventTicket(eventAddress);
        require(eventContract.ownerOf(tokenId) == msg.sender, "Not ticket owner");
        require(price > 0, "Price must be > 0");

        // Transfert temporaire au contrat ou juste vérification ?
        // Ici on laisse le ticket chez le vendeur, la sécurité c'est qu'il doit toujours être owner

        listings[eventAddress][tokenId] = Listing(msg.sender, price);
        emit TicketListed(eventAddress, tokenId, price, msg.sender);
    }

    // Acheter un ticket en revente
    function buyTicketResale(address eventAddress, uint256 tokenId) external payable {
        Listing memory listing = listings[eventAddress][tokenId];
        require(listing.price > 0, "Not for sale");
        require(msg.value >= listing.price, "Insufficient ETH");

        EventTicket eventContract = EventTicket(eventAddress);
        require(eventContract.ownerOf(tokenId) == listing.seller, "Seller not owner anymore");

        // Transfert du NFT
        eventContract.safeTransferFrom(listing.seller, msg.sender, tokenId);

        // Paiement au vendeur
        payable(listing.seller).transfer(listing.price);

        // Supprime la vente
        delete listings[eventAddress][tokenId];

        // Remboursement si surpaiement
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit TicketBought(eventAddress, tokenId, listing.price, msg.sender);
    }

    // Acheter ticket à la vente initiale (forward à EventTicket)
    function buyTicketFromEvent(address eventAddress) external payable {
        EventTicket eventContract = EventTicket(eventAddress);
        eventContract.buyTicket{value: msg.value}();
    }
}
