// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UsernameRegistry
 * @dev Smart contract for mapping usernames to wallet addresses
 */
contract UsernameRegistry {
    // Mapping from username to wallet address
    mapping(string => address) private usernameToAddress;
    
    // Mapping from address to username
    mapping(address => string) private addressToUsername;
    
    // Events
    event UsernameRegistered(string username, address indexed wallet);
    event UsernameUpdated(string username, address indexed oldWallet, address indexed newWallet);
    event UsernameRemoved(string username, address indexed wallet);
    
    /**
     * @dev Register a new username
     * @param username The username to register
     */
    function registerUsername(string memory username) public {
        require(bytes(username).length > 0, "Username cannot be empty");
        require(usernameToAddress[username] == address(0), "Username already registered");
        require(bytes(addressToUsername[msg.sender]).length == 0, "Address already has a username");
        
        usernameToAddress[username] = msg.sender;
        addressToUsername[msg.sender] = username;
        
        emit UsernameRegistered(username, msg.sender);
    }
    
    /**
     * @dev Update the address for a username
     * @param username The username to update
     * @param newAddress The new address to map to the username
     */
    function updateUsernameAddress(string memory username, address newAddress) public {
        require(usernameToAddress[username] == msg.sender, "Not authorized to update this username");
        require(newAddress != address(0), "Cannot set to zero address");
        require(bytes(addressToUsername[newAddress]).length == 0, "New address already has a username");
        
        address oldAddress = usernameToAddress[username];
        
        // Update mappings
        delete addressToUsername[oldAddress];
        usernameToAddress[username] = newAddress;
        addressToUsername[newAddress] = username;
        
        emit UsernameUpdated(username, oldAddress, newAddress);
    }
    
    /**
     * @dev Remove a username
     * @param username The username to remove
     */
    function removeUsername(string memory username) public {
        require(usernameToAddress[username] == msg.sender, "Not authorized to remove this username");
        
        address wallet = usernameToAddress[username];
        
        // Remove from mappings
        delete usernameToAddress[username];
        delete addressToUsername[wallet];
        
        emit UsernameRemoved(username, wallet);
    }
    
    /**
     * @dev Get the address for a username
     * @param username The username to look up
     * @return The wallet address associated with the username
     */
    function getAddressByUsername(string memory username) public view returns (address) {
        return usernameToAddress[username];
    }
    
    /**
     * @dev Get the username for an address
     * @param wallet The wallet address to look up
     * @return The username associated with the address
     */
    function getUsernameByAddress(address wallet) public view returns (string memory) {
        return addressToUsername[wallet];
    }
    
    /**
     * @dev Check if a username is registered
     * @param username The username to check
     * @return True if the username is registered, false otherwise
     */
    function isUsernameRegistered(string memory username) public view returns (bool) {
        return usernameToAddress[username] != address(0);
    }
}
