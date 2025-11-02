// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/DecentralizedIssueTracker.sol";

contract DeployDecentralizedIssueTracker is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address aiAgent = 0x000000000000000000000000000000000000dEaD;

        vm.startBroadcast(deployerPrivateKey);

        DecentralizedIssueTracker tracker = new DecentralizedIssueTracker(aiAgent);

        console.log("DecentralizedIssueTracker deployed at:", address(tracker));

        vm.stopBroadcast();
    }
}
