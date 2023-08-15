// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract ManufacturingTraceability {
  address[] public managers;  // List of approved managers

    constructor() {
        managers = [0xb19C943a68466347A66bFa98D4eEEb4F334969a8];  // Replace with actual Ethereum addresses
    }
    // Enum for Product state
    enum ProductState {
        Processing,
        InTransit,
        Delivered
    }
    
    // Product Structure
    struct Product {
        string name;
        address owner;
        string shippingAddress;
        string description;
        bytes32 hubHash;  // current hub where the product is located
        ProductState state;
        bytes32[] hubHistory;  // History of hubs the product visited
    }
    
    // Hub Structure
    struct Hub {
        string location;
        address manager;
        uint256 capacity;
        string contactDetails;
    }
    function isManager(address _address) public view returns(bool) {
        for(uint i = 0; i < managers.length; i++) {
            if(managers[i] == _address) return true;
        }
        return false;
    }

    // Mapping to hold products and hubs
    mapping(address => bytes32[]) public customerToProducts;
    mapping(address => bytes32[]) public managerToHubs;
    mapping(bytes32 => Product) public products;
    mapping(bytes32 => Hub) public hubs;

    // Events
    event ProductCreated(bytes32 productHash);
    event HubCreated(bytes32 hubHash);
    event ProductAssignedToHub(bytes32 productHash, bytes32 hubHash);
    event ProductRemovedFromHub(bytes32 productHash, bytes32 oldHubHash);
    event ProductDelivered(bytes32 productHash);

    function createProduct(
        string memory _name,
        address _owner,
        string memory _shippingAddress,
        string memory _description
    ) external {
        bytes32 productHash = keccak256(abi.encodePacked(_name, _owner, _shippingAddress, _description, block.timestamp));
        products[productHash] = Product({
            name: _name,
            owner: _owner,
            shippingAddress: _shippingAddress,
            description: _description,
            hubHash: 0,
            state: ProductState.Processing,
            hubHistory: new bytes32[](0)
        });
        customerToProducts[_owner].push(productHash);
        emit ProductCreated(productHash);
    }
    function getProductsByCustomer(address _customer) external view returns(bytes32[] memory) {
    return customerToProducts[_customer];
}

    function getProductAndHubDetails(bytes32 _productHash) external view returns(
    string memory productName,
    address productOwner,
    string memory productShippingAddress,
    string memory productDescription,
    ProductState productStatus,
    string[] memory hubLocations
) {
    Product storage product = products[_productHash];
    
    // Get product details
    productName = product.name;
    productOwner = product.owner;
    productShippingAddress = product.shippingAddress;
    productDescription = product.description;
    productStatus = product.state;

    // Determine how many valid hub locations are there
    uint validHubCount = 0;
    for(uint i = 0; i < product.hubHistory.length; i++) {
        Hub storage hub = hubs[product.hubHistory[i]];
        if (bytes(hub.location).length != 0) { // Check if location is non-empty
            validHubCount++;
        }
    }

    hubLocations = new string[](validHubCount);
    uint counter = 0;
    for(uint i = 0; i < product.hubHistory.length; i++) {
        Hub storage hub = hubs[product.hubHistory[i]];
        if (bytes(hub.location).length != 0) { // Check if location is non-empty
            hubLocations[counter] = hub.location;
            counter++;
        }
    }
}

    function createHub(
        string memory _location,
        address _manager,
        uint256 _capacity,
        string memory _contactDetails
    ) external {
        bytes32 hubHash = keccak256(abi.encodePacked(_location, _manager, _capacity, _contactDetails, block.timestamp));
        require(msg.sender == _manager, "Only the declared manager can create the hub.");
        hubs[hubHash] = Hub({
            location: _location,
            manager: _manager,
            capacity: _capacity,
            contactDetails: _contactDetails
        });
        managerToHubs[_manager].push(hubHash);
        emit HubCreated(hubHash);
    }

    function assignProductToHub(bytes32 _productHash, bytes32 _hubHash) external {
        Product storage product = products[_productHash];
        Hub storage hub = hubs[_hubHash];
        
        require(product.hubHash == 0, "Product is already assigned to a hub.");
        require(hub.manager == msg.sender, "Only the hub manager can add products.");
        
        product.hubHash = _hubHash;
        product.state = ProductState.InTransit;
        product.hubHistory.push(_hubHash);
        emit ProductAssignedToHub(_productHash, _hubHash);
    }

    function removeProductFromHub(bytes32 _productHash) external {
        Product storage product = products[_productHash];
        Hub storage hub = hubs[product.hubHash];
        
        require(hub.manager == msg.sender, "Only the hub manager can remove products.");
        
        emit ProductRemovedFromHub(_productHash, product.hubHash);
        product.hubHash = 0;
    }

    function markProductAsDelivered(bytes32 _productHash) external {
        Product storage product = products[_productHash];
        require(product.owner == msg.sender, "Only the product owner can mark it as delivered.");

        product.state = ProductState.Delivered;
        emit ProductDelivered(_productHash);
    }

    function getHubHistory(bytes32 _productHash) external view returns(bytes32[] memory) {
        return products[_productHash].hubHistory;
    }

    function getHubsByManager(address _manager) external view returns(bytes32[] memory) {
        return managerToHubs[_manager];
    }

}
