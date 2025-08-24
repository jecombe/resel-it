"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import Header from "../../component/Header";
import {
  FACTORY_ADDRESS,
  EventFactoryABI,
  EventTicketABI,
  RESELIT_ADDRESS,
  ReselITABI,
} from "../../utils/contract";
import Loading from "../../component/Loading";

type HexAddress = `0x${string}`;

type ResaleTicket = {
  eventAddress: HexAddress;
  tokenId: bigint;
  price: bigint;
  seller: HexAddress;
};

export default function ListResalePage() {
  const { address: userAddress } = useAccount();
  const [listPriceMap, setListPriceMap] = useState<Record<string, string>>({});
  const { writeContractAsync: listTicketAsync, isPending: listingPending } = useWriteContract();
  const { writeContractAsync: buyTicketAsync, isPending: buyingPending } = useWriteContract();

  const { data: events } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: EventFactoryABI,
    functionName: "getEvents",
  }) as { data?: HexAddress[] };

  const { data: allListings } = useReadContract({
    address: RESELIT_ADDRESS,
    abi: ReselITABI,
    functionName: "getAllListings",
  }) as { data?: ResaleTicket[] };

  if (!events || !allListings) return <Loading message="Loading data..." />;

  const handleListTicket = async (eventAddress: HexAddress, tokenId: bigint) => {
    const price = listPriceMap[`${eventAddress}-${tokenId}`];
    if (!price) return alert("Enter a valid price");

    try {
      await listTicketAsync({
        address: RESELIT_ADDRESS,
        abi: ReselITABI,
        functionName: "listTicket",
        args: [eventAddress, tokenId, parseEther(price)],
      });
      alert("Ticket Listed!");
      setListPriceMap(prev => ({ ...prev, [`${eventAddress}-${tokenId}`]: "" }));
    } catch (e: unknown) {
      if (e instanceof Error) alert(e.message);
      else if (
        typeof e === "object" &&
        e !== null &&
        "shortMessage" in e &&
        typeof (e as { shortMessage: string }).shortMessage === "string"
      ) {
        alert((e as { shortMessage: string }).shortMessage);
      } else {
        alert("Error when listing");
      }
    }
  };

  const handleBuyTicket = async (eventAddress: HexAddress, tokenId: bigint, price: bigint) => {
    try {
      await buyTicketAsync({
        address: RESELIT_ADDRESS,
        abi: ReselITABI,
        functionName: "buyTicketResale",
        args: [eventAddress, tokenId],
        value: price,
      });
      alert("Ticket Bought!");
    } catch (e: unknown) {
      if (e instanceof Error) alert(e.message);
      else if (
        typeof e === "object" &&
        e !== null &&
        "shortMessage" in e &&
        typeof (e as { shortMessage: string }).shortMessage === "string"
      ) {
        alert((e as { shortMessage: string }).shortMessage);
      } else {
        alert("Error when buying");
      }
    }
  };

  return (
    <>
      <Header />
      <div className="flex justify-center items-start p-12 min-h-[calc(100vh-60px)] bg-[#0f1118]">
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-[1100px]">
          <div className="flex-1 bg-[#1b1c26] p-6 rounded-xl shadow-lg">
            <h2 className="text-center text-indigo-200 mb-6 text-xl font-semibold">
              List My Tickets
            </h2>
            {!userAddress && <p className="text-white">Connect your wallet to see your tickets.</p>}
            {userAddress && events.map(ev => (
              <UserEventTickets
                key={ev}
                eventAddress={ev}
                userAddress={userAddress}
                listPriceMap={listPriceMap}
                setListPriceMap={setListPriceMap}
                handleListTicket={handleListTicket}
                listingPending={listingPending}
              />
            ))}
          </div>

          <div className="flex-1 bg-[#1b1c26] p-6 rounded-xl shadow-lg">
            <h2 className="text-center text-indigo-200 mb-6 text-xl font-semibold">
              Tickets Available for Resale
            </h2>
            {!allListings.length && <p className="text-gray-400 text-sm">No tickets for resale.</p>}
            {allListings.map(l => (
              <ResaleTicketCard
                key={`${l.eventAddress}-${l.tokenId}`}
                listing={l}
                handleBuyTicket={handleBuyTicket}
                buyingPending={buyingPending}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function UserEventTickets({
  eventAddress,
  userAddress,
  listPriceMap,
  setListPriceMap,
  handleListTicket,
  listingPending,
}: {
  eventAddress: HexAddress;
  userAddress: HexAddress;
  listPriceMap: Record<string, string>;
  setListPriceMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleListTicket: (eventAddress: HexAddress, tokenId: bigint) => void;
  listingPending: boolean;
}) {
  const { data: tokenIds } = useReadContract({
    address: eventAddress,
    abi: EventTicketABI,
    functionName: "getTicketsOfOwner",
    args: [userAddress],
  }) as { data?: bigint[] };

  if (!tokenIds?.length) return null;

  return (
    <div className="bg-[#222330] p-6 mb-4 rounded-xl shadow-md flex flex-col gap-3">
      <b className="text-indigo-300">{eventAddress}</b>
      {tokenIds.map(id => {
        const key = `${eventAddress}-${id}`;
        return (
          <div key={key} className="flex flex-row gap-3 items-center mt-2">
            <input
              type="text"
              className="flex-1 px-4 py-2 rounded-lg bg-[#0f1118] border border-[#3a3d5c] text-white"
              placeholder={`Token #${id.toString()} Price in ETH`}
              value={listPriceMap[key] || ""}
              onChange={e =>
                setListPriceMap(prev => ({ ...prev, [key]: e.target.value }))
              }
            />
            <button
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-lg shadow hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-transform transform hover:-translate-y-1"
              onClick={() => handleListTicket(eventAddress, id)}
              disabled={listingPending}
            >
              {listingPending ? "Listing..." : "List"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ResaleTicketCard({
  listing,
  handleBuyTicket,
  buyingPending,
}: {
  listing: ResaleTicket;
  handleBuyTicket: (eventAddress: HexAddress, tokenId: bigint, price: bigint) => void;
  buyingPending: boolean;
}) {
  return (
    <div className="bg-[#222330] p-6 mb-4 rounded-xl shadow-md flex flex-col gap-2">
      <div className="text-white">Event: {listing.eventAddress}</div>
      <div className="text-white">Token #{listing.tokenId.toString()}</div>
      <div className="text-indigo-300">Resale Price: {formatEther(listing.price)} ETH</div>
      <button
        className="mt-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-lg shadow hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-transform transform hover:-translate-y-1"
        onClick={() => handleBuyTicket(listing.eventAddress, listing.tokenId, listing.price)}
        disabled={buyingPending}
      >
        {buyingPending ? "Buying..." : "Buy"}
      </button>
    </div>
  );
}
