// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

const path = require("path");

async function main() {
    // This is just a convenience check
    if (network.name === "hardhat") {
        console.warn(
            "You are trying to deploy a contract to the Hardhat Network, which" +
                "gets automatically created and destroyed every time. Use the Hardhat" +
                " option '--network localhost'"
        );
    }

    // ethers is available in the global scope
    const [deployer] = await ethers.getSigners();
    console.log(
        "Deploying the contracts with the account:",
        await deployer.getAddress()
    );

    console.log("Account balance:", (await deployer.getBalance()).toString());

    // deploy MyToken
    const MyToken = await ethers.getContractFactory("MyToken");
    const myToken = await MyToken.deploy("MyToken", "MTK");
    await myToken.deployed();
    console.log("MyToken address:", myToken.address);

    // deploy MyNFT
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const myNFT = await MyNFT.deploy("MyNFT", "MNFT");
    await myNFT.deployed();
    console.log("MyNFT address:", myNFT.address);

    // deploy DepositContract
    const DepositContract = await ethers.getContractFactory("DepositContract");
    const depositContract = await DepositContract.deploy(
        myToken.address,
        myNFT.address
    );
    await depositContract.deployed();
    console.log("DepositContract address:", depositContract.address);

    // We also save the contract's artifacts and address in the frontend directory
    saveFrontendFiles({
        MyToken: myToken.address,
        MyNFT: myNFT.address,
        DepositContract: depositContract.address,
    });
}

function saveFrontendFiles(addresses) {
    const fs = require("fs");
    const contractsDir = path.join(
        __dirname,
        "..",
        "frontend",
        "src",
        "contracts"
    );

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir);
    }

    fs.writeFileSync(
        path.join(contractsDir, "contract-address.json"),
        JSON.stringify(addresses, undefined, 2)
    );

    myArtifact = ["MyToken", "MyNFT", "DepositContract"];

    myArtifact.forEach((artifact) => {
        const TokenArtifact = artifacts.readArtifactSync(artifact);
        fs.writeFileSync(
            path.join(contractsDir, `${artifact}.json`),
            JSON.stringify(TokenArtifact, null, 2)
        );
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
