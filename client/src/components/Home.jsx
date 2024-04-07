import { useState, useEffect } from 'react';
import useEth from '../contexts/EthContext/useEth';
import Barcode from 'react-barcode';
import QRCode from 'react-qr-code';
function Home() {
  const {
    state: { contract, accounts, web3 },
  } = useEth();

  const [isUserRegistered, setIsUserRegistered] = useState(null);
  const [isUserUser, setIsUserUser] = useState(null);
  const [isUserRetailer, setIsUserRetailer] = useState(null);
  const [isUserManufacturer, setIsUserManufacturer] = useState(null);
  const [isethSent, setIsEthSent] = useState(false);

  const [buttonClicked, setButtonClicked] = useState(false);
  const [activeDiv, setActiveDiv] = useState(null);
  const [viewProducts, setViewProducts] = useState(null);
  const [viewOrderProducts, setViewOrderProducts] = useState(null);
  const [viewAllProducts, setViewAllProducts] = useState(null);

  const [viewContainers, setViewContainers] = useState(null);
  const [viewProducerOrder, setViewProducerOrders] = useState(null);
  const [curIndex, setCurIndex] = useState(null);
  const [viewPlaceOrder, setViewPlaceOrder] = useState(null);
  const [productName, setProductName] = useState('');

  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [quantitySet, setQuantitySet] = useState('');
  const [pricePlaceholder, setPricePlaceholder] = useState('');

  const [barcodeImage, setBarcodeImage] = useState(null);

  const [productHash, setProductHash] = useState('');
  const [productDetails, setProductDetails] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  const [productNames, setProductNames] = useState([]);
  const [orderNames, setOrderNames] = useState([]);
  const [products, setProducts] = useState([]);

  const handleProductNameChange = (e) => setProductName(e.target.value);
  const handleDescriptionChange = (e) => setDescription(e.target.value);
  const handleQuantityChange = (e) => setQuantity(e.target.value);
  const handlePriceChange = (e) => setPrice(e.target.value);
  const handleProductHashChange = (e) => setProductHash(e.target.value);
  const newhandleQuantityChange = (event) => {
    var value = event.target.value;
    console.log(value);
    if (isNaN(value)) {
      value = '';
    } else if (
      parseInt(value) >
      productDetails[1].quantity - productDetails[1].sno
    ) {
      value = productDetails[1].quantity - productDetails[1].sno;
    } else if (value < 0) {
      value = 0;
    }
    setQuantitySet(value);
    setPricePlaceholder(
      value
        ? parseInt(value) *
            (productDetails[1].price / productDetails[1].quantity)
        : ''
    );
  };

  async function loginUser() {
    if (accounts.length === 0) return;
    // Ensure account is available
    setButtonClicked(true);
    try {
      const isUserRegistered = await contract.methods
        .isRegistered(accounts[0])
        .call();
      console.log('Registered ' + isUserRegistered);

      if (isUserRegistered === 'Not Found') {
        setIsUserRegistered(false);
        document.getElementById('Log_in_Button').innerHTML = 'Welcome';
        console.log('This account is not registered.');
        // Handle logic if the account is a manager
      } else {
        setIsUserRegistered(true);
        document.getElementById('Log_in_Button').innerHTML =
          'Logged in as ' + isUserRegistered;
        console.log('This account is a ' + isUserRegistered);
        if (isUserRegistered === 'User') {
          console.log('This is User');
          setIsUserUser(true);
          setIsUserManufacturer(false);
          setIsUserRetailer(false);
        } else if (isUserRegistered === 'Retailer') {
          console.log('This is Retailer');
          setIsUserUser(false);
          setIsUserManufacturer(false);
          setIsUserRetailer(true);
          setProductDetails(null);
          setViewOrderProducts(null);
          setOrderNames([]);
          setOrderDetails(null);
        } else {
          console.log('This is Manufacturer');
          setIsUserUser(false);
          setIsUserManufacturer(true);
          setIsUserRetailer(false);
          setViewAllProducts(false);
          setProductNames([]);
          setProductDetails(null);
          setViewProducts(false);
          setOrderNames([]);
          setOrderDetails(null);
          setViewProducerOrders(false);
        }
      }
    } catch (error) {
      console.error('Error checking manager status:', error);
    }
  }
  const registerUser = async (user_type) => {
    try {
      const prod = await contract.methods
        .registerUser(accounts[0], user_type)
        .send({ from: accounts[0] });
      setIsUserRegistered(true);
      loginUser();
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  useEffect(() => {
    if (!buttonClicked) return;
    if (accounts) {
      console.log('The accounts variable has changed:', accounts);
      loginUser();
    }
  }, [accounts, buttonClicked]);

  useEffect(() => {
    getAllProducts();
  }, []);

  const createProduct = async () => {
    try {
      const response = await contract.methods
        .createMedProduct(
          productName,
          accounts[0],
          description,
          quantity,
          price
        )
        .send({ from: accounts[0] });
      console.log('This is response ');
      console.log(response);
      // const productHash =
      //   response.events.ProductCreated.returnValues.productHash;

      // window.alert('Item Order Placed. Product Id:' + productHash);
      setViewProducts(true);
      setViewContainers(false);
      setViewAllProducts(true);
      trackProducts();
      setActiveDiv('addprod2');

      // Maybe reset the state variables or handle UI updates
    } catch (error) {
      console.error('Error creating product:', error);
    }
  };

  const checkProductStatus = async () => {
    console.log('Hello');
    console.log(productHash);
    try {
      const prod = await contract.methods.medproducts(productHash).call();

      // console.log(index);
      // console.log(products[index]);
      // const prodDetails = products[index];
      // console.log(prodDetails);

      // setProductDetails(prodDetails);
      // console.log(prodDetails);
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const checkProductStatusDirect = async (hash, index) => {
    console.log(hash);
    try {
      const product = await contract.methods.getProductByHash(hash).call();
      console.log('THis is Product:');
      console.log(product);
      const prodDetails = [hash, product];

      setProductDetails(prodDetails);
      console.log(prodDetails);
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const checkRetailerOrderStatusDirect = async (hash, index) => {
    console.log(hash);
    try {
      const retailproduct = await contract.methods
        .getRetailerOrdersByHash(hash)
        .call();
      console.log('THis is Product:');
      console.log(retailproduct);
      const prodDetails = [hash, retailproduct];

      setOrderDetails(prodDetails);
      console.log(prodDetails);
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const produceProduct = async (hash) => {
    try {
      const productHashes = await contract.methods
        .ProduceProduct(hash)
        .send({ from: accounts[0] });

      const product = await contract.methods.getProductByHash(hash).call();
      console.log('THis is Product:');
      console.log(product);
      const prodDetails = [hash, product];
      console.log('This is new product details: ');
      console.log(prodDetails);
      setProductDetails(prodDetails);
    } catch (error) {
      console.error('Error Producing product:', error);
    }
  };

  const getAllProducts = async () => {
    try {
      const productHashes = await contract.methods
        .getProductsByProducer(accounts[0])
        .call();

      console.log('These are product hashes ' + productHashes);
      const productDetailsPromises = productHashes.map((hash) =>
        contract.methods.medproducts(hash).call()
      );

      const allProducts = await Promise.all(productDetailsPromises);
      console.log(allProducts);
      const productsArray = allProducts.map((product, index) => {
        return [productHashes[index], product];
      });

      console.log('Product array ');
      console.log(productsArray);
      setProducts(productsArray);
      // Create an array of objects with name and hash values
      const productsWithHashes = productsArray.map((prod, index) => ({
        name: prod[1].name,
        hash: prod[0],
      }));

      console.log(productsWithHashes);

      setProductNames(productsWithHashes);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };
  const openModal = () => {
    setViewPlaceOrder(true);
  };

  const closeModal = () => {
    setViewPlaceOrder(false);
  };

  const payFromRetailer = async () => {
    console.log('Paying from retailer');
    const price = pricePlaceholder * 0.0000035;
    const priceInWei = web3.utils.toWei(price.toString(), 'ether');
    const receipt = await web3.eth.sendTransaction({
      from: accounts[0],
      to: productDetails[1].producer,
      value: priceInWei,
    });
    console.log('Transaction receipt:', receipt);

    setIsEthSent(true);
  };
  const PlaceOrder = async () => {
    try {
      const productHashes = await contract.methods
        .placeOrder(productDetails[0], accounts[0], quantitySet)
        .send({ from: accounts[0] });

      getAllOrdersRetailer();
      setViewOrderProducts(false);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const getAllOrdersRetailer = async () => {
    const retailerProductHashes = await contract.methods
      .getRetailerOrders(accounts[0])
      .call();
    var retailerproducts = [];
    console.log(retailerProductHashes);
    for (var key in retailerProductHashes) {
      const retailerProduct = await contract.methods
        .getRetailerOrdersByHash(retailerProductHashes[key])
        .call();

      retailerproducts.push([retailerProduct, retailerProductHashes[key]]);
    }
    console.log(retailerproducts);
    setOrderNames(retailerproducts);
  };

  const getAllProductOrders = async () => {
    const productHashes = await contract.methods
      .getOrdersByProducer(accounts[0])
      .call();
    var retailerproducts = [];
    console.log(productHashes);
    for (var key in productHashes) {
      const retailerProduct = await contract.methods
        .getRetailerOrdersByHash(productHashes[key])
        .call();

      retailerproducts.push([retailerProduct, productHashes[key]]);
    }
    console.log(retailerproducts);
    setOrderNames(retailerproducts);
  };

  const getOrderProducts = async () => {
    try {
      const productHashes = await contract.methods
        .viewProductsAvailable()
        .call();

      console.log('These are product hashes ');
      console.log(productHashes);
      const productDetailsPromises = productHashes.map((hash) =>
        contract.methods.medproducts(hash).call()
      );

      const allProducts = await Promise.all(productDetailsPromises);
      console.log(allProducts);
      const productsArray = allProducts.map((product, index) => {
        console.log(product);
        if (product.sno < product.quantity && product.state === '1') {
          return [productHashes[index], product];
        }
      });

      console.log('Product array ');
      console.log(productsArray);
      setProducts(productsArray);
      // Create an array of objects with name and hash values
      const productsWithHashes = productsArray.map((prod, index) => ({
        name: prod[1].name,
        hash: prod[0],
      }));
      setProductDetails(null);

      console.log(productsWithHashes);

      setProductNames(productsWithHashes);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const trackProducts = async () => {
    getAllProducts();
  };

  const sendOrder = async (hash) => {
    try {
      const productHashes = await contract.methods
        .sendOrder(hash)
        .send({ from: accounts[0] });

      const product = await contract.methods.getProductByHash(hash).call();
      console.log('THis is Product:');
      console.log(product);
      const prodDetails = [hash, product];
      console.log('This is new product details: ');
      console.log(prodDetails);
      setProductDetails(prodDetails);
    } catch (error) {
      console.error('Error Sending product:', error);
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

      {/* Main Content */}
      {buttonClicked === false && (
        <main className='flex-grow flex items-center justify-center mt-72'>
          <h1 className='text-6xl font-bold text-blue-500'>
            Implementing Package Traceability using Blockchain
          </h1>
        </main>
      )}
      <div className='flex flex-col items-center justify-start h-screen space-y-6 p-4 mt-12'>
        {isUserRegistered === false && (
          <div className='not-registered-div'>
            <h1>Looks Like you aren't registered . </h1>
            <br></br>
            <button
              className='bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600'
              onClick={() => registerUser('Producer')}
            >
              Register as Manufacturer
            </button>
            <button
              className='bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600'
              onClick={() => registerUser('Retailer')}
            >
              Register as Retailer
            </button>
            <button
              className='bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600'
              onClick={() => registerUser('User')}
            >
              Register as User
            </button>
          </div>
        )}

        {isUserRegistered === true && (
          <div>
            {isUserUser === true && <div></div>}
            {isUserRetailer === true && (
              <div>
                <button
                  className='bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600'
                  onClick={() => {
                    setViewOrderProducts(true);
                    setViewContainers(false);
                    getOrderProducts();
                  }}
                >
                  All Products
                </button>

                <button
                  className='bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600'
                  onClick={() => {
                    setViewOrderProducts(false);
                    getAllOrdersRetailer();
                  }}
                >
                  Manage Orders
                </button>
                <br></br>
                <br></br>
                {viewOrderProducts === true && (
                  <div id='anotherDiv' className='border mt-4 p-4'>
                    <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                      <div className='input-group flex flex-col space-y-2 items-start'></div>
                    </div>
                    <h1>All Products</h1>
                    <hr />
                    <div>
                      {productNames.map((product, index) => (
                        <button
                          key={index}
                          id={product.name}
                          onClick={() =>
                            checkProductStatusDirect(product.hash, index)
                          }
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
                        <p>Name: {productDetails[1].name}</p>
                        <p>Producer: {productDetails[1].producer}</p>
                        {productDetails[1].retailer !==
                          '0x0000000000000000000000000000000000000000' && (
                          <p>Retailer:{productDetails[1].retailer}</p>
                        )}

                        <p>Description: {productDetails[1].description}</p>
                        <p>
                          Product Status:{' '}
                          {productDetails[1].state === '0'
                            ? 'Under Production'
                            : productDetails[1].state === '1'
                            ? 'Produced'
                            : productDetails[1].state === '2'
                            ? 'Added To Container'
                            : productDetails[1].state === '3'
                            ? 'Under Processing at Retailer'
                            : productDetails[1].state === '4'
                            ? 'Shipping To User'
                            : productDetails[1].state === '5'
                            ? 'Shipped To User'
                            : 'Unknown'}
                        </p>
                        <p>
                          Quantity:{' '}
                          {productDetails[1].quantity - productDetails[1].sno}
                        </p>
                        <p>Price: {productDetails[1].price}</p>

                        <p>
                          {productDetails[1].state === '1' && (
                            <button
                              onClick={() => {
                                // setViewPlaceOrder(true);
                                openModal();
                              }}
                              className='w-full bg-green-500 hover:bg-green-600 active:bg-green-700 focus:outline-none focus:ring focus:ring-green-300 p-2 rounded mb-3'
                            >
                              Place Order
                            </button>
                          )}
                          {viewPlaceOrder === true && (
                            <div className='fixed inset-0 flex items-center justify-center'>
                              <div className='modal-overlay fixed inset-0 bg-gray-900 opacity-50'></div>

                              <div className='modal-container bg-white w-11/12 md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto'>
                                <div className='modal-content py-4 text-left px-6'>
                                  <div className='flex justify-between items-center pb-3'>
                                    <p className='text-2xl font-bold'>
                                      Order Form
                                    </p>
                                    <button
                                      onClick={closeModal}
                                      className='modal-close cursor-pointer z-50'
                                    >
                                      <svg
                                        className='fill-current text-black'
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='18'
                                        height='18'
                                        viewBox='0 0 18 18'
                                      >
                                        <path d='M16.22 15.78a2 2 0 0 1-2.82 0L9 11.83l-4.4 4.4a2 2 0 0 1-2.82-2.82l4.4-4.4-4.4-4.4a2 2 0 1 1 2.82-2.82l4.4 4.4 4.4-4.4a2 2 0 1 1 2.82 2.82l-4.4 4.4 4.4 4.4a2 2 0 0 1 0 2.82z' />
                                      </svg>
                                    </button>
                                  </div>

                                  <form className='mb-6'>
                                    <div className='mb-4'>
                                      <label
                                        className='block text-gray-700 text-sm font-bold mb-2'
                                        htmlFor='name'
                                      >
                                        Enter Quantity
                                      </label>
                                      <input
                                        className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                                        id='quantity'
                                        type='number'
                                        placeholder='Enter the Quantity'
                                        value={quantitySet}
                                        onChange={newhandleQuantityChange}
                                        max={productDetails[1].quantity}
                                        min={0}
                                      />
                                    </div>

                                    <div className='mb-6'>
                                      <label className='block text-gray-700 text-sm font-bold mb-2'>
                                        Price
                                      </label>
                                      <input
                                        className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                                        id='price'
                                        type='text'
                                        placeholder={`Price will change with input`}
                                        readOnly
                                        value={pricePlaceholder}
                                      />
                                    </div>

                                    {isethSent === false && (
                                      <div className='flex items-center justify-end'>
                                        <button
                                          className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
                                          type='button'
                                          onClick={payFromRetailer}
                                        >
                                          Send Eth
                                        </button>
                                      </div>
                                    )}
                                    {isethSent === true && (
                                      <div className='flex items-center justify-end'>
                                        <button
                                          className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
                                          type='button'
                                          onClick={PlaceOrder}
                                        >
                                          Submit
                                        </button>
                                      </div>
                                    )}
                                  </form>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Product Location History:{' '}
                            {productDetails.hubLocations.length > 0
                              ? productDetails.hubLocations.join('---->') +
                                '--->'
                              : 'Seller is packaging order'} */}
                        </p>
                        {/* <p>
                            Qr Code(will be scanned by the delivery personnel):
                          </p>
                          <br />
                          <QRCode value={productDetails[0]} /> */}
                      </div>
                    )}
                  </div>
                )}
                {viewOrderProducts === false && (
                  <div>
                    <div id='anotherDiv' className='border mt-4 p-4'>
                      <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                        <div className='input-group flex flex-col space-y-2 items-start'></div>
                      </div>
                      <h1>All Orders</h1>
                      <hr />
                      <div>
                        {orderNames.map(([product, hash], index) => (
                          <button
                            key={index}
                            id={product.name}
                            onClick={() => {
                              console.log('+++++++++++');
                              console.log(hash);
                              checkRetailerOrderStatusDirect(hash, index);
                            }}
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

                      {orderDetails && (
                        <div className='mt-4'>
                          <p>Name: {orderDetails[1].name}</p>
                          <p>Producer: {orderDetails[1].producer}</p>
                          {orderDetails[1].retailer !==
                            '0x0000000000000000000000000000000000000000' && (
                            <p>Retailer:{orderDetails[1].retailer}</p>
                          )}

                          <p>Description: {orderDetails[1].description}</p>
                          <p>
                            Product Status:{' '}
                            {orderDetails[1].state === '0'
                              ? 'Under Production'
                              : orderDetails[1].state === '1'
                              ? 'Produced'
                              : orderDetails[1].state === '2'
                              ? 'Added To Container'
                              : orderDetails[1].state === '3'
                              ? 'Under Processing at Retailer'
                              : orderDetails[1].state === '4'
                              ? 'Shipping To User'
                              : orderDetails[1].state === '5'
                              ? 'Shipped To User'
                              : 'Unknown'}
                          </p>
                          <p>Quantity: {orderDetails[1].quantity}</p>

                          <p>
                            {orderDetails[1].state === '2' && (
                              <button
                                onClick={() => {
                                  // setViewPlaceOrder(true);
                                  openModal();
                                }}
                                className='w-full bg-green-500 hover:bg-green-600 active:bg-green-700 focus:outline-none focus:ring focus:ring-green-300 p-2 rounded mb-3'
                              >
                                Place Order
                              </button>
                            )}
                            {viewPlaceOrder === true && (
                              <div className='fixed inset-0 flex items-center justify-center'>
                                <div className='modal-overlay fixed inset-0 bg-gray-900 opacity-50'></div>

                                <div className='modal-container bg-white w-11/12 md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto'>
                                  <div className='modal-content py-4 text-left px-6'>
                                    <div className='flex justify-between items-center pb-3'>
                                      <p className='text-2xl font-bold'>
                                        Order Form
                                      </p>
                                      <button
                                        onClick={closeModal}
                                        className='modal-close cursor-pointer z-50'
                                      >
                                        <svg
                                          className='fill-current text-black'
                                          xmlns='http://www.w3.org/2000/svg'
                                          width='18'
                                          height='18'
                                          viewBox='0 0 18 18'
                                        >
                                          <path d='M16.22 15.78a2 2 0 0 1-2.82 0L9 11.83l-4.4 4.4a2 2 0 0 1-2.82-2.82l4.4-4.4-4.4-4.4a2 2 0 1 1 2.82-2.82l4.4 4.4 4.4-4.4a2 2 0 1 1 2.82 2.82l-4.4 4.4 4.4 4.4a2 2 0 0 1 0 2.82z' />
                                        </svg>
                                      </button>
                                    </div>

                                    <form className='mb-6'>
                                      <div className='mb-4'>
                                        <label
                                          className='block text-gray-700 text-sm font-bold mb-2'
                                          htmlFor='name'
                                        >
                                          Enter Quantity
                                        </label>
                                        <input
                                          className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                                          id='quantity'
                                          type='number'
                                          placeholder='Enter the Quantity'
                                          value={quantitySet}
                                          onChange={newhandleQuantityChange}
                                          max={productDetails[1].quantity}
                                          min={0}
                                        />
                                      </div>

                                      <div className='mb-6'>
                                        <label className='block text-gray-700 text-sm font-bold mb-2'>
                                          Price
                                        </label>
                                        <input
                                          className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                                          id='price'
                                          type='text'
                                          placeholder={`Price will change with input`}
                                          readOnly
                                          value={pricePlaceholder}
                                        />
                                      </div>

                                      {isethSent === false && (
                                        <div className='flex items-center justify-end'>
                                          <button
                                            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
                                            type='button'
                                            onClick={payFromRetailer}
                                          >
                                            Send Eth
                                          </button>
                                        </div>
                                      )}
                                      {isethSent === true && (
                                        <div className='flex items-center justify-end'>
                                          <button
                                            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
                                            type='button'
                                            onClick={PlaceOrder}
                                          >
                                            Submit
                                          </button>
                                        </div>
                                      )}
                                    </form>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Product Location History:{' '}
                            {productDetails.hubLocations.length > 0
                              ? productDetails.hubLocations.join('---->') +
                                '--->'
                              : 'Seller is packaging order'} */}
                          </p>
                          {/* <p>
                            Qr Code(will be scanned by the delivery personnel):
                          </p>
                          <br />
                          <QRCode value={productDetails[0]} /> */}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {isUserManufacturer === true && (
              <div>
                <div className='non-manager-div'>
                  {/* user */}
                  <button
                    className='bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600'
                    onClick={() => {
                      setViewProducts(true);
                      setViewContainers(false);
                      setViewAllProducts(true);
                      setViewProducerOrders(false);
                      trackProducts();
                      setActiveDiv('addprod2');
                    }}
                  >
                    Products
                  </button>

                  <button
                    className='bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600'
                    onClick={() => {
                      setViewProducts(false);
                      setViewProducerOrders(true);
                      getAllProductOrders();
                    }}
                  >
                    Orders
                  </button>
                  <br></br>
                  <br></br>

                  {viewProducts === true && (
                    <div>
                      <>
                        <button
                          className='bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600'
                          onClick={() => {
                            setActiveDiv('addprod');
                            setViewAllProducts(false);
                          }}
                        >
                          Create Product
                        </button>
                        <button
                          className='bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600'
                          onClick={() => {
                            setViewProducts(true);
                            setViewContainers(false);
                            setViewAllProducts(true);
                            trackProducts();
                            setActiveDiv('addprod2');
                          }}
                        >
                          Change Product Status
                        </button>
                      </>

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
                            <label className='block'>Item Description:</label>
                            <input
                              type='text'
                              placeholder='Item Description'
                              value={description}
                              onChange={handleDescriptionChange}
                              className='flex-grow p-2 border rounded'
                            />
                          </div>
                          <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                            <label className='block'>Item Quantity:</label>
                            <input
                              type='number'
                              placeholder='Item Quantity'
                              value={quantity}
                              onChange={handleQuantityChange}
                              className='flex-grow p-2 border rounded'
                            />
                          </div>
                          <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                            <label className='block'>Item Price:</label>
                            <input
                              type='number'
                              placeholder='Item Price'
                              value={price}
                              onChange={handlePriceChange}
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

                      {viewAllProducts === true && (
                        <div id='anotherDiv' className='border mt-4 p-4'>
                          <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                            <div className='input-group flex flex-col space-y-2 items-start'>
                              <label className='block mr-20'>
                                Enter Product Id:
                              </label>
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
                            {productNames && productNames.length > 0 ? (
                              productNames.map((product, index) => (
                                <button
                                  key={index}
                                  id={product.name}
                                  onClick={() =>
                                    checkProductStatusDirect(
                                      product.hash,
                                      index
                                    )
                                  }
                                  className='w-full bg-violet-500 hover:bg-violet-600 active:bg-violet-700 focus:outline-none focus:ring focus:ring-violet-300 p-2 rounded mt-6'
                                >
                                  {product.name}
                                </button>
                              ))
                            ) : (
                              <h3>No Products Yet</h3>
                            )}
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
                              <p>Name: {productDetails[1].name}</p>
                              <p>Producer: {productDetails[1].producer}</p>
                              {productDetails[1].retailer !==
                                '0x0000000000000000000000000000000000000000' && (
                                <p>Retailer:{productDetails[1].retailer}</p>
                              )}

                              <p>
                                Description: {productDetails[1].description}
                              </p>
                              <p>
                                Product Status:{' '}
                                {productDetails[1].state === '0'
                                  ? 'Under Production'
                                  : productDetails[1].state === '1'
                                  ? 'Produced'
                                  : productDetails[1].state === '2'
                                  ? 'Added To Container'
                                  : productDetails[1].state === '3'
                                  ? 'Under Processing at Retailer'
                                  : productDetails[1].state === '4'
                                  ? 'Shipping To User'
                                  : productDetails[1].state === '5'
                                  ? 'Shipped To User'
                                  : 'Unknown'}
                              </p>
                              <p>Quantity: {productDetails[1].quantity}</p>
                              <p>Price: {productDetails[1].price}</p>

                              <p>
                                {productDetails[1].state === '0' && (
                                  <button
                                    onClick={() => {
                                      produceProduct(productDetails[0]);
                                      console.log(productDetails[0]);
                                    }}
                                    className='w-full bg-green-500 hover:bg-green-600 active:bg-green-700 focus:outline-none focus:ring focus:ring-green-300 p-2 rounded mb-3'
                                  >
                                    Produce
                                  </button>
                                )}
                                {/* Product Location History:{' '}
                            {productDetails.hubLocations.length > 0
                              ? productDetails.hubLocations.join('---->') +
                                '--->'
                              : 'Seller is packaging order'} */}
                              </p>
                              {/* <p>
                            Qr Code(will be scanned by the delivery personnel):
                          </p>
                          <br />
                          <QRCode value={productDetails[0]} /> */}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {viewProducerOrder === true && (
                    <div>
                      <div id='anotherDiv' className='border mt-4 p-4'>
                        <div className='input-group flex items-center w-full sm:w-3/4 md:w-2/3 lg:w-1/2 xl:w-1/3 mb-4 space-x-4'>
                          <div className='input-group flex flex-col space-y-2 items-start'></div>
                        </div>
                        All Orders Placed
                        <hr />
                        <div>
                          {orderNames.map(([product, hash], index) => (
                            <button
                              key={index}
                              id={product.name}
                              onClick={() => {
                                console.log('+++++++++++');
                                console.log(hash);
                                checkRetailerOrderStatusDirect(hash, index);
                              }}
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
                        {orderDetails && (
                          <div className='mt-4'>
                            <p>Name: {orderDetails[1].name}</p>
                            <p>Producer: {orderDetails[1].producer}</p>
                            {orderDetails[1].retailer !==
                              '0x0000000000000000000000000000000000000000' && (
                              <p>Retailer:{orderDetails[1].retailer}</p>
                            )}

                            <p>Description: {orderDetails[1].description}</p>
                            <p>
                              Product Status:{' '}
                              {orderDetails[1].state === '0'
                                ? 'Under Production'
                                : orderDetails[1].state === '1'
                                ? 'Produced'
                                : orderDetails[1].state === '2'
                                ? 'Added To Container'
                                : orderDetails[1].state === '3'
                                ? 'Under Processing at Retailer'
                                : orderDetails[1].state === '4'
                                ? 'Shipping To User'
                                : orderDetails[1].state === '5'
                                ? 'Shipped To User'
                                : 'Unknown'}
                            </p>
                            <p>Quantity: {orderDetails[1].quantity}</p>

                            <p>
                              {orderDetails[1].state === '1' && (
                                <button
                                  onClick={() => {
                                    // setViewPlaceOrder(true);
                                    sendOrder(orderDetails[0]);
                                  }}
                                  className='w-full bg-green-500 hover:bg-green-600 active:bg-green-700 focus:outline-none focus:ring focus:ring-green-300 p-2 rounded mb-3'
                                >
                                  Send Order
                                </button>
                              )}

                              {/* Product Location History:{' '}
                            {productDetails.hubLocations.length > 0
                              ? productDetails.hubLocations.join('---->') +
                                '--->'
                              : 'Seller is packaging order'} */}
                            </p>
                            {/* <p>
                            Qr Code(will be scanned by the delivery personnel):
                          </p>
                          <br />
                          <QRCode value={productDetails[0]} /> */}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className='fixed-footer'>© 2023 Walmart. All Rights Reserved.</div>
    </div>
  );
}

export default Home;
