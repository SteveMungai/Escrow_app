import { useState } from "react";
import axios from "axios";
import { getToken } from "../auth";
import Navbar from "../components/Navbar";
import './Dashboard'


const WalletTopUp = ({ isOpen, onClose, userId, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleTopUp = async () => {
    if (!amount || Number(amount) <= 0) {
      alert("Enter a valid amount");
      return;
    }

    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        alert("Your session has expired. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        "/api/wallet/topup",
        {
          user_id: userId,
          amount: Number(amount),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message);
      setAmount("");
  
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error.response?.data || error);
      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to top up wallet"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
         <Navbar active="dashboard" />
        <h2>Top up Wallet</h2>

        <p>Add funds securely to your wallet.</p>

        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={styles.input}
        />

        <div style={styles.buttons}>
          <button onClick={onClose} style={styles.cancelBtn}>
            Cancel
          </button>

          <button
            onClick={handleTopUp}
            style={styles.fundBtn}
            disabled={loading}
          >
            {loading ? "Processing..." : "Fund Wallet"}
          </button>
        </div>
      </div>
    </div>

  );
};



const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    width: "400px",
    background: "#0A3D78",
    color: "white",
    padding: "30px",
    borderRadius: "10px",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginTop: "15px",
    marginBottom: "20px",
    borderRadius: "5px",
    border: "none",
  },
  buttons: {
    display: "flex",
    justifyContent: "space-between",
  },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
  },
  fundBtn: {
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    background: "#FFFFFF",
    color: "#0A3D78",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default WalletTopUp;