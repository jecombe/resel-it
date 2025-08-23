 
 
"use client"
import { useState } from 'react';
import { usePublicClient, useReadContract, useWriteContract } from 'wagmi';
import { formatEther, parseEther, PublicClient } from 'viem';
import { FACTORY_ADDRESS, EventFactoryABI, EventTicketABI } from '../../utils/contract';
import Header from '../../component/Header';
import styles from '../../styles/events.module.css';
import Loading from '../../component/Loading';

export default function EventsPage() {
  const { data: events } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: EventFactoryABI,
    functionName: 'getEvents',
  }) as { data?: `0x${string}`[] };

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [maxTickets, setMaxTickets] = useState(100);
  const [basePrice, setBasePrice] = useState('0.05');
  const [dynamicPricing, setDynamicPricing] = useState(true);
  const [priceIncrement, setPriceIncrement] = useState('0.01');

  const { writeContractAsync: createEvent, isPending: creating } = useWriteContract();

  async function handleCreateEvent() {
    try {
      await createEvent({
        address: FACTORY_ADDRESS,
        abi: EventFactoryABI,
        functionName: 'createEvent',
        args: [
          name,
          symbol,
          BigInt(maxTickets),
          parseEther(basePrice),
          dynamicPricing,
          parseEther(priceIncrement),
        ],
      });
      alert('Event created!');
      setName('');
      setSymbol('');
      setMaxTickets(100);
      setBasePrice('0.05');
      setDynamicPricing(true);
      setPriceIncrement('0.01');
    } catch (e: unknown) {
  if (e && typeof e === "object") {
    const shortMessage = "shortMessage" in e ? (e as { shortMessage: string }).shortMessage : undefined;
    const message = "message" in e ? (e as { message: string }).message : undefined;
    alert(shortMessage || message || "Error creating event.");
  } else {
    alert("Error creating event.");
  }
}
  }

  if (!events) return <Loading message="Loading..." />;

  return (
    <>
      <Header />
      <div className={styles.pageCenter}>
        <div className={styles.container}>
          <div className={styles.left}>
            <h2 className={styles.heading}>Sales</h2>
            {!events.length && <p>No sales available.</p>}
            {events.map((addr) => (
              <EventCard key={addr} address={addr} />
            ))}
          </div>
          
          <div className={styles.right}>
            <h2 className={styles.heading}>Create Sale</h2>
            <div className={styles.formGroup}>
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Symbol</label>
              <input value={symbol} onChange={(e) => setSymbol(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Max Sales</label>
              <input
                type="number"
                value={maxTickets}
                onChange={(e) => setMaxTickets(+e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Base Price (ETH)</label>
              <input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
            </div>
            <div className={`${styles.formGroup} ${styles.checkboxGroup}`}>
              <input
                type="checkbox"
                checked={dynamicPricing}
                onChange={(e) => setDynamicPricing(e.target.checked)}
              />
              <label>Dynamic Pricing</label>
            </div>
            <div className={styles.formGroup}>
              <label>Price Increment (ETH)</label>
              <input value={priceIncrement} onChange={(e) => setPriceIncrement(e.target.value)} />
            </div>
            <button onClick={handleCreateEvent} disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function EventCard({ address }: { address: `0x${string}` }) {
  const { data: name } = useReadContract({ address, abi: EventTicketABI, functionName: 'name' });
  const { data: symbol } = useReadContract({ address, abi: EventTicketABI, functionName: 'symbol' });
  const { data: maxTickets } = useReadContract({ address, abi: EventTicketABI, functionName: 'maxTickets' });
  const { data: ticketsSold } = useReadContract({ address, abi: EventTicketABI, functionName: 'ticketsSold' });
  const { data: currentPrice } = useReadContract({ address, abi: EventTicketABI, functionName: 'getCurrentPrice' });
const publicClient = usePublicClient() as unknown as PublicClient;

  const { writeContractAsync } = useWriteContract();
  const [buying, setBuying] = useState(false);

  async function buy() {
    if (!currentPrice) return;

    try {
      setBuying(true);
      const tx = await writeContractAsync({
        address,
        abi: EventTicketABI,
        functionName: 'buyTicket',
        args: [],
        value: currentPrice as bigint,
      });
      
      await publicClient.waitForTransactionReceipt({ hash: tx });

      alert('Ticket acheté !');
    } catch (e: unknown) {
      if (e && typeof e === 'object') {
    type PossibleError = { message?: string; shortMessage?: string };
    const err = e as PossibleError;
    const msg = err.shortMessage ?? err.message ?? "Erreur lors de l'achat";
    alert(msg);
  } else {
    alert("Erreur lors de l'achat");
  }
    } finally {
      setBuying(false);
    }
  }

  if (!name || !symbol) return <Loading message="Chargement..." />;

  return (
    <div className={styles.card}>
      <b>{String(name)} ({String(symbol)})</b>
      <div className={styles.small}>
        Sold: {String(ticketsSold)} / {String(maxTickets)}
      </div>
      <div className={styles.row} style={{ justifyContent: 'space-between' }}>
        <div>Current Price: {currentPrice ? `${formatEther(currentPrice as bigint)} ETH` : '...'}</div>
        <button onClick={buy} disabled={!currentPrice || buying}>
          {buying ? 'Buying...' : 'Buy'}
        </button>
      </div>
    </div>
  );
}
