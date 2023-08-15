import { useState,useEffect } from "react";
import useEth from "../contexts/EthContext/useEth";

function Contract({ setValue }) {
  const { state: { contract, accounts } } = useEth();

  console.log(accounts);
  // console.log(useEth())

  // Updated to manage three input states
  const [manufacturingProcess, setManufacturingProcess] = useState("");
  const [transportationHistory, setTransportationHistory] = useState("");
  const [storageLocations, setStorageLocations] = useState("");
  const [fetchedProducts, setFetchedProducts] = useState([]);

  // Handle change for each input
  const handleProcessChange = e => setManufacturingProcess(e.target.value);
  const handleHistoryChange = e => setTransportationHistory(e.target.value);
  const handleLocationChange = e => setStorageLocations(e.target.value);

  const createProduct = async () => {
    if (!manufacturingProcess || !transportationHistory || !storageLocations) {
      alert("Please enter values for all fields.");
      return;
    }
    
    await contract.methods.createProduct(
      manufacturingProcess,
      transportationHistory,
      storageLocations
    ).send({ from: accounts[0] });
  };
  const fetchProducts = async () => {
    const productCount = await contract.methods.productIdCounter().call();
    console.log(productCount)
    const products = [];
    for (let i = 0; i < productCount; i++) {
      const product = await contract.methods.products(i).call();
      products.push(product);
    }
    console.log(products)
    setFetchedProducts(products);
  };
  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-6 p-4">

  <div className="input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4">
    <h1 className="">Manufacturing Process:</h1>
    <input
      type="text"
      placeholder="Manufacturing Process"
      value={manufacturingProcess}
      onChange={handleProcessChange}
      className="flex-grow p-2 border rounded"
    />
  </div>

  <div className="input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4">
    <label className="block">Transportation History:</label>
    <input
      type="text"
      placeholder="Transportation History"
      value={transportationHistory}
      onChange={handleHistoryChange}
      className="flex-grow p-2 border rounded"
    />
  </div>

  <div className="input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4">
    <label className="block">Storage Locations:</label>
    <input
      type="text"
      placeholder="Storage Locations"
      value={storageLocations}
      onChange={handleLocationChange}
      className="flex-grow p-2 border rounded"
    />
  </div>

  <button onClick={createProduct} className="w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-300 p-2 rounded">
    Create Product  
  </button>

  <button onClick={fetchProducts} className="w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-300 p-2 rounded">
    Fetch Products
  </button>

  <div className="product-list w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3">
    {fetchedProducts.map((product, index) => (
      <div key={index} className="mb-6">
        <h3 className="mb-2">Product {index + 1}</h3>
        <p className="mb-1">Owner: {product.owner}</p>
        <p className="mb-1">Manufacturing Process: {product.manufacturingProcess}</p>
        <p className="mb-1">Transportation History: {product.transportationHistory}</p>
        <p className="mb-1">Storage Locations: {product.storageLocations}</p>
      </div>
    ))}
  </div>

</div>


  );
}

export default Contract;