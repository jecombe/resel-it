// src/pages/events.tsx
import { useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { formatEther, parseEther } from "viem";
import { FACTORY_ADDRESS, EventFactoryABI, EventTicketABI } from "../utils/contract";
import Header from "../component/Header";

export default function EventsPage() {
  const { data: events } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: EventFactoryABI,
    functionName: "getEvents",
  }) as { data?: `0x${string}`[] };

  // Form state for creating event
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [maxTickets, setMaxTickets] = useState(100);
  const [basePrice, setBasePrice] = useState("0.05");
  const [dynamicPricing, setDynamicPricing] = useState(true);
  const [priceIncrement, setPriceIncrement] = useState("0.01");

  const { writeContractAsync: createEvent, isPending: creating } = useWriteContract();

  // Gestion création d'event
  async function handleCreateEvent() {
    try {
      await createEvent({
        address: FACTORY_ADDRESS,
        abi: EventFactoryABI,
        functionName: "createEvent",
        args: [
          name,
          symbol,
          BigInt(maxTickets),
          parseEther(basePrice),
          dynamicPricing,
          parseEther(priceIncrement),
        ],
      });
      alert("Event created!");
      setName(""); setSymbol(""); setMaxTickets(100); setBasePrice("0.05"); setDynamicPricing(true); setPriceIncrement("0.01");
    } catch (e: any) {
      if (e?.shortMessage?.includes("User rejected") || e?.message?.includes("User denied")) {
        alert("Transaction refused by user.");
      } else {
        alert(e?.shortMessage || e.message || "Error creating event.");
      }
    }
  }

  return (
    <>
      <Header />
      <div className="page-center">
        <div className="container row">
          {/* Left: Events list */}
          <div className="left">
            <h2>Events</h2>
            {!events?.length && <p>No events available.</p>}
            {events?.map((addr) => (
              <EventCard key={addr} address={addr} />
            ))}
          </div>

          {/* Right: Create Event Form */}
          <div className="right">
            <h2>Create Event</h2>

            <div className="form-group">
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Symbol</label>
              <input value={symbol} onChange={(e) => setSymbol(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Max Tickets</label>
              <input type="number" value={maxTickets} onChange={(e) => setMaxTickets(+e.target.value)} />
            </div>
            <div className="form-group">
              <label>Base Price (ETH)</label>
              <input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
            </div>
            <div className="form-group checkbox-group">
              <input type="checkbox" checked={dynamicPricing} onChange={(e) => setDynamicPricing(e.target.checked)} />
              <label>Dynamic Pricing</label>
            </div>
            <div className="form-group">
              <label>Price Increment (ETH)</label>
              <input value={priceIncrement} onChange={(e) => setPriceIncrement(e.target.value)} />
            </div>
            <button onClick={handleCreateEvent} disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-center {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 3rem 1rem;
          min-height: calc(100vh - 60px);
        }

        .container {
          display: flex;
          flex-direction: row;
          gap: 2rem;
          width: 100%;
          max-width: 1100px;
        }

        .left, .right {
          flex: 1;
          background: #1b1c26;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 6px 18px rgba(0,0,0,0.5);
        }

        h2 {
          margin-bottom: 1.5rem;
          color: #c7d2fe;
          text-align: center;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 1rem;
        }

        .form-group input[type="text"],
        .form-group input[type="number"] {
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid #3a3d5c;
          background: #0f1118;
          color: #fff;
          font-size: 1rem;
        }

        .checkbox-group {
          flex-direction: row;
          align-items: center;
        }

        .checkbox-group input[type="checkbox"] {
          margin-right: 0.5rem;
          width: 18px;
          height: 18px;
        }

        button {
          width: 100%;
          padding: 0.75rem 1rem;
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          color: #fff;
          font-weight: bold;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0,0,0,0.3);
        }
      `}</style>
    </>
  );
}

// EventCard component
function EventCard({ address }: { address: `0x${string}` }) {
  const { data: name } = useReadContract({ address, abi: EventTicketABI, functionName: "name" });
  const { data: symbol } = useReadContract({ address, abi: EventTicketABI, functionName: "symbol" });
  const { data: maxTickets } = useReadContract({ address, abi: EventTicketABI, functionName: "maxTickets" });
  const { data: ticketsSold } = useReadContract({ address, abi: EventTicketABI, functionName: "ticketsSold" });
  const { data: currentPrice } = useReadContract({ address, abi: EventTicketABI, functionName: "getCurrentPrice" });

  const { writeContractAsync, isPending } = useWriteContract();

  async function buy() {
    if (!currentPrice) return;
    try {
      await writeContractAsync({
        address,
        abi: EventTicketABI,
        functionName: "buyTicket",
        args: [],
        value: currentPrice as bigint,
      });
      alert("Ticket purchased!");
    } catch (e: any) {
      if (e?.shortMessage?.includes("User rejected") || e?.message?.includes("User denied")) {
        alert("Transaction refused by user.");
      } else {
        alert(e?.shortMessage || e.message || "Error buying ticket.");
      }
    }
  }

  return (
    <div className="card">
      <b>{String(name)} ({String(symbol)})</b>
      <div className="small">Sold: {String(ticketsSold)} / {String(maxTickets)}</div>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>Current Price: {currentPrice ? `${formatEther(currentPrice as bigint)} ETH` : "..."}</div>
        <button onClick={buy} disabled={!currentPrice || isPending}>
          {isPending ? "Buying..." : "Buy"}
        </button>
      </div>

      <style jsx>{`
        .card {
          background: #222330;
          padding: 1.5rem;
          margin-bottom: 1rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
      `}</style>
    </div>
  );
}
