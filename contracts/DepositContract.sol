// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "contracts/MyNFT.sol";

contract DepositContract is Ownable {
    IERC20 public erc20Token;
    MyNFT public erc721Token;
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public totalDeposits;

    constructor(address _erc20Token, address _erc721Token) Ownable(msg.sender) {
        erc20Token = IERC20(_erc20Token);
        erc721Token = MyNFT(_erc721Token);
    }

    function viewAmmount() external view returns (uint256) {
        return erc20Token.totalSupply();
    }

    function deposit(uint256 amount) public {
        require(amount > 0, "Amount must be greater than zero");

        erc20Token.transferFrom(msg.sender, address(this), amount);
        totalDeposits[msg.sender] += amount;
        deposits[msg.sender] += amount;

        if (deposits[msg.sender] >= 10000 * 10**18) {
            erc721Token.mintNFT(msg.sender);
            deposits[msg.sender] = deposits[msg.sender] - 10000 * 10**18;  // Reset the deposit amount after minting
        }
    }
}
