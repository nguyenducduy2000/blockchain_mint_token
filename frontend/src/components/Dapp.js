import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import MyTokenArtifact from "../contracts/MyToken.json";
import MyNFTArtifact from "../contracts/MyNFT.json";
import DepositContractArtifact from "../contracts/DepositContract.json";
import contractAddress from "../contracts/contract-address.json";
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
// const HARDHAT_NETWORK_ID = "31337";
// const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export const Dapp = () => {
    const [network, setNetWork] = useState(null);
    const [error, setError] = useState(null);
    const [signer, setSigner] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [myTokenBalance, setMyTokenBalance] = useState(0);
    const [myNFTBalance, setMyNFTBalance] = useState(0);
    const [depositBalance, setDepositBalance] = useState(0);
    const [totalDepositsBalance, setTotalDepositBalance] = useState(0);
    const [provider, setProvider] = useState(null);
    const [txnBeingSent, setTxnBeingSent] = useState(null);

    const MyTokenAddress = contractAddress.MyToken;
    const MyNFTAddress = contractAddress.MyNFT;
    const DepositContractAddress = contractAddress.DepositContract;

    useEffect(() => {
        const init = async () => {
            if (!window.ethereum) {
                setError(
                    "Metamask is not installed. Please install it to use this app!"
                );
                return;
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(provider);

            try {
                await window.ethereum.request({
                    method: "eth_requestAccounts",
                });

                const network = await provider.getNetwork();
                setNetWork(network);

                if (network.chainId !== 97) {
                    // Adjust this to the desired network ID
                    setError("Please switch to the BSC testnet network!");
                    return;
                }

                const signer = provider.getSigner();
                setSigner(signer);
                const address = await signer.getAddress();
                setSelectedAddress(address);
            } catch (error) {
                console.error(error);
                setError("An error occurred while connecting to MetaMask");
            }
        };
        init();
    }, []);

    const getMyTokenBalance = async () => {
        const erc20Contract = new ethers.Contract(
            MyTokenAddress,
            MyTokenArtifact.abi,
            signer
        );
        const balance = await erc20Contract.balanceOf(selectedAddress);
        setMyTokenBalance(ethers.utils.formatUnits(balance, 18));
    };

    const getMyNFTBalance = async () => {
        const erc721Contract = new ethers.Contract(
            MyNFTAddress,
            MyNFTArtifact.abi,
            signer
        );
        const balance = await erc721Contract.balanceOf(selectedAddress);
        setMyNFTBalance(balance.toString());
    };

    const getDepositBalance = async () => {
        const depositContract = new ethers.Contract(
            DepositContractAddress,
            DepositContractArtifact.abi,
            signer
        );
        const balance = await depositContract.deposits(selectedAddress);
        const totalBalance = await depositContract.totalDeposits(
            selectedAddress
        );
        setDepositBalance(ethers.utils.formatUnits(balance, 18));
        setTotalDepositBalance(ethers.utils.formatUnits(totalBalance, 18));
    };
    const mintMyToken = async () => {
        try {
            const myTokenContract = new ethers.Contract(
                MyTokenAddress,
                MyTokenArtifact.abi,
                signer
            );
            const mintTxn = await myTokenContract.mint(
                selectedAddress,
                ethers.utils.parseUnits("10000", 18),
                {
                    gasLimit: 5000000,
                }
            );
            setTxnBeingSent(mintTxn.hash);
            await mintTxn.wait();
            await getMyTokenBalance();
        } catch (error) {
            console.error(error);
            setError(error.message);
            throw error;
        }
    };

    const depositMyToken = async (amount) => {
        try {
            const depositContract = new ethers.Contract(
                DepositContractAddress,
                DepositContractArtifact.abi,
                signer
            );

            const erc20Contract = new ethers.Contract(
                MyTokenAddress,
                MyTokenArtifact.abi,
                signer
            );

            const amountInWei = ethers.utils.parseUnits(amount, 18);

            // Check if the contract has already been approved for the given amount
            const allowance = await erc20Contract.allowance(
                selectedAddress,
                DepositContractAddress
            );

            if (allowance.lt(amountInWei)) {
                // Approve the deposit contract to spend MyToken
                const approveTxn = await erc20Contract.approve(
                    DepositContractAddress,
                    amountInWei
                );
                setTxnBeingSent(approveTxn.hash);
                await approveTxn.wait();
            }

            // Deposit the tokens
            const depositTxn = await depositContract.deposit(amountInWei, {
                gasLimit: 5000000,
            });
            setTxnBeingSent(depositTxn.hash);
            await depositTxn.wait();

            // Update balances
            await getMyTokenBalance();
            await getDepositBalance();
            await getMyNFTBalance();
        } catch (error) {
            console.error(error);
            setError(error.message);
            throw error;
        }
    };

    useEffect(() => {
        if (selectedAddress) {
            getMyTokenBalance();
            getMyNFTBalance();
            getDepositBalance();
        }
    }, [selectedAddress]);

    if (!provider) {
        return <NoWalletDetected />;
    }

    if (error) {
        return <div>{error}</div>;
    }

    // if (!selectedAddress) {
    //     return <ConnectWallet />;
    // }

    return (
        <div>
            <h1>Hello, {selectedAddress || "Connecting..."}</h1>
            <h2>
                Your MyToken Balance:{" "}
                {myTokenBalance !== null
                    ? `${myTokenBalance} MyToken`
                    : "Loading..."}
            </h2>
            <h2>
                Your Total Deposit Balance:{" "}
                {totalDepositsBalance !== null
                    ? `${totalDepositsBalance} ETH`
                    : "Loading..."}
            </h2>
            <h2>
                Your Deposit Balance:{" "}
                {depositBalance !== null
                    ? `${depositBalance} ETH`
                    : "Loading..."}
            </h2>
            <h2>
                Your ERC721 Balance:{" "}
                {myNFTBalance !== null ? myNFTBalance : "Loading..."}
            </h2>
            <div>
                <button onClick={mintMyToken}>Mint MyToken</button>
                <button onClick={() => depositMyToken("5000")}>
                    Deposit MyToken
                </button>
                {txnBeingSent && <p>Transaction Hash: {txnBeingSent}</p>}
            </div>
        </div>
    );
};
