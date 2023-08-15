import { useState, useEffect } from 'react';
import useEth from '../contexts/EthContext/useEth';
import Barcode from 'react-barcode';
import QRCode from "react-qr-code";
function Home() {
  const {
    state: { contract, accounts },
  } = useEth();

  const [visibleDiv, setVisibleDiv] = useState('');
  const [isUserManager, setIsUserManager] = useState(null);
  const [hubHashSet, setHubHashSet] = useState('');
  const [hubHashSetName, setHubHashSetName] = useState('');
  const [buttonClicked, setButtonClicked] = useState(false);
  const [activeDiv, setActiveDiv] = useState(null);
  const [productName, setProductName] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [description, setDescription] = useState('');

  const [hubLocation, setHubLocation] = useState('');
  const [managerAddress, setManagerAddress] = useState('');
  const [capacity, setCapacity] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [hubHash, setHubHash] = useState('');
  const [barcodeImage, setBarcodeImage] = useState(null);

  const [productHash, setProductHash] = useState('');

  const [productHashHub, setProductHashHub] = useState('');

  const [productHashHubRemove, setProductHashHubRemove] = useState('');
  const [productNames, setProductNames] = useState([]);
  const [productHubNames, setProductHubNames] = useState([]);
  const [hubNames, sethubNames] = useState([]);

  const handleProductNameChange = (e) => setProductName(e.target.value);
  const handleOwnerAddressChange = (e) => setOwnerAddress(e.target.value);
  const handleShippingAddressChange = (e) => setShippingAddress(e.target.value);
  const handleDescriptionChange = (e) => setDescription(e.target.value);
  const handleProductHashChange = (e) => setProductHash(e.target.value);
  const handleProductHashHubChange = (e) => setProductHashHub(e.target.value);
  const handleProductHashHubRemoveChange = (e) =>
    setProductHashHubRemove(e.target.value);

  const handleHubLocationChange = (e) => setHubLocation(e.target.value);
  const handleManagerAddressChange = (e) => setManagerAddress(e.target.value);
  const handleCapacityChange = (e) => setCapacity(e.target.value);
  const handleContactDetailsChange = (e) => setContactDetails(e.target.value);
  const handleHubHashChange = (e) => setHubHash(e.target.value);
  const [product, setProduct] = useState(null);

  const [productDetails, setProductDetails] = useState(null);

  async function loginUser() {
    if (accounts.length === 0) return;
    // Ensure account is available
    setButtonClicked(true);
    try {
      const isManagerResult = await contract.methods
        .isManager(accounts[0])
        .call();
      setIsUserManager(isManagerResult);
      if (isManagerResult) {
        document.getElementById('Log_in_Button').innerHTML =
          'Logged in as manager';
        console.log('This account is a manager.');
        // Handle logic if the account is a manager
      } else {
        document.getElementById('Log_in_Button').innerHTML =
          'Logged in as User';
        console.log('This account is not a manager.');
        // Handle logic if the account is not a manager
      }
    } catch (error) {
      console.error('Error checking manager status:', error);
    }
  }

  useEffect(() => {
    if (!buttonClicked) return;
    if (accounts) {
      console.log('The accounts variable has changed:', accounts);
      loginUser();
      // Do something else if needed...
    }
  }, [accounts, buttonClicked]);

  useEffect(() => {
    getAllProducts();
  }, []);

  const createProduct = async () => {
    try {
      const response = await contract.methods
        .createProduct(productName, accounts[0], shippingAddress, description)
        .send({ from: accounts[0] });
      console.log(response);
      const productHash =
        response.events.ProductCreated.returnValues.productHash;

      window.alert('Item Order Placed. Product Id:' + productHash);
      // Maybe reset the state variables or handle UI updates
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  

  const createHub = async () => {
    try {
      const response = await contract.methods
        .createHub(hubLocation, accounts[0], capacity, contactDetails)
        .send({ from: accounts[0] });
      console.log(response);
      const hubHash = response.events.HubCreated.returnValues.hubHash;

      window.alert('Hub Created Successfully. Hub Id:' + hubHash);
      // Maybe reset the state variables or handle UI updates
    } catch (error) {
      console.error('Error creating hub:', error);
    }
  };

  const recieveProduct = async () => {
    try {
      const response = await contract.methods
        .assignProductToHub(productHashHub, hubHashSet)
        .send({
          from: accounts[0],
        });

      console.log('Product recieved');
    } catch (error) {
      console.error('Error recieving hub:', error);
    }
  };
  const sendProduct = async () => {
    try {
      await contract.methods.removeProductFromHub(productHashHubRemove).send({
        from: accounts[0],
      });

      console.log('Product Sent');
    } catch (error) {
      console.error('Error Sending hub:', error);
    }
  };

  const checkProductStatus = async () => {
    console.log('Hello');
    console.log(productHash);
    try {
      const prod = await contract.methods.products(productHash).call();

      setProduct(prod);

      const prodDetails = await contract.methods
        .getProductAndHubDetails(productHash)
        .call();

        prodDetails.hash=productHash
      setProductDetails(prodDetails);
      console.log(prodDetails);
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
    }
  };

  const checkProductStatusDirect = async (hash) => {
    console.log(hash);
    try {
      const prod = await contract.methods.products(hash).call();
      console.log(prod);

      setProduct(prod);

      const prodDetails = await contract.methods
        .getProductAndHubDetails(hash)
        .call();

      prodDetails.hash=hash

      console.log("Hello")
      console.log(prodDetails)

      
      setProductDetails(prodDetails);
      console.log(prodDetails);
    } catch (error) {
      console.error('Error fetching product:', error);
      setProduct(null);
    }
  };

  const getAllProducts = async () => {
    try {
      const productHashes = await contract.methods
        .getProductsByCustomer(accounts[0])
        .call();

      const productDetailsPromises = productHashes.map((hash) =>
        contract.methods.products(hash).call()
      );

      const allProducts = await Promise.all(productDetailsPromises);

      // Create an array of objects with name and hash values
      const productsWithHashes = allProducts.map((prod, index) => ({
        name: prod.name,
        hash: productHashes[index],
      }));

      setProductNames(productsWithHashes);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const getAllHubs = async () => {
    try {
      const hubHashes = await contract.methods
        .getHubsByManager(accounts[0])
        .call();

      const productDetailsPromises = hubHashes.map((hash) =>
        contract.methods.hubs(hash).call()
      );

      const allProducts = await Promise.all(productDetailsPromises);

      // Create an array of objects with name and hash values
      const productsWithHashes = allProducts.map((prod, index) => ({
        location: prod.location,
        hash: hubHashes[index],
      }));
      console.log(productsWithHashes)

      

      setProductHubNames(productsWithHashes);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const setHub = async () => {
    try {
      setHubHashSet(hubHash);
      const prod = await contract.methods.hubs(hubHash).call();
      console.log(prod);
      setHubHashSetName(prod.location);
    } catch (error) {
      console.error('Error Assigning hash product:', error);
      setHubHashSet('');
    }
  };

  const setHubDirect = async (hash) => {
    try {
      console.log("direct "+hash)
      setHubHashSet(hash);
      const prod = await contract.methods.hubs(hash).call();
      console.log(prod);
      setHubHashSetName(prod.location);

      window.alert('Connected to Hub Successfully');
    } catch (error) {
      console.error('Error Assigning hash product:', error);
      setHubHashSet('');
    }
  };

  const trackProducts = async () => {
    setActiveDiv('anotherDiv');
    getAllProducts();
  };
  const connectHubs = async () => {
    setVisibleDiv('div2');
    getAllHubs();
  };

  const disconnectHub = (async) => {
    try {
      setHubHashSet('');
    } catch (error) {
      console.error('Error Assigning hash product:', error);
    }
  };

  // Additional functions for assignProductToHub, removeProductFromHub, markProductAsDelivered and getHubHistory will follow a similar pattern.

  return (
    <div className='min-h-screen flex flex-col'>
      {/* Header */}
      <header className='bg-blue-500 p-4 flex justify-between items-center'>
        {/* Company Logo */}
        <img
          src='https://i5.walmartimages.com/dfw/63fd9f59-b3e1/7a569e53-f29a-4c3d-bfaf-6f7a158bfadd/v1/walmartLogo.svg'
          alt='Walmart Logo'
          className='h-10'
          style={{ maxWidth: '150px' }}
        />

        {/* Right-side Buttons */}
        <div className='flex space-x-4'>
          <button
            className='bg-white text-blue-500 px-4 py-2 rounded'
            id='Log_in_Button'
            onClick={loginUser}
          >
            Login
          </button>
          <button className='bg-white text-blue-500 px-4 py-2 rounded'>
            About Us
          </button>
        </div>
      </header>
      <div className='flex justify-center'>
        {hubHashSet && (
          <p className='mb-4 bg-green-500 hover:bg-green-600 active:bg-green-700 focus:outline-none focus:ring focus:ring-green-300 p-2 rounded'>
            Connected to {hubHashSetName} Hub
          </p>
        )}
      </div>

      <div className='flex justify-end'>
        {hubHashSet && (
          <button
            onClick={disconnectHub}
            className='mb-4 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-300 p-2 rounded'
          >
            Disconnect from Hub
          </button>
        )}
      </div>

      {/* Main Content */}
      {buttonClicked === false && (
        <main className='flex-grow flex items-center justify-center mt-72'>
          <h1 className='text-6xl font-bold text-blue-500'>
            Implementing Package Traceability using Blockchain
          </h1>
        </main>
      )}
      <div className='flex flex-col items-center justify-start h-screen space-y-6 p-4 mt-12'>
        {isUserManager === true && (
          <div className='manager-div space-y-4'>
            <button
              onClick={() => setVisibleDiv('addprod')}
              className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 ml-6'
            >
              Add New Hub
            </button>

            <button
              onClick={connectHubs}
              className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 ml-6'
            >
              Connect To Hub
            </button>

            <button
              onClick={() => setVisibleDiv('div3')}
              className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 ml-6'
            >
              Recieve Package
            </button>

            <button
              onClick={() => setVisibleDiv('div4')}
              className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 ml-6'
            >
              Send package
            </button>

            {visibleDiv === 'addprod' && (
              <div id='addprod' className='p-4 border bg-blue-100 rounded'>
                <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                  <h1 className='block'>Hub Location:</h1>
                  <input
                    type='text'
                    placeholder='Location'
                    value={hubLocation}
                    onChange={handleHubLocationChange}
                    className='flex-grow p-2 border rounded'
                  />
                </div>

                <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                  <label className='block'>Hub Capacity:</label>
                  <input
                    type='text'
                    placeholder='Capacity '
                    value={capacity}
                    onChange={handleCapacityChange}
                    className='flex-grow p-2 border rounded'
                  />
                </div>

                <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                  <label className='block'>Manager Contact:</label>
                  <input
                    type='text'
                    placeholder='Contact'
                    value={contactDetails}
                    onChange={handleContactDetailsChange}
                    className='flex-grow p-2 border rounded'
                  />
                </div>

                <button
                  onClick={createHub}
                  className='w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-300 p-2 rounded'
                >
                  Add Hub
                </button>
              </div>
            )}
            {visibleDiv === 'div2' && (
              <div id='div2' className='p-4 border bg-blue-100 rounded'>
                <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                  <label className='block'>Hub Hash:</label>
                  <input
                    type='text'
                    placeholder='Hash'
                    value={hubHash}
                    onChange={handleHubHashChange}
                    className='flex-grow p-2 border rounded'
                  />
                </div>

                <button
                  onClick={setHub}
                  className='w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-300 p-2 rounded mb-3'
                >
                  Connect to Hub
                </button>
                <hr className='bg-black h-1' />

                <div>
                  {productHubNames.map((product, index) => (
                    <button
                      key={index}
                      id={product.location}
                      onClick={()=>setHubDirect(product.hash)}
                      className='w-full bg-violet-500 hover:bg-violet-600 active:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-300 p-2 rounded mt-6'
                    >
                      {product.location}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {visibleDiv === 'div3' && (
              <div id='div3' className='p-4 border bg-blue-100 rounded'>
                <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                  <label className='block'>Product Hash:</label>
                  <input
                    type='text'
                    placeholder='Hash'
                    value={productHashHub}
                    onChange={handleProductHashHubChange}
                    className='flex-grow p-2 border rounded'
                  />
                </div>

                <button
                  onClick={recieveProduct}
                  className='w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-300 p-2 rounded'
                >
                  Recieve Product
                </button>
              </div>
            )}
            {visibleDiv === 'div4' && (
              <div id='div4' className='p-4 border bg-blue-100 rounded'>
                <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                  <label className='block'>Product Hash:</label>
                  <input
                    type='text'
                    placeholder='Hash'
                    value={productHashHubRemove}
                    onChange={handleProductHashHubRemoveChange}
                    className='flex-grow p-2 border rounded'
                  />
                </div>

                <button
                  onClick={sendProduct}
                  className='w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-300 p-2 rounded'
                >
                  Send Product
                </button>
              </div>
            )}
          </div>
        )}

        {isUserManager === false && (
          <div className='non-manager-div'>
            {/* user */}
            <button
              className='bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600'
              onClick={() => setActiveDiv('addprod')}
            >
              Add Product
            </button>
            <button
              className='bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600'
              onClick={trackProducts}
            >
              Track product
            </button>
            {activeDiv === 'addprod' && (
              <div id='addprod' className='border mt-4 p-4'>
                <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                  <h1 className='block'>Product Name:</h1>
                  <input
                    type='text'
                    placeholder='Product Name'
                    value={productName}
                    onChange={handleProductNameChange}
                    className='flex-grow p-2 border rounded'
                  />
                </div>

                <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                  <label className='block'>Shipping Address:</label>
                  <input
                    type='text'
                    placeholder='Shipping Address'
                    value={shippingAddress}
                    onChange={handleShippingAddressChange}
                    className='flex-grow p-2 border rounded'
                  />
                </div>

                <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                  <label className='block'>Item Description:</label>
                  <input
                    type='text'
                    placeholder='Item Description'
                    value={description}
                    onChange={handleDescriptionChange}
                    className='flex-grow p-2 border rounded'
                  />
                </div>

                <button
                  onClick={createProduct}
                  className='w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 bg-violet-500 hover:bg-violet-600 active:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-300 p-2 rounded'
                >
                  Create Product
                </button>
              </div>
            )}

            {activeDiv === 'anotherDiv' && (
              <div id='anotherDiv' className='border mt-4 p-4'>
                <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                  <div className='input-group flex flex-col space-y-2 items-start'>
                    <label className='block mr-20'>Enter Product Id:</label>
                    <input
                      type='text'
                      placeholder='Product Id'
                      value={productHash}
                      onChange={handleProductHashChange}
                      onLoad={getAllProducts}
                      className='flex-grow p-2 border rounded'
                    />
                  </div>
                </div>
                <button
                  onClick={checkProductStatus}
                  className='w-full bg-violet-500 hover:bg-violet-600 active:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-300 p-2 rounded mb-3'
                >
                  Check Product Status
                </button>
                <hr />
                <div>
                  {productNames.map((product, index) => (
                    <button
                      key={index}
                      id={product.name}
                      onClick={() => checkProductStatusDirect(product.hash)}
                      className='w-full bg-violet-500 hover:bg-violet-600 active:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-300 p-2 rounded mt-6'
                    >
                      {product.name}
                    </button>
                  ))}
                </div>
                <br></br>

                {/* {product && (
                  <div className='mt-4'>
                    <p>Name: {product.name}</p>
                    <p>Owner: {product.owner}</p>
                    <p>Shipping Address: {product.shippingAddress}</p>
                    <p>Description: {product.description}</p>
                    <p>
                      Product Status:{' '}
                      {product.state === '0'
                        ? 'In Process'
                        : product.state === '1'
                        ? 'On the Way'
                        : product.state === '2'
                        ? 'Delivered'
                        : 'Unknown'}
                    </p>
                  </div>
                )} */}

                {productDetails && (
                  <div className='mt-4'>
                    <p>Name: {product.name}</p>
                    <p>Owner: {product.owner}</p>
                    <p>Shipping Address: {product.shippingAddress}</p>
                    <p>Description: {product.description}</p>
                    <p>
                      Product Status:{' '}
                      {product.state === '0'
                        ? 'In Process'
                        : product.state === '1'
                        ? 'On the Way'
                        : product.state === '2'
                        ? 'Delivered'
                        : 'Unknown'}
                    </p>
                    <p>
                      Product Location History:{' '}
                      {productDetails.hubLocations.length > 0 ? productDetails.hubLocations.join('---->') + '--->' : 'Seller is packaging order'}
                    </p>
                    <p>Qr Code(will be scanned by the delivery personnel):</p>
                <br/>
                <QRCode value={productDetails.hash}/>
                  </div>
                )}
                
              </div>
            )}
          </div>
        )}

        {/* ... rest of your component remains unchanged ... */}
      </div>
      <div className='fixed-footer'>© 2023 Walmart. All Rights Reserved.</div>
    </div>
  );
}

export default Home;
