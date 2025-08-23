// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./EventTicket.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract ReselIT is IERC721Receiver {
    struct ListedTicket {
        address eventAddress;
        uint256 tokenId;
        uint256 price;
        address seller;
    }

    ListedTicket[] public allListings;

    // eventAddress => tokenId => Listing
    mapping(address => mapping(uint256 => ListedTicket)) public listings;

    event TicketListed(
        address eventAddress,
        uint256 tokenId,
        uint256 price,
        address seller
    );
    event TicketBought(
        address eventAddress,
        uint256 tokenId,
        uint256 price,
        address buyer
    );
    event TicketDelisted(address eventAddress, uint256 tokenId, address seller);

    // Permet au contrat de recevoir des NFT via safeTransferFrom
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    // Lister un ticket à la vente
    function listTicket(
        address eventAddress,
        uint256 tokenId,
        uint256 price
    ) external {
        EventTicket eventContract = EventTicket(eventAddress);
        require(
            eventContract.ownerOf(tokenId) == msg.sender,
            "Not ticket owner"
        );
        require(price > 0, "Price must be > 0");

        // Transfert du NFT au contrat (escrow)
        eventContract.safeTransferFrom(msg.sender, address(this), tokenId);

        // Enregistrement de l'annonce
        allListings.push(
            ListedTicket({
                eventAddress: eventAddress,
                tokenId: tokenId,
                price: price,
                seller: msg.sender
            })
        );
        listings[eventAddress][tokenId] = ListedTicket({
            eventAddress: eventAddress,
            tokenId: tokenId,
            price: price,
            seller: msg.sender
        });

        emit TicketListed(eventAddress, tokenId, price, msg.sender);
    }

    // Supprimer un ticket de la liste (delist)
    function delistTicket(address eventAddress, uint256 tokenId) external {
        ListedTicket memory listing = listings[eventAddress][tokenId];
        require(listing.price > 0, "Ticket not listed");
        require(listing.seller == msg.sender, "Not seller");

        EventTicket eventContract = EventTicket(eventAddress);

        // Rendre le NFT au vendeur
        eventContract.safeTransferFrom(address(this), msg.sender, tokenId);

        // Supprimer la vente
        delete listings[eventAddress][tokenId];
        _removeFromAllListings(eventAddress, tokenId);

        emit TicketDelisted(eventAddress, tokenId, msg.sender);
    }

    // Acheter un ticket en revente
    function buyTicketResale(
        address eventAddress,
        uint256 tokenId
    ) external payable {
        ListedTicket memory listing = listings[eventAddress][tokenId];
        require(listing.price > 0, "Not for sale");
        require(msg.value >= listing.price, "Insufficient ETH");

        EventTicket eventContract = EventTicket(eventAddress);

        // Transfert du NFT à l'acheteur
        eventContract.safeTransferFrom(address(this), msg.sender, tokenId);

        // Paiement au vendeur
        payable(listing.seller).transfer(listing.price);

        // Supprimer la vente
        delete listings[eventAddress][tokenId];
        _removeFromAllListings(eventAddress, tokenId);

        // Remboursement si surpaiement
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        if (eventContract.dynamicPricing()) {
            eventContract.decreaseBasePrice();
        }

        emit TicketBought(eventAddress, tokenId, listing.price, msg.sender);
    }

    function _removeFromAllListings(
        address eventAddress,
        uint256 tokenId
    ) internal {
        for (uint i = 0; i < allListings.length; i++) {
            if (
                allListings[i].eventAddress == eventAddress &&
                allListings[i].tokenId == tokenId
            ) {
                allListings[i] = allListings[allListings.length - 1];
                allListings.pop();
                break;
            }
        }
    }

    function getAllListings() external view returns (ListedTicket[] memory) {
        return allListings;
    }

    // Achat ticket initial depuis l'EventTicket
    function buyTicketFromEvent(address eventAddress) external payable {
        EventTicket eventContract = EventTicket(eventAddress);
        eventContract.buyTicket{value: msg.value}();
    }
}
