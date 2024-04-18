import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import BN from 'bn.js'; // Import the BN library
import './App.css';
import logo from './resized_hypra_logo.png';


// ABI for Wrapped HYP (wHYP) contract
const wHYPABI = [{"type":"event","name":"Approval","inputs":[{"type":"address","name":"from","internalType":"address","indexed":true},{"type":"address","name":"authorized","internalType":"address","indexed":true},{"type":"uint256","name":"amount","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"Deposit","inputs":[{"type":"address","name":"destination","internalType":"address","indexed":true},{"type":"uint256","name":"amount","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"Transfer","inputs":[{"type":"address","name":"from","internalType":"address","indexed":true},{"type":"address","name":"destination","internalType":"address","indexed":true},{"type":"uint256","name":"amount","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"Withdrawal","inputs":[{"type":"address","name":"from","internalType":"address","indexed":true},{"type":"uint256","name":"amount","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"fallback","stateMutability":"payable"},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"allowance","inputs":[{"type":"address","name":"","internalType":"address"},{"type":"address","name":"","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"approve","inputs":[{"type":"address","name":"from","internalType":"address"},{"type":"uint256","name":"amount","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"balanceOf","inputs":[{"type":"address","name":"","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint8","name":"","internalType":"uint8"}],"name":"decimals","inputs":[]},{"type":"function","stateMutability":"payable","outputs":[],"name":"deposit","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"string","name":"","internalType":"string"}],"name":"name","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"string","name":"","internalType":"string"}],"name":"symbol","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"totalSupply","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"transfer","inputs":[{"type":"address","name":"destination","internalType":"address"},{"type":"uint256","name":"amount","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"transferFrom","inputs":[{"type":"address","name":"from","internalType":"address"},{"type":"address","name":"destination","internalType":"address"},{"type":"uint256","name":"amount","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"withdraw","inputs":[{"type":"uint256","name":"amount","internalType":"uint256"}]},{"type":"receive","stateMutability":"payable"}];
const wHYPContractAddress = '0x0000000000079c645A9bDE0Bd8Af1775FAF5598A'; // wHYP contract address

function App() {
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('');
  const [message, setMessage] = useState('');
  const web3 = new Web3(window.ethereum);
  const [wHYPContract, setwHYPContract] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const contractInstance = new web3.eth.Contract(wHYPABI, wHYPContractAddress);
      setwHYPContract(contractInstance);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // The dependency array is intentionally left empty
  

  async function switchToHypraMainnet() {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: Web3.utils.toHex(622277),
          chainName: 'Hypra Mainnet',
          nativeCurrency: {
            name: 'HYP',
            symbol: 'HYP', // 2-6 characters long
            decimals: 18,
          },
          rpcUrls: ['https://rpc.hypra.network/'],
          blockExplorerUrls: ['https://explorer.hypra.network/'],
        }],
      });
      setMessage('Switched to Hypra Mainnet successfully.');
    } catch (error) {
      console.error('Error switching to Hypra Mainnet:', error);
      setMessage('Error switching to Hypra Mainnet. Please try again or add it manually.');
    }
  }

  const connectWallet = async () => {
    try {
      await switchToHypraMainnet(); // Ensure we're on the Hypra network
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      setMessage("Wallet connected successfully.");
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      setMessage("Failed to connect wallet. Please try again.");
    }
  };

  const handleDeposit = async () => {
    await switchToHypraMainnet(); // Switch network first
    if (!amount || !web3 || !account) {
      setMessage("Please ensure all fields are correctly filled and wallet is connected.");
      return;
    }

    const weiAmount = web3.utils.toWei(amount, 'ether');

    try {
      const balance = await web3.eth.getBalance(account);

      if (new BN(balance).lt(new BN(weiAmount))) {
        setMessage("Insufficient HYP balance.");
        return;
      }

      setMessage("Initiating wrap transaction, please confirm in MetaMask...");
      const gasPrice = await web3.eth.getGasPrice();

      await wHYPContract.methods.deposit().send({ from: account, value: weiAmount, gasPrice });
      setMessage('Wrap successful! Please allow a few moments for the balance to update.');
    } catch (error) {
      console.error('Error wrapping:', error);
      setMessage(`Wrap failed: ${error.message}`);
    }
  };

  const handleWithdraw = async () => {
    await switchToHypraMainnet(); // Switch network first
    if (!amount || !web3 || !wHYPContract || !account) {
      setMessage("Web3 or contract not initialized, or no account connected.");
      return;
    }

    const weiAmount = web3.utils.toWei(amount, 'ether');
    try {
      const wHYPBalance = await wHYPContract.methods.balanceOf(account).call();

      if (new BN(wHYPBalance).lt(new BN(weiAmount))) {
        setMessage("Insufficient wHYP balance.");
        return;
      }

      setMessage("Initiating unwrap transaction, please confirm in MetaMask...");
      const gasPrice = await web3.eth.getGasPrice();
      await wHYPContract.methods.withdraw(weiAmount).send({ from: account, gasPrice });
      setMessage('Unwrap successful! Please allow a few moments for the balance to update.');
    } catch (error) {
      console.error('Error unwrapping:', error);
      setMessage(`Unwrap failed: ${error.message}`);
    }
  };

  const addwHYPToWallet = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20', // Must specify this for tokens
          options: {
            address: wHYPContractAddress, // The contract address for wHYP
            symbol: 'wHYP', // A string symbol of the token
            decimals: 18, // The number of decimals in the token
            image: '', // A string URL of the token logo
          },
        },
      });
      setMessage('wHYP added to wallet!');
    } catch (error) {
      console.error('Failed to add wHYP to wallet:', error);
      setMessage('Failed to add wHYP. Please try again.');
    }
  };
  

  return (
    <>
      <header className="app-header">
        <a href="https://www.hypra.network/" target="_blank" rel="noopener noreferrer">
          <img src={logo} alt="Hypra Logo" className="app-logo" />
        </a>
        {/* Other header content here if necessary */}
      </header>
      <div className="wrap-hyp-container" style={{ marginTop: "250px", textAlign: "center" }}>
        {!account ? (
          <button onClick={connectWallet} className="action-btn">Connect Wallet</button>
        ) : (
          <>
            <div className="account-display">Welcome, {account.substring(0, 6)}...{account.substring(account.length - 4)}</div>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount to wrap"
              className="input-field"
            />
            <div className="action-buttons">
              <button onClick={handleDeposit} className="action-btn">Wrap HYP</button>
              <button onClick={handleWithdraw} className="action-btn">Unwrap HYP</button>
              <button onClick={addwHYPToWallet} className="action-btn">Import wHYP to Wallet</button>
            </div>
            {message && <div className="message-box">{message}</div>}
          </>
        )}
      </div>
    </>
  );
   
}

export default App;
