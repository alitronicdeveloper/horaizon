import { useState } from "react"

export default function App() {
  const [page, setPage] = useState("home")
  const [selectedShop, setSelectedShop] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [cart, setCart] = useState([])
  const [deliveryType, setDeliveryType] = useState("horizon")

  // --- STATE ZA DASHBOARD & ANALYTICS ---
  const [editingProduct, setEditingProduct] = useState(null) 
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    shop: "Kariakoo Electronics" 
  })

  const [shops, setShops] = useState([
    "Kariakoo Electronics",
    "Tech Zone",
    "Mlimani Fashion",
    "Smart Devices",
    "Dar Furniture"
  ])

  // State ya kufuatilia clicks za WhatsApp kwa kila duka ndani ya wiki hii
  const [whatsappClicks, setWhatsappClicks] = useState({
    "Kariakoo Electronics": 24,
    "Tech Zone": 12,
    "Mlimani Fashion": 8,
    "Smart Devices": 0,
    "Dar Furniture": 0
  })

  const products = [
    { id: 1, name: "iPhone 15 Pro", price: "Tsh 2,400,000", description: "Latest smartphone." },
    { id: 2, name: "PS5 Console", price: "Tsh 1,500,000", description: "Gaming console." },
    { id: 3, name: "Nike Air Max", price: "Tsh 250,000", description: "Stylish sneakers." },
    { id: 4, name: "Gaming Laptop", price: "Tsh 3,200,000", description: "High performance laptop." }
  ]

  const addToCart = () => {
    setCart([
      ...cart,
      {
        ...selectedProduct,
        shop: selectedShop
      }
    ])
  }

  // Kazi inayoitwa mteja akibonyeza kuagiza kwa WhatsApp
  const handleWhatsAppOrder = (shopName) => {
    setWhatsappClicks(prev => ({
      ...prev,
      [shopName]: (prev[shopName] || 0) + 1
    }))
    
    // Hapa unaweza kuweka link halisi ya WhatsApp baadae, mfano:
    // window.open(`https://wa.me/2557XXXXXXXX?text=Habari, nataka ${selectedProduct.name}`);
    alert("Kuelekea WhatsApp... (Oda imerekodiwa kwenye Analytiki ya Wiki!)")
  }

  const totalPrice = cart.reduce((sum, item) => {
    return sum + Number(item.price.replace(/[^0-9]/g, ""))
  }, 0)

  const deliveryFee = deliveryType === "horizon" ? 3000 : 5000
  const finalTotal = totalPrice + deliveryFee

  // Data ya bidhaa za maduka (Dynamic)
  const [shopProducts, setShopProducts] = useState({
    "Kariakoo Electronics": [
      { id: 101, name: "iPhone 15 Pro", price: "Tsh 2,400,000", description: "Latest Apple smartphone with premium camera." },
      { id: 102, name: "Samsung Smart TV", price: "Tsh 1,200,000", description: "4K Smart TV with crystal clear display." }
    ],
    "Tech Zone": [
      { id: 103, name: "Gaming Laptop", price: "Tsh 3,200,000", description: "High performance laptop for gaming and editing." }
    ],
    "Mlimani Fashion": [
      { id: 104, name: "Nike Air Max", price: "Tsh 250,000", description: "Comfortable and stylish sneakers." }
    ],
    "Smart Devices": [],
    "Dar Furniture": []
  })

  // --- LOGIC ZA DASHBOARD (CRUD) ---
  const handleAddProduct = (e) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.price) return alert("Tafadhali jaza jina na bei!")

    const productToAdd = {
      id: Date.now(), 
      name: newProduct.name,
      price: newProduct.price.startsWith("Tsh") ? newProduct.price : `Tsh ${newProduct.price}`,
      description: newProduct.description || "Hakuna maelezo bado."
    }

    const currentShopProducts = shopProducts[newProduct.shop] || []
    setShopProducts({
      ...shopProducts,
      [newProduct.shop]: [...currentShopProducts, productToAdd]
    })

    setNewProduct({ name: "", price: "", description: "", shop: newProduct.shop })
    alert("Bidhaa imewekwa dukani kwako kikamilifu! 🚀")
  }

  const startEdit = (product, shopName) => {
    setEditingProduct({ ...product, originalShop: shopName })
  }

  const handleUpdateProduct = (e) => {
    e.preventDefault()
    const { originalShop, id, name, price, description } = editingProduct

    const updatedShopProducts = (shopProducts[originalShop] || []).map(prod => {
      if (prod.id === id) {
        return { ...prod, name, price: price.startsWith("Tsh") ? price : `Tsh ${price}`, description }
      }
      return prod
    })

    setShopProducts({
      ...shopProducts,
      [originalShop]: updatedShopProducts
    })

    setEditingProduct(null) 
    alert("Mabadiliko yamehifadhiwa! 💾")
  }

  const handleDeleteProduct = (shopName, productId) => {
    if (confirm("Je, una uhakika unataka kufuta bidhaa hii kabisa?")) {
      const filteredProducts = (shopProducts[shopName] || []).filter(prod => prod.id !== productId)
      setShopProducts({
        ...shopProducts,
        [shopName]: filteredProducts
      })
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#0f172a,#111827,#1e293b)",
        color: "white",
        fontFamily: "Arial"
      }}
    >
      {/* NAVBAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "18px 25px",
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(10px)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          borderBottom: "1px solid rgba(255,255,255,0.1)"
        }}
      >
        <h2
          onClick={() => setPage("home")}
          style={{
            margin: 0,
            cursor: "pointer",
            background: "linear-gradient(to right,#38bdf8,#8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          Horizon
        </h2>

        <div style={{ display: "flex", gap: "20px", alignItems: "center", fontWeight: "bold" }}>
          <span onClick={() => setPage("home")} style={{ cursor: "pointer", color: page === "home" ? "#38bdf8" : "white" }}>🏠 Home</span>
          <span onClick={() => setPage("shops")} style={{ cursor: "pointer", color: page === "shops" ? "#38bdf8" : "white" }}>🏪 Shops</span>
          <span onClick={() => setPage("cart")} style={{ cursor: "pointer", color: page === "cart" ? "#38bdf8" : "white" }}>🛒 Cart ({cart.length})</span>
          <span onClick={() => setPage("dashboard")} style={{ cursor: "pointer", color: page === "dashboard" ? "#a855f7" : "white" }}>📊 Dashboard</span>
        </div>
      </div>

      {/* HOME PAGE */}
      {page === "home" && (
        <>
          {/* HERO */}
          <div style={{ padding: "70px 20px", textAlign: "center" }}>
            <h1 style={{ fontSize: "55px", marginBottom: "10px", background: "linear-gradient(to right,#60a5fa,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Horizon Marketplace
            </h1>
            <p style={{ color: "#cbd5e1", fontSize: "18px" }}>Discover trending products and explore amazing shops.</p>
            <div style={{ marginTop: "30px", display: "flex", justify0Content: "center", justifyContent: "center" }}>
              <input
                placeholder="Search products, shops..."
                style={{ width: "70%", maxWidth: "650px", padding: "16px", borderRadius: "50px", border: "none", outline: "none", fontSize: "16px", background: "rgba(255,255,255,0.1)", color: "white", boxShadow: "0 0 20px rgba(59,130,246,0.3)" }}
              />
            </div>
          </div>

          {/* SHOPS */}
          <div style={{ padding: "0 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h2>🔥 Popular Shops</h2>
              <button onClick={() => setPage("shops")} style={{ padding: "10px 18px", border: "none", borderRadius: "12px", background: "linear-gradient(to right,#06b6d4,#3b82f6)", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                View All Shops
              </button>
            </div>
            <div style={{ display: "flex", gap: "15px", overflowX: "auto", paddingBottom: "10px" }}>
              {shops.map((shop, index) => (
                <div
                  key={index}
                  onClick={() => { setSelectedShop(shop); setPage("shopProfile"); }}
                  style={{ minWidth: "220px", padding: "20px", borderRadius: "18px", background: "linear-gradient(135deg,#2563eb,#7c3aed)", boxShadow: "0 10px 25px rgba(0,0,0,0.4)", cursor: "pointer", fontWeight: "bold" }}
                >
                  🏪 {shop}
                  <div style={{ marginTop: "10px", fontSize: "13px", color: "#dbeafe" }}>Trusted seller • Fast delivery</div>
                </div>
              ))}
            </div>
          </div>

          {/* PRODUCTS */}
          <div style={{ padding: "30px 20px" }}>
            <h2 style={{ marginBottom: "20px" }}>✨ Trending Products</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "20px" }}>
              {products.map(product => (
                <div key={product.id} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "22px", overflow: "hidden", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
                  <div style={{ height: "180px", background: "linear-gradient(135deg,#38bdf8,#8b5cf6,#ec4899)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "60px" }}>📦</div>
                  <div style={{ padding: "18px" }}>
                    <h3 style={{ marginBottom: "8px" }}>{product.name}</h3>
                    <p style={{ color: "#38bdf8", fontWeight: "bold", fontSize: "18px" }}>{product.price}</p>
                    <button
                      onClick={() => {
                        setSelectedProduct({ ...product, description: "Trending item kutoka soko kuu." })
                        setSelectedShop("Kariakoo Electronics") 
                        setPage("productDetails")
                      }}
                      style={{ width: "100%", marginTop: "15px", padding: "12px", border: "none", borderRadius: "12px", background: "linear-gradient(to right,#3b82f6,#8b5cf6)", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}
                    >
                      View Details 👀
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* SHOPS PAGE */}
      {page === "shops" && (
        <div style={{ padding: "30px 20px" }}>
          <h1 style={{ fontSize: "45px", marginBottom: "10px", background: "linear-gradient(to right,#38bdf8,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Explore Shops 🏪
          </h1>
          <p style={{ color: "#cbd5e1", marginBottom: "30px" }}>Browse verified shops and discover products.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "20px" }}>
            {shops.map((shop, index) => (
              <div key={index} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "22px", padding: "20px", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
                <div style={{ height: "160px", borderRadius: "18px", background: "linear-gradient(135deg,#0ea5e9,#8b5cf6,#ec4899)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "55px", marginBottom: "15px" }}>🏪</div>
                <h2>{shop}</h2>
                <p style={{ color: "#cbd5e1" }}>Electronics • Fashion • Fast Delivery</p>
                <button onClick={() => { setSelectedShop(shop); setPage("shopProfile"); }} style={{ width: "100%", marginTop: "18px", padding: "12px", border: "none", borderRadius: "12px", background: "linear-gradient(to right,#3b82f6,#8b5cf6)", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                  Open Shop
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHOP PROFILE */}
      {page === "shopProfile" && selectedShop && (
        <div style={{ padding: "30px 20px" }}>
          <button onClick={() => setPage("shops")} style={{ padding: "10px 15px", borderRadius: "10px", border: "none", marginBottom: "20px", cursor: "pointer" }}>⬅ Back</button>
          <h1>{selectedShop}</h1>
          <p style={{ color: "#cbd5e1" }}>Verified shop • Trusted products • Fast delivery</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "20px", marginTop: "25px" }}>
            {(shopProducts[selectedShop] || []).length === 0 ? (
              <p style={{ color: "#cbd5e1" }}>Duka hili halina bidhaa kwa sasa.</p>
            ) : (
              (shopProducts[selectedShop] || []).map(product => (
                <div key={product.id} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "22px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div onClick={() => { setSelectedProduct(product); setPage("productDetails"); }} style={{ height: "180px", background: "linear-gradient(135deg,#38bdf8,#8b5cf6,#ec4899)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "60px", cursor: "pointer" }}>📦</div>
                  <div style={{ padding: "18px" }}>
                    <h3>{product.name}</h3>
                    <p style={{ color: "#38bdf8" }}>{product.price}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS */}
      {page === "productDetails" && selectedProduct && (
        <div style={{ padding: "30px 20px" }}>
          <button onClick={() => setPage("shopProfile")} style={{ padding: "10px 15px", borderRadius: "10px", border: "none", marginBottom: "20px", cursor: "pointer" }}>⬅ Back</button>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "24px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ height: "320px", background: "linear-gradient(135deg,#38bdf8,#8b5cf6,#ec4899)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "100px" }}>📦</div>
            <div style={{ padding: "25px" }}>
              <h1>{selectedProduct.name}</h1>
              <h2 style={{ color: "#38bdf8", marginTop: "10px" }}>{selectedProduct.price}</h2>
              <p style={{ color: "#cbd5e1", marginTop: "15px" }}>{selectedProduct.description}</p>
              
              <div style={{ display: "flex", gap: "15px", marginTop: "25px" }}>
                <button onClick={addToCart} style={{ flex: 1, padding: "14px", border: "1px solid #3b82f6", borderRadius: "14px", background: "transparent", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                  Weka kwenye Cart 🛒
                </button>
                
                {/* MFUMO WA WHATSAPP CLICK */}
                <button 
                  onClick={() => handleWhatsAppOrder(selectedShop)}
                  style={{ flex: 2, padding: "14px", border: "none", borderRadius: "14px", background: "linear-gradient(to right,#22c55e,#16a34a)", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "16px" }}
                >
                  Agiza kwa WhatsApp 📱
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART PAGE */}
      {page === "cart" && (
        <div style={{ padding: "30px 20px" }}>
          <h1 style={{ fontSize: "45px", background: "linear-gradient(to right,#38bdf8,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Your Cart 🛒</h1>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "25px", marginTop: "30px" }}>
            <div>
              {cart.length === 0 ? <div style={{ background: "rgba(255,255,255,0.08)", padding: "30px", borderRadius: "22px" }}>Cart is empty.</div> : 
                cart.map((item, index) => (
                  <div key={index} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "22px", padding: "18px", marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h3>{item.name}</h3>
                      <p style={{ color: "#38bdf8" }}>{item.price}</p>
                      <p style={{ color: "#cbd5e1", fontSize: "14px" }}>🏪 {item.shop}</p>
                    </div>
                    <div style={{ width: "90px", height: "90px", borderRadius: "18px", background: "linear-gradient(135deg,#38bdf8,#8b5cf6,#ec4899)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "35px" }}>📦</div>
                  </div>
                ))
              }
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", padding: "25px", borderRadius: "24px", height: "fit-content" }}>
              <h2>Delivery Options 🚚</h2>
              <div onClick={() => setDeliveryType("horizon")} style={{ marginTop: "20px", padding: "18px", borderRadius: "18px", cursor: "pointer", border: deliveryType === "horizon" ? "2px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
                <h3>🚚 Horizon Delivery</h3>
              </div>
              <div style={{ marginTop: "30px" }}>
                <div style={{ display: "flex", justify0Content: "space-between", justifyContent: "space-between" }}><span>Products</span><span>Tsh {totalPrice.toLocaleString()}</span></div>
                <div style={{ display: "flex", justify0Content: "space-between", justifyContent: "space-between", marginTop: "20px", fontSize: "22px", fontWeight: "bold" }}><span>Total</span><span>Tsh {finalTotal.toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DASHBOARD YA MUUZA DUKA ILIYOBORESHWA --- */}
      {page === "dashboard" && (
        <div style={{ padding: "30px 20px", maxWidth: "1200px", margin: "0 auto" }}>
          
          {/* HEADER */}
          <div style={{ marginBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "20px" }}>
            <h1 style={{ fontSize: "38px", background: "linear-gradient(to right,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 10px 0" }}>
              Kibarua Chako Leo 📊
            </h1>
            <p style={{ color: "#94a3b8", margin: 0, fontSize: "16px" }}>
              Simamia bidhaa zako na uone wateja wanaobonyeza kuja WhatsApp kwako.
            </p>
          </div>

          {/* 1. SEHEMU YA ANALYTIKI (ANALYTICS & SUMMARY) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
            {/* ANALYTIKI YA WHATSAPP YA WIKI HII */}
            <div style={{ background: "rgba(34,197,94,0.1)", padding: "25px", borderRadius: "20px", border: "1px solid rgba(34,197,94,0.2)" }}>
              <span style={{ fontSize: "14px", color: "#4ade80", fontWeight: "bold" }}>📱 ODA ZA WHATSAPP (WIKI HII)</span>
              <h2 style={{ fontSize: "36px", margin: "10px 0 0 0", color: "#22c55e" }}>
                {Object.values(whatsappClicks).reduce((acc, curr) => acc + curr, 0)} Clicks
              </h2>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Idadi ya wateja waliotaka kununua dukani</span>
            </div>

            {/* JUMLA YA BIDHAA ZILIZOPO */}
            <div style={{ background: "rgba(56,189,248,0.1)", padding: "25px", borderRadius: "20px", border: "1px solid rgba(56,189,248,0.2)" }}>
              <span style={{ fontSize: "14px", color: "#38bdf8", fontWeight: "bold" }}>📦 BIDHAA ZILIZOPO</span>
              <h2 style={{ fontSize: "36px", margin: "10px 0 0 0", color: "#0ea5e9" }}>
                {Object.values(shopProducts).reduce((acc, curr) => acc + curr.length, 0)} Items
              </h2>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>Bidhaa zote zipo hewani live</span>
            </div>
          </div>

          {/* 2. MAIN SECTION: FOMU NA ORODHA */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "30px", alignItems: "start" }}>
            
            {/* FOMU YA KUPOST / KUREDIT */}
            <div style={{ background: "rgba(30,41,59,0.7)", padding: "30px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
              {editingProduct ? (
                <form onSubmit={handleUpdateProduct}>
                  <h3 style={{ margin: "0 0 20px 0", color: "#fbbf24" }}>✏️ Badilisha Sifa za Bidhaa</h3>
                  
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#cbd5e1" }}>Jina la Bidhaa</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "white", outline: "none" }}
                    />
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#cbd5e1" }}>Bei (Tsh)</label>
                    <input
                      type="text"
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                      style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "white", outline: "none" }}
                    />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#cbd5e1" }}>Maelezo</label>
                    <textarea
                      rows="3"
                      value={editingProduct.description}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                      style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "white", outline: "none", fontFamily: "Arial", resize: "none" }}
                    ></textarea>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" style={{ flex: 1, padding: "14px", border: "none", borderRadius: "12px", background: "linear-gradient(to right, #f59e0b, #ea580c)", color: "white", fontWeight: "bold", cursor: "pointer" }}>
                      Hifadhi 💾
                    </button>
                    <button type="button" onClick={() => setEditingProduct(null)} style={{ padding: "14px", border: "none", borderRadius: "12px", background: "rgba(255,255,255,0.1)", color: "white", cursor: "pointer" }}>
                      Ghairi
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAddProduct}>
                  <h3 style={{ margin: "0 0 20px 0", color: "#38bdf8" }}>✨ Ongeza Bidhaa Mpya</h3>

                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#cbd5e1" }}>Chagua Duka</label>
                    <select
                      value={newProduct.shop}
                      onChange={(e) => setNewProduct({ ...newProduct, shop: e.target.value })}
                      style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "white", outline: "none", cursor: "pointer" }}
                    >
                      {shops.map((shop, index) => (
                        <option key={index} value={shop}>{shop}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#cbd5e1" }}>Jina la Bidhaa</label>
                    <input
                      type="text"
                      placeholder="Mfano: Smart Watch Series 9"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "white", outline: "none" }}
                    />
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#cbd5e1" }}>Bei (Tsh)</label>
                    <input
                      type="text"
                      placeholder="Mfano: 85,000"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "white", outline: "none" }}
                    />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", color: "#cbd5e1" }}>Maelezo/Sifa</label>
                    <textarea
                      rows="2"
                      placeholder="Inakaa na chaji siku 3..."
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#0f172a", color: "white", outline: "none", fontFamily: "Arial", resize: "none" }}
                    ></textarea>
                  </div>

                  <button type="submit" style={{ width: "100%", padding: "15px", border: "none", borderRadius: "12px", background: "linear-gradient(to right, #3b82f6, #8b5cf6)", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "16px" }}>
                    Ruhusu Ionekane Sokoni 🚀
                  </button>
                </form>
              )}
            </div>

            {/* ORODHA YA BIDHAA NA ANALYTIKI YA MAREKODI */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "25px", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 style={{ margin: "0 0 20px 0" }}>📦 Bidhaa Zako na Clicks za Wiki</h3>

              {Object.keys(shopProducts).map((shopName) => (
                <div key={shopName} style={{ marginBottom: "25px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "5px", marginBottom: "12px" }}>
                    <h4 style={{ color: "#38bdf8", margin: 0 }}>🏪 {shopName}</h4>
                    <span style={{ fontSize: "12px", color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "2px 8px", borderRadius: "10px" }}>
                      {whatsappClicks[shopName] || 0} wa-Agiza leo
                    </span>
                  </div>

                  {shopProducts[shopName].length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "14px", fontStyle: "italic", margin: "0 0 10px 0" }}>Duka halina bidhaa bado.</p>
                  ) : (
                    shopProducts[shopName].map((product) => (
                      <div key={product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e293b", padding: "12px 16px", borderRadius: "16px", marginBottom: "10px" }}>
                        <div>
                          <strong style={{ display: "block", color: "white" }}>{product.name}</strong>
                          <span style={{ color: "#4ade80", fontSize: "14px" }}>{product.price}</span>
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => startEdit(product, shopName)} style={{ padding: "6px 12px", border: "none", borderRadius: "8px", background: "rgba(245,158,11,0.2)", color: "#fbbf24", cursor: "pointer", fontWeight: "bold" }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => handleDeleteProduct(shopName, product.id)} style={{ padding: "6px 12px", border: "none", borderRadius: "8px", background: "rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer", fontWeight: "bold" }}>
                            🗑️ Futa
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>

          </div>

          {/* 3. SEHEMU YA SUPPORT MY WORK (UCHANGIAJI) */}
          <div
            style={{
              marginTop: "50px",
              background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15))",
              padding: "30px",
              borderRadius: "24px",
              border: "1px solid rgba(255,255,255,0.1)",
              textAlign: "center"
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "22px", color: "#f472b6" }}>❤️ Unapenda Mfumo Huu? Support My Work</h3>
            <p style={{ maxWidth: "700px", margin: "0 auto 20px auto", color: "#cbd5e1", lineHeight: "1.6", fontSize: "15px" }}>
              Mfumo huu umetengenezwa kuwa **Bure 100%** kwa ajili ya kusaidia wafanyabiashara wote kukua mtandaoni. 
              Kama umependezwa na unatamani kuchangia chochote (soda au bando) ili kuendeleza maboresho haya, unaweza kutuma kupitia namba zifuatazo:
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", fontWeight: "bold" }}>
              <div style={{ background: "rgba(255,255,255,0.05)", padding: "12px 25px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.05)" }}>
                📱 TIGO PESA / M-PESA: <span style={{ color: "#38bdf8" }}>07XX XXX XXX</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", padding: "12px 25px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.05)" }}>
                👤 Jina: <span style={{ color: "#ec4899" }}>JINA LAKO HAPA</span>
              </div>
            </div>
            <p style={{ margin: "15px 0 0 0", fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
              Asante sana kwa upendo na kuunga mkono kazi za bure! 🙏✨
            </p>
          </div>

        </div>
      )}
    </div>
  )
}