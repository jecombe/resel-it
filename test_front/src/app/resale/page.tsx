/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import Header from "../../component/Header";
import { FACTORY_ADDRESS, EventFactoryABI, EventTicketABI, RESELIT_ADDRESS, ReselITABI } from "../../utils/contract";
import styles from "../../styles/list-resale.module.css";
import Loading from "../../component/Loading";

type ResaleTicket = {
  eventAddress: `0x${string}`;
  tokenId: bigint;
  price: bigint;
  seller: `0x${string}`;
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
  }) as { data?: `0x${string}`[] };

  const { data: allListings } = useReadContract({
    address: RESELIT_ADDRESS,
    abi: ReselITABI,
    functionName: "getAllListings",
  }) as { data?: ResaleTicket[] };

  if (!events || !allListings) return <Loading message="Chargement des données..." />;

  const handleListTicket = async (eventAddress: `0x${string}`, tokenId: bigint) => {
    const price = listPriceMap[`${eventAddress}-${tokenId}`];
    if (!price) return alert("Entrez un prix valide");

    try {
      await listTicketAsync({
        address: RESELIT_ADDRESS,
        abi: ReselITABI,
        functionName: "listTicket",
        args: [eventAddress, tokenId, parseEther(price)],
      });
      alert("Ticket listé !");
      setListPriceMap(prev => ({ ...prev, [`${eventAddress}-${tokenId}`]: "" }));
     
    } catch (e: any) {
      alert(e?.shortMessage || e.message || "Erreur lors du listing");
    }
  };

  const handleBuyTicket = async (eventAddress: `0x${string}`, tokenId: bigint, price: bigint) => {
    try {
      await buyTicketAsync({
        address: RESELIT_ADDRESS,
        abi: ReselITABI,
        functionName: "buyTicketResale",
        args: [eventAddress, tokenId],
        value: price,
      });
      alert("Ticket acheté !");
    } catch (e: any) {
      alert(e?.shortMessage || e.message || "Erreur lors de l'achat");
    }
  };

  return (
    <>
      <Header />
      <div className={styles.pageCenter}>
        <div className={styles.container}>
          <div className={styles.left}>
            <h2 className={styles.heading}>List My Tickets</h2>
            {!userAddress && <p>Connect your wallet to see your tickets.</p>}
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

          <div className={styles.right}>
            <h2 className={styles.heading}>Tickets Available for Resale</h2>
            {!allListings.length && <p className={styles.small}>No tickets for resale.</p>}
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

function UserEventTickets({ eventAddress, userAddress, listPriceMap, setListPriceMap, handleListTicket, listingPending }: {
  eventAddress: `0x${string}`;
  userAddress: `0x${string}`;
  listPriceMap: Record<string, string>;
  setListPriceMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleListTicket: (eventAddress: `0x${string}`, tokenId: bigint) => void;
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
    <div className={styles.card}>
      <b>{eventAddress}</b>
      {tokenIds.map(id => {
        const key = `${eventAddress}-${id}`;
        return (
          <div key={key} className={styles.row}>
            <input
              className={styles.input}
              value={listPriceMap[key] || ""}
              onChange={e => setListPriceMap(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={`Token #${id.toString()} Price in ETH`}
            />
            <button
              className={styles.button}
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

function ResaleTicketCard({ listing, handleBuyTicket, buyingPending }: {
  listing: ResaleTicket;
  handleBuyTicket: (eventAddress: `0x${string}`, tokenId: bigint, price: bigint) => void;
  buyingPending: boolean;
}) {
  return (
    <div className={styles.card}>
      <div>Event: {listing.eventAddress}</div>
      <div>Token #{listing.tokenId.toString()}</div>
      <div>Resale Price: {formatEther(listing.price)} ETH</div>
      <button
        className={styles.button}
        onClick={() => handleBuyTicket(listing.eventAddress, listing.tokenId, listing.price)}
        disabled={buyingPending}
      >
        {buyingPending ? "Buying..." : "Buy"}
      </button>
    </div>
  );
}
