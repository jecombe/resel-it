import Header from "../component/Header";
import styles from "../styles/Home.module.css";

export default function Home() {
  return (
    <>
      <Header />
      <div className={styles.hero}>
        <div className={styles.logoContainer}>
          <img src="/logo.png" alt="ReselIT Logo" className={styles.logo} />
        </div>
        <h1 className={styles.title}>ReselIT</h1>
        <p className={styles.subtitle}>
          Create events, buy and resell your tickets <b>decentrally</b> with dynamic pricing based on sales and purchases.
        </p>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <h3>Create</h3>
            <p>Create an ERC-721 NFT event with dynamic pricing according to sales and purchases.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Events</h3>
            <p>Browse events and buy tickets in the primary market.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Profile</h3>
            <p>Manage your tickets, approve them, and list them for resale easily.</p>
          </div>
          <div className={styles.featureCard}>
            <h3>Resale</h3>
            <p>Buy tickets listed by other users through the decentralized marketplace.</p>
          </div>
        </div>
      </div>
    </>
  );
}
