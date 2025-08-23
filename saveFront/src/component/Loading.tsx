import React from "react";
import styles from "../styles/Loading.module.css";

const Loading: React.FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.spinner}></div>
      <p className={styles.message}>{message}</p>
    </div>
  );
};

export default Loading;
