import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { useEffect, useMemo, useState } from "react";
import { FACTORY_ADDRESS, EventFactoryABI, EventTicketABI, RESELIT_ADDRESS, ReselITABI } from "../utils/contract";
import { formatEther, parseEther } from "viem";
import Header from "../component/Header";

export default function Profile() {
  const { address } = useAccount();

  const { data: events } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: EventFactoryABI,
    functionName: "getEvents",
  }) as { data?: `0x${string}`[] };

  return (
    <>
      <Header />
      <div className="container">
        <h2>My profile</h2>
        {!address && <p>Connect your wallet to see your tickets.</p>}
        {address && (!events?.length ? <p className="small">Nothing events for now</p> :
          events.map((ev) => <OwnedTickets key={ev} eventAddress={ev} owner={address} />)
        )}
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
    <div className="card">
      <b>{String(name)}</b> — {eventAddress}
      <div style={{marginTop:8}}>
        {tokenIds.map((id) => <TicketItem key={`${eventAddress}-${id}`} eventAddress={eventAddress} tokenId={id} />)}
      </div>
    </div>
  );
}

function TicketItem({ eventAddress, tokenId }: { eventAddress: `0x${string}`, tokenId: bigint }) {
  const { data: currentPrice } = useReadContract({ address: eventAddress, abi: EventTicketABI, functionName: "getCurrentPrice" });
  const [listPrice, setListPrice] = useState("0.2");
  const { writeContractAsync, isPending } = useWriteContract();

  const approveAndList = async () => {
    try {
      // 1) approve marketplace
      await writeContractAsync({
        address: eventAddress,
        abi: EventTicketABI,
        functionName: "approve",
        args: [RESELIT_ADDRESS, tokenId],
      });
      // 2) list
      await writeContractAsync({
        address: RESELIT_ADDRESS,
        abi: ReselITABI,
        functionName: "listTicket",
        args: [eventAddress, tokenId, parseEther(listPrice)],
      });
      alert("Ticket List !");
    } catch (e:any) {
      alert(e?.shortMessage || e.message || "Erreur");
    }
  };

  return (
    <div className="row" style={{justifyContent:"space-between", alignItems:"center", borderTop:"1px solid #242a3b", paddingTop:10, marginTop:10}}>
      <div>Token #{String(tokenId)} — Current price (primary) : {currentPrice ? `${formatEther(currentPrice as bigint)} ETH` : "..."}</div>
      <div className="row" style={{alignItems:"center"}}>
        <input style={{width:140}} value={listPrice} onChange={e=>setListPrice(e.target.value)} />
        <button disabled={isPending} onClick={approveAndList}>{isPending ? "Listing..." : "Lister"}</button>
      </div>
    </div>
  );
}
