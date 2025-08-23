 
"use client"
import { useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { parseEther, formatEther, PublicClient } from "viem";
import Header from "../../component/Header";
import Loading from "../../component/Loading";
import { FACTORY_ADDRESS, EventFactoryABI, EventTicketABI, RESELIT_ADDRESS, ReselITABI } from "../../utils/contract";
import styles from "../../styles/Profile.module.css";

export default function Profile() {
  const { address } = useAccount();
  const { data: events } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: EventFactoryABI,
    functionName: "getEvents",
  }) as { data?: `0x${string}`[] };

  if (!events) return <Loading message="Chargement de vos événements..." />;

  return (
    <>
      <Header />
      <div className={styles.container}>
        <h2 className={styles.title}>My Profile</h2>
        {!address && <p>Connect your wallet to see your tickets.</p>}
        {address && (!events.length ? (
          <p className={styles.small}>No events for now</p>
        ) : (
          events.map(ev => <OwnedTickets key={ev} eventAddress={ev} owner={address} />)
        ))}
      </div>
    </>
  );
}

function OwnedTickets({ eventAddress, owner }: { eventAddress: `0x${string}`, owner: `0x${string}` }) {
  const { data: name } = useReadContract({ address: eventAddress, abi: EventTicketABI, functionName: "name" });
  const { data: tokenIds } = useReadContract({
    address: eventAddress,
    abi: EventTicketABI,
    functionName: "getTicketsOfOwner",
    args: [owner],
  }) as { data?: bigint[] };

  if (!tokenIds || tokenIds.length === 0) return null;

  return (
    <div className={styles.card}>
      <b>{String(name)}</b> — {eventAddress}
      {tokenIds.map(id => (
        <TicketItem key={`${eventAddress}-${id}`} eventAddress={eventAddress} tokenId={id} />
      ))}
    </div>
  );
}

function TicketItem({ eventAddress, tokenId }: { eventAddress: `0x${string}`, tokenId: bigint }) {
  const { data: currentPrice } = useReadContract({ address: eventAddress, abi: EventTicketABI, functionName: "getCurrentPrice" });
  const [listPrice, setListPrice] = useState("0.2");
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);
const publicClient = usePublicClient() as unknown as PublicClient;

  if (!publicClient) return;
  
  const approveAndList = async () => {
    try {
      setIsLoading(true);

      // 1️⃣ Approve
      const approveHash = await writeContractAsync({
        address: eventAddress,
        abi: EventTicketABI,
        functionName: "approve",
        args: [RESELIT_ADDRESS, tokenId],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // 2️⃣ List Ticket
      const listHash = await writeContractAsync({
        address: RESELIT_ADDRESS,
        abi: ReselITABI,
        functionName: "listTicket",
        args: [eventAddress, tokenId, parseEther(listPrice)],
      });
      await publicClient.waitForTransactionReceipt({ hash: listHash });

      alert("Ticket Listed!");
    }  catch (e: unknown) {
  if (e instanceof Error) {
    alert(e.message);
  } else if (typeof e === "object" && e !== null && "shortMessage" in e) {
    alert((e as { shortMessage: string }).shortMessage);
  } else {
    alert("Erreur inconnue");
  }

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <Loading message="Listing en cours..." />}
      <div className={styles.ticketRow}>
        <div>
          Token #{String(tokenId)} — Current price: {currentPrice ? `${formatEther(currentPrice as bigint)} ETH` : "..."}
        </div>
        <div className={styles.ticketRowInner}>
          <input
            className={styles.ticketInput}
            value={listPrice}
            onChange={e => setListPrice(e.target.value)}
          />
          <button className={styles.button} disabled={isLoading} onClick={approveAndList}>
            {isLoading ? "Listing..." : "List"}
          </button>
        </div>
      </div>
    </>
  );
}
