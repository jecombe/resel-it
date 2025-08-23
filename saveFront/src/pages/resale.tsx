// src/pages/list-resale.tsx
import { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import {
  FACTORY_ADDRESS,
  EventFactoryABI,
  EventTicketABI,
  RESELIT_ADDRESS,
  ReselITABI,
} from "../utils/contract";
import Header from "../component/Header";

export default function ListResalePage() {
  const { address: userAddress } = useAccount();
  const { data: events } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: EventFactoryABI,
    functionName: "getEvents",
  }) as { data?: `0x${string}`[] };

  const [listPrice, setListPrice] = useState("0");
  const { writeContractAsync, isPending: listingPending } = useWriteContract();
  const [resaleTickets, setResaleTickets] = useState<
    { event: `0x${string}`; tokenId: bigint; seller: `0x${string}`; price: bigint; currentPrice: bigint | null }[]
  >([]);
  const { writeContractAsync: buyContract, isPending: buyingPending } = useWriteContract();

  // Fetch tickets en revente
  useEffect(() => {
    if (!events?.length) return;

    const fetchResale = async () => {
      const allTickets: typeof resaleTickets = [];
      for (const ev of events) {
        try {
          for (let i = 0; i < 100; i++) {
            const listing = await useReadContract({
              address: RESELIT_ADDRESS,
              abi: ReselITABI,
              functionName: "listings",
              args: [ev, i],
            }) as { data?: { seller: `0x${string}`; price: bigint } };

            if (listing?.data && listing.data.price > BigInt(0)) {
              const { data: currentPrice } = await useReadContract({
                address: ev,
                abi: EventTicketABI,
                functionName: "getCurrentPrice",
                args: [i],
              }) as { data?: bigint };

              allTickets.push({
                event: ev,
                tokenId: BigInt(i),
                seller: listing.data.seller,
                price: listing.data.price,
                currentPrice: currentPrice ?? null,
              });
            }
          }
        } catch {}
      }
      setResaleTickets(allTickets);
    };

    fetchResale();
  }, [events]);

  const buyResaleTicket = async (event: `0x${string}`, tokenId: bigint, price: bigint) => {
    try {
      await buyContract({
        address: RESELIT_ADDRESS,
        abi: ReselITABI,
        functionName: "buyTicketResale",
        args: [event, tokenId],
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
      <div className="page-center">
        <div className="container row">
          {/* Left: User NFTs / Listing */}
          <div className="left">
            <h2>List Ticket for Resale</h2>
            {!userAddress && <p>Connecte ton wallet pour voir tes tickets.</p>}
            {userAddress && (!events?.length ? <p>Aucun event créé pour l’instant.</p> :
              events.map(ev => (
                <OwnedTickets
                  key={ev}
                  eventAddress={ev}
                  owner={userAddress}
                  listPrice={listPrice}
                  setListPrice={setListPrice}
                  writeContractAsync={writeContractAsync}
                  listingPending={listingPending}
                />
              ))
            )}
          </div>

          {/* Right: Tickets Available for Resale */}
          <div className="right">
            <h2>Tickets Available for Resale</h2>
            {resaleTickets.length === 0 && <p>No tickets for resale.</p>}
            {resaleTickets.map(t => (
              <ResaleCard
                key={`${t.event}-${t.tokenId}`}
                ticket={t}
                buyResaleTicket={buyResaleTicket}
                buyingPending={buyingPending}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-center { display: flex; justify-content: center; align-items: flex-start; padding: 3rem 1rem; min-height: calc(100vh - 60px); }
        .container.row { display: flex; flex-direction: row; gap: 2rem; width: 100%; max-width: 1100px; }
        .left, .right { flex: 1; background: #1b1c26; padding: 2rem; border-radius: 12px; box-shadow: 0 6px 18px rgba(0,0,0,0.5); }
        h2 { margin-bottom: 1.5rem; color: #c7d2fe; text-align: center; }
        input[type="text"] { padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #3a3d5c; background: #0f1118; color: #fff; font-size: 1rem; }
        button { width: 100%; padding: 0.75rem 1rem; border-radius: 8px; border: none; background: linear-gradient(90deg, #3b82f6, #6366f1); color: #fff; font-weight: bold; cursor: pointer; transition: all 0.2s; margin-top: 0.5rem; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.3); }
        .card { background: #222330; padding: 1rem; margin-bottom: 1rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
        .row { display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; }
      `}</style>
    </>
  );
}

// --------------------------
// COMPOSANTS
// --------------------------
function OwnedTickets({
  eventAddress,
  owner,
  listPrice,
  setListPrice,
  writeContractAsync,
  listingPending,
}: {
  eventAddress: `0x${string}`;
  owner: `0x${string}`;
  listPrice: string;
  setListPrice: (price: string) => void;
  writeContractAsync: any;
  listingPending: boolean;
}) {
  const { data: tokenIds } = useReadContract({
    address: eventAddress,
    abi: EventTicketABI,
    functionName: "getTicketsOfOwner",
    args: [owner],
  }) as { data?: bigint[] };

  if (!tokenIds || tokenIds.length === 0) return null;

  return (
    <div className="card">
      <b>{eventAddress}</b>
      {tokenIds.map(id => (
        <TicketItem
          key={`${eventAddress}-${id}`}
          eventAddress={eventAddress}
          tokenId={id}
          listPrice={listPrice}
          setListPrice={setListPrice}
          writeContractAsync={writeContractAsync}
          listingPending={listingPending}
        />
      ))}
    </div>
  );
}

function TicketItem({
  eventAddress,
  tokenId,
  listPrice,
  setListPrice,
  writeContractAsync,
  listingPending,
}: {
  eventAddress: `0x${string}`;
  tokenId: bigint;
  listPrice: string;
  setListPrice: (price: string) => void;
  writeContractAsync: any;
  listingPending: boolean;
}) {
  // Le hook Wagmi ici fonctionne parfaitement
  const { data: currentPrice } = useReadContract({
    address: eventAddress,
    abi: EventTicketABI,
    functionName: "getCurrentPrice",
  }) as { data?: bigint };

  const approveAndList = async () => {
    try {
      await writeContractAsync({
        address: eventAddress,
        abi: EventTicketABI,
        functionName: "approve",
        args: [RESELIT_ADDRESS, tokenId],
      });
      await writeContractAsync({
        address: RESELIT_ADDRESS,
        abi: ReselITABI,
        functionName: "listTicket",
        args: [eventAddress, tokenId, parseEther(listPrice)],
      });
      alert("Ticket listé !");
      setListPrice("0");
    } catch (e:any) {
      alert(e?.shortMessage || e.message || "Erreur lors du listing");
    }
  };

  return (
    <div className="row">
      <div>
        Token #{tokenId.toString()} <br />
        Current Price: {currentPrice ? `${formatEther(currentPrice)} ETH` : "..."}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input style={{ width: 100 }} value={listPrice} onChange={e => setListPrice(e.target.value)} />
        <button onClick={approveAndList} disabled={listingPending}>
          {listingPending ? "Listing..." : "Lister"}
        </button>
      </div>
    </div>
  );
}


function ResaleCard({
  ticket,
  buyResaleTicket,
  buyingPending,
}: {
  ticket: { event: `0x${string}`, tokenId: bigint, seller: `0x${string}`, price: bigint, currentPrice: bigint | null };
  buyResaleTicket: (event: `0x${string}`, tokenId: bigint, price: bigint) => void;
  buyingPending: boolean;
}) {
  return (
    <div className="card">
      <div>Event: {ticket.event}</div>
      <div>Token #{ticket.tokenId.toString()}</div>
      <div>Current Price: {ticket.currentPrice ? `${formatEther(ticket.currentPrice)} ETH` : "..."}</div>
      <div>Resale Price: {formatEther(ticket.price)} ETH</div>
      <div>Seller: {ticket.seller}</div>
      <button onClick={() => buyResaleTicket(ticket.event, ticket.tokenId, ticket.price)} disabled={buyingPending}>
        {buyingPending ? "Buying..." : "Buy"}
      </button>
    </div>
  );
}
