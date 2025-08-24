"use client";
import { useState } from "react";
import { usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { formatEther, parseEther, PublicClient } from "viem";
import { FACTORY_ADDRESS, EventFactoryABI, EventTicketABI } from "../../utils/contract";
import Header from "../../component/Header";
import Loading from "../../component/Loading";

type HexAddress = `0x${string}`;

export default function EventsPage() {
  const { data: events } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: EventFactoryABI,
    functionName: "getEvents",
  }) as { data?: HexAddress[] };

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [maxTickets, setMaxTickets] = useState(100);
  const [basePrice, setBasePrice] = useState("0.05");
  const [dynamicPricing, setDynamicPricing] = useState(true);
  const [priceIncrement, setPriceIncrement] = useState("0.01");

  const { writeContractAsync: createEvent, isPending: creating } = useWriteContract();

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
      setName("");
      setSymbol("");
      setMaxTickets(100);
      setBasePrice("0.05");
      setDynamicPricing(true);
      setPriceIncrement("0.01");
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message);
      } else if (
        typeof e === "object" &&
        e !== null &&
        "shortMessage" in e &&
        typeof (e as { shortMessage: string }).shortMessage === "string"
      ) {
        alert((e as { shortMessage: string }).shortMessage);
      } else {
        alert("Error creating event.");
      }
    }
  }

  if (!events) return <Loading message="Loading..." />;

  return (
    <>
      <Header />
      <div className="flex justify-center items-start px-4 sm:px-20 py-12 min-h-[calc(100vh-60px)]">
        <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl">
          <div className="flex-1 bg-[#1b1c26] p-6 rounded-xl shadow-lg">
            <h2 className="text-indigo-200 text-center text-xl font-semibold mb-6">Sales</h2>
            {!events.length && <p className="text-gray-400">No sales available.</p>}
            {events.map((addr) => (
              <EventCard key={addr} address={addr} />
            ))}
          </div>

          <div className="flex-1 bg-[#1b1c26] p-6 rounded-xl shadow-lg">
            <h2 className="text-indigo-200 text-center text-xl font-semibold mb-6">Create Sale</h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="mb-1 text-gray-300">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="p-3 rounded-lg bg-[#0f1118] border border-[#3a3d5c] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-gray-300">Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="p-3 rounded-lg bg-[#0f1118] border border-[#3a3d5c] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-gray-300">Max Sales</label>
                <input
                  type="number"
                  value={maxTickets}
                  onChange={(e) => setMaxTickets(+e.target.value)}
                  className="p-3 rounded-lg bg-[#0f1118] border border-[#3a3d5c] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-gray-300">Base Price (ETH)</label>
                <input
                  type="text"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="p-3 rounded-lg bg-[#0f1118] border border-[#3a3d5c] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={dynamicPricing}
                  onChange={(e) => setDynamicPricing(e.target.checked)}
                  className="w-5 h-5"
                />
                <label className="text-gray-300">Dynamic Pricing</label>
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-gray-300">Price Increment (ETH)</label>
                <input
                  type="text"
                  value={priceIncrement}
                  onChange={(e) => setPriceIncrement(e.target.value)}
                  className="p-3 rounded-lg bg-[#0f1118] border border-[#3a3d5c] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleCreateEvent}
                disabled={creating}
                className="w-full py-3 mt-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function EventCard({ address }: { address: HexAddress }) {
  const { data: name } = useReadContract({ address, abi: EventTicketABI, functionName: "name" }) as { data?: string };
  const { data: symbol } = useReadContract({ address, abi: EventTicketABI, functionName: "symbol" }) as { data?: string };
  const { data: maxTickets } = useReadContract({ address, abi: EventTicketABI, functionName: "maxTickets" }) as { data?: bigint };
  const { data: ticketsSold } = useReadContract({ address, abi: EventTicketABI, functionName: "ticketsSold" }) as { data?: bigint };
  const { data: currentPrice } = useReadContract({ address, abi: EventTicketABI, functionName: "getCurrentPrice" }) as { data?: bigint };
  const publicClient = usePublicClient() as PublicClient;
  const { writeContractAsync } = useWriteContract();
  const [buying, setBuying] = useState(false);

  async function buy() {
    if (!currentPrice) return;
    try {
      setBuying(true);
      const tx = await writeContractAsync({
        address,
        abi: EventTicketABI,
        functionName: "buyTicket",
        args: [],
        value: currentPrice,
      });
      await publicClient.waitForTransactionReceipt({ hash: tx });
      alert("Ticket Buy !");
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message);
      } else if (
        typeof e === "object" &&
        e !== null &&
        "shortMessage" in e &&
        typeof (e as { shortMessage: string }).shortMessage === "string"
      ) {
        alert((e as { shortMessage: string }).shortMessage);
      } else {
        alert("Error when buying");
      }
    } finally {
      setBuying(false);
    }
  }

  if (!name || !symbol) return <Loading message="Loading..." />;

  return (
    <div className="bg-[#222330] p-6 rounded-xl shadow-md mb-4">
      <b className="text-white">{String(name)} ({String(symbol)})</b>
      <div className="text-gray-400 text-sm mt-1 mb-2">
        Sold: {ticketsSold ? ticketsSold.toString() : "0"} / {maxTickets ? maxTickets.toString() : "0"}
      </div>
      <div className="flex justify-between items-center">
        <div className="text-white">
          Current Price: {currentPrice ? `${formatEther(currentPrice)} ETH` : "..."}
        </div>
        <button
          onClick={buy}
          disabled={!currentPrice || buying}
          className="px-4 py-2 bg-blue-500 rounded-lg text-white font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {buying ? "Buying..." : "Buy"}
        </button>
      </div>
    </div>
  );
}
