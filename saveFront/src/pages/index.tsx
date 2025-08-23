import Header from "../component/Header";

export default function Home() {
  return (
    <>
      <Header />
      <div className="hero">
        <div className="logo-container">
          {/* Future logo goes here */}
          <img src="/logo.png" alt="ReselIT Logo" className="logo" />
        </div>
        <h1>ReselIT</h1>
        <p className="subtitle">
          Create events, buy and resell your tickets <b>decentrally</b> with dynamic pricing based on sales and purchases.
        </p>

        <div className="features">
          <div className="feature-card">
            <h3>Create</h3>
            <p>Create an ERC-721 NFT event with dynamic pricing according to sales and purchases.</p>
          </div>
          <div className="feature-card">
            <h3>Events</h3>
            <p>Browse events and buy tickets in the primary market.</p>
          </div>
          <div className="feature-card">
            <h3>Profile</h3>
            <p>Manage your tickets, approve them, and list them for resale easily.</p>
          </div>
          <div className="feature-card">
            <h3>Resale</h3>
            <p>Buy tickets listed by other users through the decentralized marketplace.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 4rem 2rem;
          background: linear-gradient(180deg, #1b1c26 0%, #111214 100%);
          min-height: calc(100vh - 60px);
          color: #fff;
        }

        .logo-container {
          margin-bottom: 2rem;
        }

        .logo {
          width: 120px;
          height: 120px;
          object-fit: contain;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6);
        }

        h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          font-size: 1.25rem;
          max-width: 600px;
          margin-bottom: 3rem;
          color: #c7d2fe;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 2rem;
          width: 100%;
          max-width: 1000px;
        }

        .feature-card {
          background: #222330;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 6px 18px rgba(0,0,0,0.5);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.6);
        }

        .feature-card h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #6366f1;
        }

        .feature-card p {
          font-size: 1rem;
          color: #c7d2fe;
        }

        @media (max-width: 768px) {
          h1 {
            font-size: 2.25rem;
          }
          .subtitle {
            font-size: 1rem;
          }
        }
      `}</style>
    </>
  );
}
