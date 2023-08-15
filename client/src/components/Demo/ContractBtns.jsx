import { useState,useEffect } from "react";
import useEth from "../../contexts/EthContext/useEth";

function ContractBtns({ setValue }) {
  const { state: { contract, accounts } } = useEth();
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
    <div className="btns">

      <div className="input-group">
        <label>Manufacturing Process:</label>
        <input
          type="text"
          placeholder="Manufacturing Process"
          value={manufacturingProcess}
          onChange={handleProcessChange}
        />
      </div>

      <div className="input-group">
        <label>Transportation History:</label>
        <input
          type="text"
          placeholder="Transportation History"
          value={transportationHistory}
          onChange={handleHistoryChange}
        />
      </div>

      <div className="input-group">
        <label>Storage Locations:</label>
        <input
          type="text"
          placeholder="Storage Locations"
          value={storageLocations}
          onChange={handleLocationChange}
        />
      </div>

      <button onClick={createProduct}>
        Create Product
      </button>

      <button onClick={fetchProducts}>
        Fetch Products
      </button>

      <div className="product-list">
        {fetchedProducts.map((product, index) => (
          <div key={index}>
            <h3>Product {index + 1}</h3>
            <p>Owner: {product.owner}</p>
            <p>Manufacturing Process: {product.manufacturingProcess}</p>
            <p>Transportation History: {product.transportationHistory}</p>
            <p>Storage Locations: {product.storageLocations}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

export default ContractBtns;