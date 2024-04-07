// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract ManufacturingTraceability {

    mapping(address => string) public user_type;
    mapping(address=>bool) public user_exists;

    // Enum for Product state
    enum MedProductState {
        Producing,
        Produced,
        AddToContainer,
        RetailerProcessing,
        InTransit,
        Delivered
    }

    // Product Structure

    struct MedProduct {
        string name;
        address producer;
        address retailer;
        address enduser;
        string shippingAddress;
        string description;
        bytes32 hubHash; // current hub where the product is located
        MedProductState state;
        bytes32[] hubHistory;
        uint quantity;
        uint sno;
        uint price;
        bytes32[] retailerhashes;
    }


    struct RetailerProduct{
        string name;
        address producer;
        address retailer;
        address enduser;
        string shippingAddress;
        string description;// current hub where the product is located
        MedProductState state;
        uint quantity;
        uint price;
        bytes32 containerHash;
    }
    struct UserProduct{
        string name;
        address producer;
        address retailer;
        address enduser;
        string shippingAddress;
        string description;// current hub where the product is located
        MedProductState state;
        uint sno;
        uint price;
        bytes32 packageHash;
        bytes32 containerHash;
    }

    struct UserCart{
        string name;
        address producer;
        address retailer;
        address enduser;
        string shippingAddress;
        string description;// current hub where the product is located
        MedProductState state;
        uint quantity;
        uint price;

    }

    // Hub Structure
    struct Hub {
        string location;
        address manager;
        uint256 capacity;
        string contactDetails;
    }



    function isRegistered(address _address) public view returns (string memory) {
        if (user_exists[_address]==true){
            return user_type[_address];
        }
        return "Not Found" ;
    }

    // Mapping to hold products and hubs
    mapping(address => bytes32[]) public producerToProducts;
    mapping(bytes32 => MedProduct) public medproducts;

    mapping(address=>bytes32[]) public producerOrders;
    mapping(address=>bytes32[]) public retailerOrders;
    mapping(bytes32 =>RetailerProduct) public retailerProducts;
    mapping(bytes32 =>mapping( address=> RetailerProduct) ) public retailerProductNew;
    mapping(bytes32 => bytes32[]) public prodToRetailers;
    mapping(bytes32=>bytes32[]) public containers;

    mapping(address => bytes32[]) public userProducts;
    mapping(bytes32 => UserProduct) public userProductCart;

    bytes32[] public allproducts;


    // Events
    event MedProductCreated(bytes32 medproductHash);
    event ProductProduced(bytes32 productHash);
    event UserRegistered(address acchash);
    event ProductDelivered(bytes32 productHash);
    event ProductBought(bytes32 productHash);
    event OrderPlaces(bytes32 productHash);
    event OrderListed(bytes32 productHash);
    event OrderSent(bytes32 productHash);

    function calculateMerkleRoot(bytes32[] memory hashes) internal pure returns (bytes32) {
        uint length = hashes.length;
        require(length > 0, "Empty hash list");

        if (length == 1) {
            return hashes[0];
        }

        bytes32[] memory tempHashes = hashes;
        
        // Calculate the Merkle root iteratively
        while (length > 1) {
            uint newLength = (length + 1) / 2;
            for (uint i = 0; i < newLength; i++) {
                uint j = 2 * i;
                if (j < length - 1) {
                    tempHashes[i] = keccak256(abi.encodePacked(tempHashes[j], tempHashes[j + 1]));
                } else {
                    tempHashes[i] = keccak256(abi.encodePacked(tempHashes[j]));
                }
            }
            length = newLength;
        }

        return tempHashes[0];
    }

    function registerUser(address account,string memory u_type) external {
        user_type[account]=u_type;
        user_exists[account]=true;
        emit UserRegistered(account);
    }
    function createMedProduct(
        string memory _name,
        address _owner,
        string memory _description,
        uint _quantity,
        uint _price
    ) external {
        bytes32 productHash = keccak256(
            abi.encodePacked(
                _name,
                _owner,
                _description,
                _quantity,
                _price,
                block.timestamp
            )
        );
        medproducts[productHash] = MedProduct({
            name: _name,
            producer: _owner,
            retailer: 0x0000000000000000000000000000000000000000,
            enduser: 0x0000000000000000000000000000000000000000,
            shippingAddress:"",
            description:_description,
            hubHash: 0,
            state: MedProductState.Producing,
            hubHistory: new bytes32[](0),
            quantity:_quantity,
            sno:0,
            price:_price,
            retailerhashes:new bytes32[](0)
        });
        allproducts.push(productHash);
        producerToProducts[_owner].push(productHash);
        emit MedProductCreated(productHash);
    }

    function getProductsByProducer(
        address _producer
    ) external view returns (bytes32[] memory) {
        return producerToProducts[_producer];
    }

    function ProduceProduct(bytes32 _producthash) external {
        medproducts[_producthash].state=MedProductState.Produced;
        emit ProductProduced(_producthash);
    }
    function getProductByHash(bytes32 _producthash) external view returns(MedProduct memory) {
        return medproducts[_producthash];
    }
    function viewProductsAvailable() external view returns(bytes32[] memory){
        return allproducts;

    }

    function placeOrder(bytes32 _prodHash,address _retaileraddress,uint _units)external {
        bytes32 retproductHash = keccak256(
            abi.encodePacked(
                medproducts[_prodHash].name,
                medproducts[_prodHash].producer,
                medproducts[_prodHash].description,
                _units,
                medproducts[_prodHash].price,
                block.timestamp
            )
        );
        medproducts[_prodHash].sno=medproducts[_prodHash].sno+_units;
        medproducts[_prodHash].retailerhashes.push(retproductHash);
        retailerProducts[retproductHash] = RetailerProduct({
            name: medproducts[_prodHash].name,
            producer: medproducts[_prodHash].producer,
            retailer: _retaileraddress,
            enduser: 0x0000000000000000000000000000000000000000,
            shippingAddress:"",
            description:medproducts[_prodHash].description,
            state: MedProductState.Produced,
            quantity:_units,
            price:medproducts[_prodHash].price/medproducts[_prodHash].quantity,
            containerHash:bytes32(0)
        }); 
        retailerOrders[_retaileraddress].push(retproductHash);
        producerOrders[medproducts[_prodHash].producer].push(retproductHash);
        prodToRetailers[_prodHash].push(retproductHash);
        emit OrderPlaces(retproductHash);
  


   
    }
    function getRetailerOrders(address _retaileraddress) external view returns (bytes32[] memory) {
        return retailerOrders[_retaileraddress];
    }
    function getRetailerOrdersByHash(bytes32 _retailerproducthash) external view returns(RetailerProduct memory) {
        return retailerProducts[_retailerproducthash];
    }
    function getOrdersByProducer(address _produceraddress) external view returns(bytes32[] memory) {
        return producerOrders[_produceraddress];
    }

    function sendorder(bytes32 _retailerproducthash) external {
        retailerProducts[_retailerproducthash].state=MedProductState.AddToContainer;
        uint _units=retailerProducts[_retailerproducthash].quantity;
        bytes32[] memory packageHashes=new bytes32[](_units);
        for(uint i=0;i<retailerProducts[_retailerproducthash].quantity;i++){
            bytes32 packageHash = keccak256(
                abi.encodePacked(
                    retailerProducts[_retailerproducthash].name,
                    retailerProducts[_retailerproducthash].producer,
                    retailerProducts[_retailerproducthash].description,
                    retailerProducts[_retailerproducthash].price,
                    i,
                    block.timestamp
                )
            );
            packageHashes[i]=packageHash;
        }
        
        // packageHases will be sent to convert into mrkle root and stored in cantainers
        bytes32 merkleRoot = calculateMerkleRoot(packageHashes);
        containers[merkleRoot]=packageHashes;

        retailerProducts[_retailerproducthash].containerHash=merkleRoot;
        
        emit OrderSent(_retailerproducthash);
    }
    function listOrder(bytes32 _prodHash,uint price)external {
        
        retailerProducts[_prodHash].price=price;
        emit OrderListed(_prodHash);
   
    }

    function recieveOrder(bytes32 _retailerproducthash) external {
        retailerProducts[_retailerproducthash].state=MedProductState.RetailerProcessing;
    }

    function getAllRetailers(bytes32 _producthash) external view returns(RetailerProduct[] memory){
        bytes32[] memory retailerHashes=prodToRetailers[_producthash];
        RetailerProduct[] memory retailers=new RetailerProduct[](retailerHashes.length);
        for(uint i=0;i<retailerHashes.length;i++){
            retailers[i]=retailerProducts[retailerHashes[i]];
        }
        return retailers;
    }

    function buyProduct(bytes32 _retailerproducthash,address _enduser,string memory _shippingAddress,uint _units) external {
        // retailerProducts[_retailerproducthash].state=MedProductState.InTransit;
        retailerProducts[_retailerproducthash].enduser=_enduser;
        retailerProducts[_retailerproducthash].shippingAddress=_shippingAddress;
        retailerProducts[_retailerproducthash].quantity=retailerProducts[_retailerproducthash].quantity-_units;
        bytes32 packagehash = keccak256(
                abi.encodePacked(
                    retailerProducts[_retailerproducthash].name,
                    retailerProducts[_retailerproducthash].producer,
                    retailerProducts[_retailerproducthash].description,
                    retailerProducts[_retailerproducthash].price,
                    _units,
                    _shippingAddress,
                    _enduser,
                    block.timestamp
                )
            );

        userProductCart[packagehash]=UserProduct({
            name:retailerProducts[_retailerproducthash].name,
            producer:retailerProducts[_retailerproducthash].producer,
            retailer:retailerProducts[_retailerproducthash].retailer,
            enduser:_enduser,
            shippingAddress:_shippingAddress,
            description:retailerProducts[_retailerproducthash].description,
            state:MedProductState.RetailerProcessing,
            sno:_units,
            price:retailerProducts[_retailerproducthash].price,
            packageHash:packagehash,
            containerHash:retailerProducts[_retailerproducthash].containerHash
        });
        userProducts[_enduser].push(packagehash);
        emit ProductBought(_retailerproducthash);
    }
    function retailerShipProduct(bytes32 _retailerproducthash,bytes32 _producthash) external {
        retailerProducts[_retailerproducthash].state=MedProductState.InTransit;
        userProductCart[_producthash].state=MedProductState.InTransit;
    }

    function retailerDeliverProduct(bytes32 _retailerproducthash,bytes32 _packagehash) external {
        retailerProducts[_retailerproducthash].state=MedProductState.Delivered;
        userProductCart[_packagehash].state=MedProductState.Delivered;
        emit ProductDelivered(_retailerproducthash);
    }

    function getUserProducts(address _enduser) external view returns(bytes32[] memory){
        return userProducts[_enduser];
    }

    function getUserProductByHash(bytes32 _packagehash) external view returns(UserProduct memory){
        return userProductCart[_packagehash];
    }



































































































































    function sendOrder(bytes32 _retailerproducthash) external {
        retailerProducts[_retailerproducthash].state=MedProductState.AddToContainer;
        bytes32 packageHash = keccak256(
                abi.encodePacked(
                    retailerProducts[_retailerproducthash].name,
                    retailerProducts[_retailerproducthash].producer,
                    retailerProducts[_retailerproducthash].description,
                    retailerProducts[_retailerproducthash].price,
                    block.timestamp
                )
            );
        // packageHases will be sent to convert into mrkle root and stored in cantainers
        bytes32 merkleRoot = keccak256(abi.encodePacked(packageHash));
        containers[merkleRoot]=[packageHash];
        
        retailerProducts[_retailerproducthash].containerHash=merkleRoot;
        
        emit OrderSent(_retailerproducthash);
    }
}
