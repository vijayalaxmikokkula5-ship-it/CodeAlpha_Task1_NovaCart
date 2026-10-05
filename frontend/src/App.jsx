import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const categories = [
  { value: "All", label: "All Products" },
  { value: "Electronics", label: "Electronic Items" },
  { value: "Accessories", label: "Accessories" },
  { value: "Fashion", label: "Fashion" },
  { value: "Home", label: "Home & Living" },
  { value: "Lifestyle", label: "Lifestyle" },
];

const categoryLabels = {
  Electronics: "Electronic Item",
  Accessories: "Accessory",
  Fashion: "Fashion",
  Home: "Home & Living",
  Lifestyle: "Lifestyle",
};

function App() {
  const [page, setPage] = useState("home");
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  });

  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetchProducts("", "All");
  }, []);

  async function fetchProducts(
    searchValue = "",
    categoryValue = "All"
  ) {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (searchValue.trim()) {
        params.append("search", searchValue.trim());
      }

      if (categoryValue !== "All") {
        params.append("category", categoryValue);
      }

      const query = params.toString();

      const url = query
        ? `${API}/api/products?${query}`
        : `${API}/api/products`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load products"
        );
      }

      setProducts(data);
    } catch (error) {
      console.error("Product loading error:", error);
      setNotice("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  const total = useMemo(() => {
    return cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price) * Number(item.quantity),
      0
    );
  }, [cart]);

  function addToCart(product) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item._id === product._id
      );

      if (existing) {
        return currentCart.map((item) =>
          item._id === product._id
            ? {
                ...item,
                quantity: Number(item.quantity) + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    setNotice("Product added to cart!");
  }

  function updateQuantity(id, change) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item._id === id
          ? {
              ...item,
              quantity: Math.max(
                1,
                Number(item.quantity) + change
              ),
            }
          : item
      )
    );
  }

  function removeFromCart(id) {
    setCart((currentCart) =>
      currentCart.filter((item) => item._id !== id)
    );

    setNotice("Product removed from cart.");
  }

  async function handleAuth(e) {
    e.preventDefault();

    try {
      const endpoint =
        authMode === "login"
          ? "/api/auth/login"
          : "/api/auth/register";

      const body =
        authMode === "login"
          ? {
              email: form.email,
              password: form.password,
            }
          : {
              name: form.name,
              email: form.email,
              password: form.password,
            };

      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setNotice(
          data.message || "Authentication failed."
        );
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setToken(data.token);
      setUser(data.user);

      setForm({
        name: "",
        email: "",
        password: "",
      });

      setNotice(
        authMode === "login"
          ? "Login successful!"
          : "Registration successful!"
      );

      setPage("home");
    } catch (error) {
      console.error("Authentication error:", error);
      setNotice("Unable to connect to server.");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);
    setOrders([]);
    setPage("home");

    setNotice("Logged out successfully.");
  }

  async function openProduct(product) {
    try {
      const response = await fetch(
        `${API}/api/products/${product._id}`
      );

      const data = await response.json();

      if (response.ok) {
        setSelectedProduct(data);
      } else {
        setSelectedProduct(product);
      }
    } catch (error) {
      console.error("Product details error:", error);
      setSelectedProduct(product);
    }

    setPage("product");
  }

  async function checkout(e) {
    e.preventDefault();

    if (!token) {
      setNotice(
        "Please login before placing an order."
      );
      setAuthMode("login");
      setPage("auth");
      return;
    }

    if (cart.length === 0) {
      setNotice("Your cart is empty.");
      setPage("cart");
      return;
    }

    const formData = new FormData(e.currentTarget);

    const shippingAddress =
      formData.get("address")?.toString().trim() || "";

    if (!shippingAddress) {
      setNotice(
        "Please enter your shipping address."
      );
      return;
    }

    const orderItems = cart.map((item) => ({
      productId: item._id,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
    }));

    const orderData = {
      items: orderItems,
      total: Number(total),
      shippingAddress,
    };

    try {
      setLoading(true);

      const response = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        setNotice(
          data.message || "Failed to place order."
        );
        return;
      }

      setCart([]);
      localStorage.removeItem("cart");

      setNotice("Order placed successfully!");
      setPage("success");
    } catch (error) {
      console.error("Checkout error:", error);
      setNotice("Failed to place order.");
    } finally {
      setLoading(false);
    }
  }

  async function loadOrders() {
    if (!token) {
      setAuthMode("login");
      setPage("auth");
      setNotice(
        "Please login to view your orders."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setNotice(
          data.message || "Failed to load orders."
        );
        return;
      }

      setOrders(data);
      setPage("orders");
    } catch (error) {
      console.error("Orders error:", error);
      setNotice("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    fetchProducts(search, category);
  }

  function handleCategoryChange(selectedCategory) {
    setCategory(selectedCategory);
    fetchProducts(search, selectedCategory);
  }

  function clearFilters() {
    setSearch("");
    setCategory("All");
    fetchProducts("", "All");
  }

  function goHome() {
    setPage("home");
    setSelectedProduct(null);
  }

  function goCart() {
    setPage("cart");
  }

  function goAuth(mode) {
    setAuthMode(mode);
    setNotice("");
    setPage("auth");
  }

  function Navbar() {
    return (
      <header className="navbar">
        <div
          className="logo"
          onClick={goHome}
          style={{ cursor: "pointer" }}
        >
          NovaCart
        </div>

        <nav>
          <button type="button" onClick={goHome}>
            Home
          </button>

          <button type="button" onClick={goCart}>
            Cart ({cart.length})
          </button>

          {user && (
            <button
              type="button"
              onClick={loadOrders}
            >
              My Orders
            </button>
          )}

          {user ? (
            <>
              <span className="welcome">
                Hi, {user.name}
              </span>

              <button
                type="button"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => goAuth("login")}
            >
              Login
            </button>
          )}
        </nav>
      </header>
    );
  }

  function HomePage() {
    return (
      <div className="page">
        <section className="hero">
          <div>
            <p className="eyebrow">
              WELCOME TO NOVACART
            </p>

            <h1>
              Shop smart.
              <br />
              Live better.
            </h1>

            <p>
              Discover quality products at
              affordable prices.
            </p>

            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                document
                  .getElementById("products")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Shop Now
            </button>
          </div>
        </section>

        <section
          className="products-section"
          id="products"
        >
          <div className="section-header">
            <div>
              <h2>Featured Products</h2>

              <p>
                Find something you will love.
              </p>
            </div>

            <form
              className="search-box"
              onSubmit={handleSearch}
            >
              <input
                type="search"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search products..."
              />

              <button type="submit">
                Search
              </button>
            </form>
          </div>

          <div className="categories">
            {categories.map((item) => (
              <button
                key={item.value}
                type="button"
                className={
                  category === item.value
                    ? "active"
                    : ""
                }
                onClick={() =>
                  handleCategoryChange(
                    item.value
                  )
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="center-text">
              Loading products...
            </p>
          ) : products.length === 0 ? (
            <div className="empty-page">
              <h2>No products found</h2>

              <p>
                Try another search or category.
              </p>

              <button
                type="button"
                className="primary-btn"
                onClick={clearFilters}
              >
                View All Products
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <div
                  className="product-card"
                  key={product._id}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                  />

                  <div className="product-info">
                    <span className="category-label">
                      {categoryLabels[
                        product.category
                      ] || product.category}
                    </span>

                    <h3>{product.name}</h3>

                    <p>
                      {product.description}
                    </p>

                    <div className="product-bottom">
                      <strong>
                        ₹{product.price}
                      </strong>

                      <div>
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() =>
                            openProduct(product)
                          }
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="primary-btn small"
                          onClick={() =>
                            addToCart(product)
                          }
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  function ProductPage() {
    if (!selectedProduct) {
      return (
        <div className="page center-text">
          Product not found.
        </div>
      );
    }

    return (
      <div className="page">
        <button
          type="button"
          className="back-btn"
          onClick={goHome}
        >
          ← Back to Products
        </button>

        <div className="product-detail">
          <img
            src={selectedProduct.image}
            alt={selectedProduct.name}
          />

          <div>
            <span className="category-label">
              {categoryLabels[
                selectedProduct.category
              ] || selectedProduct.category}
            </span>

            <h1>{selectedProduct.name}</h1>

            <p className="detail-description">
              {selectedProduct.description}
            </p>

            <h2>
              ₹{selectedProduct.price}
            </h2>

            <p>
              Stock: {selectedProduct.stock}
            </p>

            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                addToCart(selectedProduct)
              }
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  function CartPage() {
    if (cart.length === 0) {
      return (
        <div className="page empty-page">
          <h1>Your cart is empty 🛒</h1>

          <p>
            Add some products before checking out.
          </p>

          <button
            type="button"
            className="primary-btn"
            onClick={goHome}
          >
            Continue Shopping
          </button>
        </div>
      );
    }

    return (
      <div className="page">
        <div className="content">
          <h1>Your Cart</h1>

          <div className="cart-layout">
            <div className="cart-items">
              {cart.map((item) => (
                <div
                  className="cart-item"
                  key={item._id}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                  />

                  <div className="cart-item-info">
                    <h3>{item.name}</h3>

                    <p>₹{item.price}</p>

                    <div className="quantity">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item._id,
                            -1
                          )
                        }
                      >
                        −
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item._id,
                            1
                          )
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() =>
                        removeFromCart(item._id)
                      }
                    >
                      Remove
                    </button>
                  </div>

                  <strong>
                    ₹
                    {Number(item.price) *
                      Number(item.quantity)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h2>Order Summary</h2>

              <div className="summary-row">
                <span>Items</span>
                <span>{cart.length}</span>
              </div>

              <div className="summary-row total-row">
                <span>Total</span>

                <strong>₹{total}</strong>
              </div>

              <button
                type="button"
                className="primary-btn full"
                onClick={() => {
                  if (!token) {
                    goAuth("login");
                  } else {
                    setPage("checkout");
                  }
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function CheckoutPage() {
    return (
      <div className="page">
        <div className="content">
          <h1>Checkout</h1>

          <div className="checkout-layout">
            <form
              className="checkout-form"
              onSubmit={checkout}
            >
              <h2>Shipping Information</h2>

              <label>
                Shipping Address
              </label>

              <textarea
                name="address"
                rows="5"
                placeholder="Enter your complete shipping address"
                required
              />

              <button
                className="primary-btn full"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Placing Order..."
                  : "Place Order"}
              </button>
            </form>

            <div className="checkout-summary">
              <h2>Order Summary</h2>

              {cart.map((item) => (
                <div
                  className="summary-product"
                  key={item._id}
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>

                  <strong>
                    ₹
                    {Number(item.price) *
                      Number(item.quantity)}
                  </strong>
                </div>
              ))}

              <hr />

              <div className="summary-row total-row">
                <span>Total</span>

                <strong>₹{total}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function AuthPage() {
    return (
      <div className="page auth-page">
        <div className="auth-card">
          <h1>
            {authMode === "login"
              ? "Welcome Back"
              : "Create Account"}
          </h1>

          <p>
            {authMode === "login"
              ? "Login to continue shopping."
              : "Create your NovaCart account."}
          </p>

          <form onSubmit={handleAuth}>
            {authMode === "register" && (
              <>
                <label>Name</label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </>
            )}

            <label>Email</label>

            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              required
            />

            <label>Password</label>

            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              required
            />

            <button
              className="primary-btn full"
              type="submit"
            >
              {authMode === "login"
                ? "Login"
                : "Register"}
            </button>
          </form>

          <button
            type="button"
            className="link-btn"
            onClick={() =>
              setAuthMode(
                authMode === "login"
                  ? "register"
                  : "login"
              )
            }
          >
            {authMode === "login"
              ? "Create a new account"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  }

  function OrdersPage() {
    return (
      <div className="page">
        <div className="content">
          <h1>My Orders</h1>

          {orders.length === 0 ? (
            <div className="empty-page">
              <h2>No orders yet.</h2>

              <button
                type="button"
                className="primary-btn"
                onClick={goHome}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div
                  className="order-card"
                  key={order._id}
                >
                  <div className="order-header">
                    <div>
                      <strong>
                        Order #{order._id.slice(-8)}
                      </strong>

                      <p>
                        {new Date(
                          order.createdAt
                        ).toLocaleString()}
                      </p>
                    </div>

                    <span className="status">
                      {order.status}
                    </span>
                  </div>

                  <div className="order-items">
                    {order.items?.map(
                      (item, index) => (
                        <div
                          className="summary-product"
                          key={index}
                        >
                          <span>
                            {item.name} ×{" "}
                            {item.quantity}
                          </span>

                          <strong>
                            ₹
                            {Number(item.price) *
                              Number(item.quantity)}
                          </strong>
                        </div>
                      )
                    )}
                  </div>

                  <div className="order-total">
                    Total: ₹{order.total}
                  </div>

                  <p>
                    <strong>Shipping:</strong>{" "}
                    {order.shippingAddress}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function SuccessPage() {
    return (
      <div className="page success-page">
        <div className="success-card">
          <div className="success-icon">
            ✓
          </div>

          <h1>Order Confirmed!</h1>

          <p>
            Your order has been placed
            successfully.
          </p>

          <button
            type="button"
            className="primary-btn"
            onClick={loadOrders}
          >
            View My Orders
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={goHome}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  /*
    IMPORTANT FIX:

    Do not render the nested page components using
    <HomePage />, <CartPage />, etc.

    Calling them as functions prevents React from
    remounting the nested component on every keystroke.
    This keeps the search input focused while typing.
  */

  function renderPage() {
    switch (page) {
      case "product":
        return ProductPage();

      case "cart":
        return CartPage();

      case "checkout":
        return CheckoutPage();

      case "auth":
        return AuthPage();

      case "orders":
        return OrdersPage();

      case "success":
        return SuccessPage();

      case "home":
      default:
        return HomePage();
    }
  }

  return (
    <div className="app">
      <Navbar />

      {notice && (
        <div className="notice">
          <span>{notice}</span>

          <button
            type="button"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}

      {renderPage()}

      <footer>
        <p>
          © 2026 NovaCart. Built for CodeAlpha
          Full Stack Development Internship.
        </p>
      </footer>
    </div>
  );
}

export default App;