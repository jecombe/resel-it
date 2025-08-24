"use client";
import { useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { parseEther, formatEther, PublicClient } from "viem";
import Header from "../../component/Header";
import Loading from "../../component/Loading";
import { FACTORY_ADDRESS, EventFactoryABI, EventTicketABI, RESELIT_ADDRESS, ReselITABI } from "../../utils/contract";

export default function Profile() {
  const { address } = useAccount();
  const { data: events } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: EventFactoryABI,
    functionName: "getEvents",
  }) as { data?: `0x${string}`[] };

  if (!events) return <Loading message="Loading your events..." />;

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto p-8 text-white">
        <h2 className="text-center text-indigo-200 text-2xl font-semibold mb-6">My Profile</h2>
        {!address && <p className="text-white">Connect your wallet to see your tickets.</p>}
        {address && (!events.length ? (
          <p className="text-gray-400">No events for now</p>
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
    <div className="bg-[#222330] p-6 mb-4 rounded-xl shadow-md flex flex-col gap-3">
      <b className="text-indigo-300">{String(name)}</b> — <span className="text-gray-400">{eventAddress}</span>
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

  if (!publicClient) return null;

  const approveAndList = async () => {
    try {
      setIsLoading(true);

      const approveHash = await writeContractAsync({
        address: eventAddress,
        abi: EventTicketABI,
        functionName: "approve",
        args: [RESELIT_ADDRESS, tokenId],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      const listHash = await writeContractAsync({
        address: RESELIT_ADDRESS,
        abi: ReselITABI,
        functionName: "listTicket",
        args: [eventAddress, tokenId, parseEther(listPrice)],
      });
      await publicClient.waitForTransactionReceipt({ hash: listHash });

      alert("Ticket Listed!");
    } catch (e: unknown) {
      if (e instanceof Error) alert(e.message);
      else if (typeof e === "object" && e !== null && "shortMessage" in e) alert((e as { shortMessage: string }).shortMessage);
      else alert("Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center border-t border-[#242a3b] pt-2 mt-2 gap-2">
      <div className="text-white">
        Token #{String(tokenId)} — Current price: {currentPrice ? `${formatEther(currentPrice as bigint)} ETH` : "..."}
      </div>
      <div className="flex items-center gap-2 mt-2 md:mt-0">
        <input
          type="text"
          className="w-36 px-3 py-2 rounded-lg bg-[#0f1118] border border-[#3a3d5c] text-white"
          value={listPrice}
          onChange={e => setListPrice(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold rounded-lg shadow hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-transform transform hover:-translate-y-1"
          disabled={isLoading}
          onClick={approveAndList}
        >
          {isLoading ? "Listing..." : "List"}
        </button>
      </div>
    </div>
  );
}
