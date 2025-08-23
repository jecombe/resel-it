// src/pages/list-resale.tsx
import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseEther, formatEther } from "viem";
import Header from "../component/Header";
import { FACTORY_ADDRESS, EventFactoryABI, EventTicketABI, RESELIT_ADDRESS, ReselITABI } from "../utils/contract";

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

  // Récupération des events depuis la factory
  const { data: events } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: EventFactoryABI,
    functionName: "getEvents",
  }) as { data?: `0x${string}`[] };

  // Récupération de tous les tickets en revente
  const { data: allListings } = useReadContract({
    address: RESELIT_ADDRESS,
    abi: ReselITABI,
    functionName: "getAllListings",
  }) as { data?: ResaleTicket[] };
  
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
      <div className="page-center">
        <div className="container row">
          {/* LEFT: Mes tickets */}
          <div className="left">
            <h2>List My Tickets</h2>
            {!userAddress && <p>Connecte ton wallet pour voir tes tickets.</p>}
            {userAddress && events?.map(ev => (
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

          {/* RIGHT: Tickets en revente */}
          <div className="right">
            <h2>Tickets Available for Resale</h2>
            {!allListings?.length && <p>No tickets for resale.</p>}
            {allListings?.map(l => (
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

      <style jsx>{`
        .page-center { display: flex; justify-content: center; align-items: flex-start; padding: 3rem 1rem; min-height: calc(100vh - 60px); }
        .container.row { display: flex; flex-direction: row; gap: 2rem; width: 100%; max-width: 1200px; }
        .left, .right { flex: 1; background: #1b1c26; padding: 2rem; border-radius: 12px; box-shadow: 0 6px 18px rgba(0,0,0,0.5); }
        h2 { margin-bottom: 1rem; color: #c7d2fe; text-align: center; }
        .card { background: #222330; padding: 1rem; margin-bottom: 1rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
        button { width: 100%; padding: 0.5rem 1rem; border-radius: 8px; border: none; background: #6366f1; color: #fff; cursor: pointer; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        input { padding: 0.5rem; border-radius: 6px; background: #0f1118; color: #fff; border: 1px solid #3a3d5c; width: 80px; }
      `}</style>
    </>
  );
}

// ---------------------
// Composant pour les tickets d'un event (LEFT)
// ---------------------
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
    <div className="card">
      <b>{eventAddress}</b>
      {tokenIds.map(id => {
        const key = `${eventAddress}-${id}`;
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span>Token #{id.toString()}</span>
            <input
              value={listPriceMap[key] || ""}
              onChange={e => setListPriceMap(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder="Price in ETH"
            />
            <button onClick={() => handleListTicket(eventAddress, id)} disabled={listingPending}>
              {listingPending ? "Listing..." : "List"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------
// Composant pour tickets en revente (RIGHT)
// ---------------------
function ResaleTicketCard({ listing, handleBuyTicket, buyingPending }: {
  listing: ResaleTicket;
  handleBuyTicket: (eventAddress: `0x${string}`, tokenId: bigint, price: bigint) => void;
  buyingPending: boolean;
}) {
  return (
    <div className="card">
      <div>Event: {listing.eventAddress}</div>
      <div>Token #{listing.tokenId.toString()}</div>
      <div>Resale Price: {formatEther(listing.price)} ETH</div>
      <div>Seller: {listing.seller}</div>
      <button
        onClick={() => handleBuyTicket(listing.eventAddress, listing.tokenId, listing.price)}
        disabled={buyingPending}
      >
        {buyingPending ? "Buying..." : "Buy"}
      </button>
    </div>
  );
}


