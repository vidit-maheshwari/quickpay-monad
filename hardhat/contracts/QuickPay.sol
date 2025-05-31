// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./UsernameRegistry.sol";

/**
 * @title QuickPay
 * @dev Smart contract for handling cryptocurrency payments using usernames
 */
contract QuickPay {
    // Reference to the UsernameRegistry contract
    UsernameRegistry private usernameRegistry;
    
    // Events
    event PaymentSent(address indexed from, address indexed to, uint256 amount, string message);
    event PaymentFailed(address indexed from, string toUsername, uint256 amount, string reason);
    
    /**
     * @dev Constructor sets the address of the UsernameRegistry contract
     * @param _registryAddress The address of the UsernameRegistry contract
     */
    constructor(address _registryAddress) {
        require(_registryAddress != address(0), "Invalid registry address");
        usernameRegistry = UsernameRegistry(_registryAddress);
    }
    
    /**
     * @dev Send payment to a user by username
     * @param username The username of the recipient
     * @param message Optional message to include with the payment
     */
    function sendPaymentByUsername(string memory username, string memory message) public payable {
        require(msg.value > 0, "Payment amount must be greater than 0");
        
        // Get the recipient's address from the username registry
        address payable recipient = payable(usernameRegistry.getAddressByUsername(username));
        
        // Check if the username is registered
        require(recipient != address(0), "Username not registered");
        
        // Send the payment
        (bool success, ) = recipient.call{value: msg.value}("");
        
        if (success) {
            emit PaymentSent(msg.sender, recipient, msg.value, message);
        } else {
            emit PaymentFailed(msg.sender, username, msg.value, "Transfer failed");
            
            // Refund the sender
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value}("");
            require(refundSuccess, "Refund failed");
        }
    }
    
    /**
     * @dev Get the balance of the contract
     * @return The balance of the contract in wei
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Fallback function to receive Ether
     */
    receive() external payable {}
    
    /**
     * @dev Fallback function for when msg.data is not empty
     */
    fallback() external payable {}
}
