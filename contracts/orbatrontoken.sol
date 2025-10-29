
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20}  from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IUniswapV2Router02 {
    function factory() external view returns (address);
    function WETH() external view returns (address);
}
interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

contract OrbatronToken is ERC20, Ownable {
    // ---- Supply & launch window ----
    uint256 public constant TOTAL_SUPPLY   = 12_000_000_000 * 1e18; // 12,000,000,000 OTRON
    uint256 public constant LIMIT_WINDOW   = 15 minutes;            // first 15 minutes after open
    uint256 public constant MAX_WALLET_BPS = 100;                   // 1.00% of supply during window

    // ---- Branding / metadata (your IPFS CID) ----
    // Provided by you: bafkreig6kkjrgiqly2ob4j64635vmgskj2objk464lf6f5kzahtlfpgn6q
    string  public constant PROJECT_CID = "ipfs://bafkreig6kkjrgiqly2ob4j64635vmgskj2objk464lf6f5kzahtlfpgn6q";

    // ---- Uniswap V2 wiring ----
    IUniswapV2Router02 public uniswapV2Router;
    address public uniswapV2Pair;
    address public weth;

    bool   public routerSet;
    bool   public tradingOpen;
    uint40 public launchTime;

    event RouterSet(address indexed router, address indexed pair, address indexed weth);
    event TradingOpened(uint256 timestamp);

    constructor() ERC20("Orbatron", "OTRON") Ownable(msg.sender) {
        // Mint all supply to the deployer wallet (you)
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    /// @notice One-time router setup (call before opening trading)
    function setRouter(address router_) external onlyOwner {
        require(!routerSet, "Router already set");
        IUniswapV2Router02 r = IUniswapV2Router02(router_);

        address _weth   = r.WETH();
        address factory = r.factory();

        address pair = IUniswapV2Factory(factory).getPair(address(this), _weth);
        if (pair == address(0)) {
            pair = IUniswapV2Factory(factory).createPair(address(this), _weth);
        }

        uniswapV2Router = r;
        weth            = _weth;
        uniswapV2Pair   = pair;
        routerSet       = true;

        emit RouterSet(router_, pair, _weth);
    }

    /// @notice Open trading after router is set and liquidity is added
    function openTrading() external onlyOwner {
        require(routerSet, "Set router first");
        require(!tradingOpen, "Already open");
        tradingOpen = true;
        launchTime  = uint40(block.timestamp);
        emit TradingOpened(block.timestamp);
    }

    /// @dev Launch window guard: before open, only owner can move;
    ///      after open, for 15 minutes enforce 1% max wallet (no sell-blocks).
    function _update(address from, address to, uint256 value) internal override {
        bool isOwnerFlow = (from == owner() || to == owner());

        if (!tradingOpen) {
            // Allow mint/burn, and owner operations for setup; block others until open
            if (from != address(0) && !isOwnerFlow) revert("Trading not open");
        } else if (block.timestamp <= uint256(launchTime) + LIMIT_WINDOW) {
            // Enforce max wallet during the first 15 minutes (except owner/router/pair)
            if (to != address(0) && to != owner() && to != uniswapV2Pair && to != address(uniswapV2Router)) {
                uint256 maxWallet = (TOTAL_SUPPLY * MAX_WALLET_BPS) / 10_000; // 1%
                require(balanceOf(to) + value <= maxWallet, "Max wallet during window");
            }
        }

        super._update(from, to, value);
    }
}
