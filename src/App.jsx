import { useState, useEffect } from "react"
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ""
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Supabase connection failed: missing env variables")
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const ADMIN_EMAIL = "alitronicdeveloper@gmail.com"
const ADMIN_PASSWORD = "***a12l05l2004y###"

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return isMobile
}

export default function App() {
  const [page, setPage] = useState("home")
  const [selectedShop, setSelectedShop] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [dbProducts, setDbProducts] = useState([])
  const [dbShops, setDbShops] = useState([]) // Shops from Supabase
  const [dbLeads, setDbLeads] = useState([]) // Leads from Supabase
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isMobile = useIsMobile()

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("horaizon_cart")
    return savedCart ? JSON.parse(savedCart) : []
  })

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loggedInShop, setLoggedInShop] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [loginShopName, setLoginShopName] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginAdminPassword, setLoginAdminPassword] = useState("")

  const isAdminMode = window.location.hash === '#admin'

  const [editingProduct, setEditingProduct] = useState(null)
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", image: "", shop: "Kariakoo Electronics" })
  const [adminNewProduct, setAdminNewProduct] = useState({ name: "", price: "", description: "", image: "", shop: "Kariakoo Electronics" })

  const [shopStats, setShopStats] = useState({ totalViews: 0, whatsappClicks: 0, cartAdditions: 0, totalProducts: 0 })
  const [adminStats, setAdminStats] = useState({ totalShops: 0, totalProducts: 0, totalViews: 0, totalWhatsappClicks: 0, totalCartAdditions: 0, totalLeads: 0 })
  
  const [editingShopProfile, setEditingShopProfile] = useState(false)
  const [shopProfileData, setShopProfileData] = useState(null)
  const [editingShop, setEditingShop] = useState(null)
  const [addingNewShop, setAddingNewShop] = useState(false)
  const [newShopData, setNewShopData] = useState({
    name: "", logo: "🏪", category: "", description: "", location: "", phone: "", email: "",
    working_hours: "Jumatatu - Jumamosi: 8:00 AM - 6:00 PM", rating: "4.0", password: ""
  })
  const [adminTab, setAdminTab] = useState("overview")

  const shopWhatsAppNumbers = {
    "Kariakoo Electronics": "255712345678", "Tech Zone": "255787112233", "Mlimani Fashion": "255765443322",
    "Smart Devices": "255654112233", "Dar Furniture": "255711001122"
  }

  const [, setAvailableImages] = useState([])

  // ============ FETCH ALL DATA FROM SUPABASE ============
  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*')
    if (error) console.error("Error fetching products:", error.message)
    else setDbProducts(data || [])
  }

  const fetchShops = async () => {
    const { data, error } = await supabase.from('shops').select('*')
    if (error) console.error("Error fetching shops:", error.message)
    else setDbShops(data || [])
  }

  const fetchLeads = async () => {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (error) console.error("Error fetching leads:", error.message)
    else setDbLeads(data || [])
  }

  const fetchAnalytics = async () => {
    // Analytics zinatrackiwa kwenye Supabase
    const { data, error } = await supabase.from('analytics').select('*')
    if (error) console.error("Error fetching analytics:", error.message)
    return data || []
  }

  const fetchSupabaseImages = async () => {
    try {
      const { data, error } = await supabase.storage.from('products-images').list()
      if (error) return
      setAvailableImages(data.map(file => {
        const { data: urlData } = supabase.storage.from('products-images').getPublicUrl(file.name)
        return { name: file.name, url: urlData?.publicUrl || "" }
      }))
    } catch {}
  }

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchProducts(), fetchShops(), fetchLeads(), fetchSupabaseImages()])
    }
    loadData()
  }, [])

  // Refresh data when needed
  const refreshAllData = async () => {
    await Promise.all([fetchProducts(), fetchShops(), fetchLeads()])
  }

  // Calculate admin stats from Supabase data
  const calculateAdminStats = async () => {
    const analyticsData = await fetchAnalytics()
    const totalViews = analyticsData.filter(a => a.action_type === 'view').length
    const totalWhatsapp = analyticsData.filter(a => a.action_type === 'whatsapp_click').length
    const totalCart = analyticsData.filter(a => a.action_type === 'cart_add').length
    
    return {
      totalShops: dbShops.length,
      totalProducts: dbProducts.length,
      totalViews,
      totalWhatsappClicks: totalWhatsapp,
      totalCartAdditions: totalCart,
      totalLeads: dbLeads.length
    }
  }

  useEffect(() => {
    if (isAdmin) {
      calculateAdminStats().then(stats => setAdminStats(stats))
    }
  }, [isAdmin, dbShops, dbProducts, dbLeads])

  // ============ TRACKING FUNCTIONS (SUPABASE) ============
  const trackProductView = async (product) => {
    await supabase.from('analytics').insert([{
      shop_name: product.shop,
      product_id: product.id,
      action_type: 'view'
    }])
  }

  const trackWhatsAppClick = async (shopName) => {
    await supabase.from('analytics').insert([{
      shop_name: shopName,
      action_type: 'whatsapp_click'
    }])
  }

  const trackCartAddition = async (product) => {
    await supabase.from('analytics').insert([{
      shop_name: product.shop,
      product_id: product.id,
      action_type: 'cart_add'
    }])
  }

  // ============ LEAD TRACKING (SUPABASE) ============
  const trackLead = async (productName, shopName, customerAction) => {
    const { error } = await supabase.from('leads').insert([{
      product_name: productName,
      shop_name: shopName,
      customer_action: customerAction,
      status: 'New'
    }])
    if (!error) fetchLeads()
  }

  const updateLeadStatus = async (leadId, newStatus) => {
    const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId)
    if (!error) fetchLeads()
  }

  const handleDeleteLead = async (leadId) => {
    if (confirm("Futa lead hii?")) {
      await supabase.from('leads').delete().eq('id', leadId)
      fetchLeads()
    }
  }

  // Calculate shop stats from Supabase analytics
  const calculateShopStats = async (shopName) => {
    const analyticsData = await fetchAnalytics()
    const shopAnalytics = analyticsData.filter(a => a.shop_name === shopName)
    const shopProducts = dbProducts.filter(p => p.shop === shopName)
    
    return {
      totalViews: shopAnalytics.filter(a => a.action_type === 'view').length,
      whatsappClicks: shopAnalytics.filter(a => a.action_type === 'whatsapp_click').length,
      cartAdditions: shopAnalytics.filter(a => a.action_type === 'cart_add').length,
      totalProducts: shopProducts.length
    }
  }

  useEffect(() => { localStorage.setItem("horaizon_cart", JSON.stringify(cart)) }, [cart])

  const handleImageUpload = async (file, isEditMode = false, isAdminModeLocal = false) => {
    if (!file) return
    const fileName = `${Date.now()}-${file.name}`
    try {
      try { await supabase.storage.createBucket('products-images', { public: true }) } catch {}
      const { error: uploadError } = await supabase.storage.from('products-images').upload(fileName, file)
      if (uploadError) { alert("Kushindwa kuupload: " + uploadError.message); return }
      const { data: urlData } = supabase.storage.from('products-images').getPublicUrl(fileName)
      const imageUrl = urlData?.publicUrl
      if (isAdminModeLocal) setAdminNewProduct({ ...adminNewProduct, image: imageUrl })
      else if (isEditMode) setEditingProduct({ ...editingProduct, image: imageUrl })
      else setNewProduct({ ...newProduct, image: imageUrl })
      alert("Picha imeupload! ✅")
    } catch (error) { alert("Kosa: " + error.message) }
  }

  const filteredProducts = dbProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.shop.toLowerCase().includes(searchQuery.toLowerCase()))

  const addToCart = () => {
    if (!selectedProduct) return
    const shop = selectedShop?.name || selectedProduct.shop || "Horaizon Main Store"
    const np = typeof selectedProduct.price === 'number' ? selectedProduct.price : Number(String(selectedProduct.price).replace(/[^0-9]/g, ""))
    setCart(prev => { const ex = prev.find(i => i.id === selectedProduct.id); return ex ? prev.map(i => i.id === selectedProduct.id ? {...i, quantity: i.quantity+1} : i) : [...prev, {...selectedProduct, price: np, quantity: 1, shop}] })
    trackCartAddition(selectedProduct)
    alert("Imewekwa Cart! 🛒")
  }

  const addToCartDirect = (product, shopName) => {
    const np = typeof product.price === 'number' ? product.price : Number(String(product.price).replace(/[^0-9]/g, ""))
    setCart(prev => { const ex = prev.find(i => i.id === product.id); return ex ? prev.map(i => i.id === product.id ? {...i, quantity: i.quantity+1} : i) : [...prev, {...product, price: np, quantity: 1, shop: shopName}] })
    trackCartAddition(product)
    alert("Imewekwa Cart! 🛒")
  }

  const updateQuantity = (id, amount) => { setCart(prev => prev.map(i => i.id === id ? {...i, quantity: i.quantity+amount} : i).filter(i => i.quantity > 0)) }
  const cartGroupedByShop = cart.reduce((g, i) => { const s = i.shop || "Unknown"; if (!g[s]) g[s] = []; g[s].push(i); return g }, {})

  const handleWhatsAppOrder = (shopName, product) => {
    trackWhatsAppClick(shopName); trackLead(product.name, shopName, "WhatsApp Order")
    const phone = shopWhatsAppNumbers[shopName] || "255700000000"
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Habari ${shopName}, nataka ${product.name} - ${typeof product.price === 'number' ? `Tsh ${product.price.toLocaleString()}` : product.price}\nKupitia Horaizon Marketplace.`)}`, "_blank")
  }

  const handleShopCheckoutWhatsApp = (shopName, items) => {
    trackWhatsAppClick(shopName); items.forEach(i => trackLead(i.name, shopName, "Cart Checkout"))
    const phone = shopWhatsAppNumbers[shopName] || "255700000000"
    let txt = "", total = 0
    items.forEach((i, idx) => { const st = i.price*i.quantity; total += st; txt += `${idx+1}. ${i.name} (X${i.quantity}) - Tsh ${st.toLocaleString()}\n` })
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`🚀 ODA MPYA HORAIZON\n\n${txt}\n💰 Jumla: Tsh ${total.toLocaleString()}`)}`, "_blank")
  }

  const handleShopSelect = (sn) => { setLoginShopName(sn); const s = dbShops.find(sh => sh.name === sn); setLoginPassword(s ? s.password : "") }

  const handleAdminLogin = (e) => {
    e.preventDefault(); setLoginError("")
    if (!loginEmail || !loginAdminPassword) { setLoginError("Jaza email na password!"); return }
    if (loginEmail === ADMIN_EMAIL && loginAdminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true); setIsLoggedIn(true); setLoginEmail(""); setLoginAdminPassword(""); setPage("dashboard")
      calculateAdminStats().then(stats => setAdminStats(stats))
    } else setLoginError("Email au password si sahihi!")
  }

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError("")
    if (!loginShopName || !loginPassword) { setLoginError("Chagua duka na password!"); return }
    const shop = dbShops.find(s => s.name === loginShopName)
    if (!shop) { setLoginError("Duka halijapatikana!"); return }
    if (shop.password !== loginPassword) { setLoginError("Password si sahihi!"); return }
    setIsLoggedIn(true); setIsAdmin(false); setLoggedInShop(shop)
    const stats = await calculateShopStats(shop.name)
    setShopStats(stats)
    setLoginShopName(""); setLoginPassword("")
    alert(`Karibu ${shop.name}! 👋`)
  }

  const handleLogout = () => {
    setIsLoggedIn(false); setLoggedInShop(null); setIsAdmin(false)
    setShopStats({ totalViews: 0, whatsappClicks: 0, cartAdditions: 0, totalProducts: 0 })
    setLoginError(""); setAdminTab("overview"); setPage("home"); setMobileMenuOpen(false)
  }

  // Admin: Add shop to Supabase
  const handleAddShop = async (e) => {
    e.preventDefault()
    if (!newShopData.name || !newShopData.password) { alert("Jaza jina na password!"); return }
    const { error } = await supabase.from('shops').insert([newShopData])
    if (error) { alert("Imefeli: " + error.message); return }
    setAddingNewShop(false)
    setNewShopData({ name: "", logo: "🏪", category: "", description: "", location: "", phone: "", email: "", working_hours: "Jumatatu - Jumamosi: 8:00 AM - 6:00 PM", rating: "4.0", password: "" })
    fetchShops()
    alert("Duka limeongezwa! 🏪")
  }

  // Admin: Update shop
  const handleUpdateShop = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('shops').update(editingShop).eq('id', editingShop.id)
    if (error) { alert("Imefeli: " + error.message); return }
    setEditingShop(null)
    fetchShops()
    alert("Taarifa zimehifadhiwa! 💾")
  }

  // Admin: Delete shop
  const handleDeleteShop = async (shopId, shopName) => {
    if (confirm(`Futa "${shopName}"?`)) {
      await supabase.from('shops').delete().eq('id', shopId)
      await supabase.from('products').delete().eq('shop', shopName)
      fetchShops(); fetchProducts()
      alert(`"${shopName}" limefutwa! 🗑️`)
    }
  }

  const startEdit = (p) => setEditingProduct(p)

  const handleAdminPostProduct = async (e) => {
    e.preventDefault()
    if (!adminNewProduct.name || !adminNewProduct.price) { alert("Jaza jina na bei!"); return }
    const product = { name: adminNewProduct.name, price: adminNewProduct.price.startsWith("Tsh") ? adminNewProduct.price : `Tsh ${adminNewProduct.price}`, description: adminNewProduct.description || "Hakuna maelezo.", image: adminNewProduct.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500", shop: adminNewProduct.shop }
    const { error } = await supabase.from('products').insert([product])
    if (error) alert("Imefeli: " + error.message)
    else { alert("Bidhaa imewekwa! 🚀"); setAdminNewProduct({ name: "", price: "", description: "", image: "", shop: adminNewProduct.shop }); fetchProducts() }
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.price) { alert("Jaza jina na bei!"); return }
    const product = { name: newProduct.name, price: newProduct.price.startsWith("Tsh") ? newProduct.price : `Tsh ${newProduct.price}`, description: newProduct.description || "Hakuna maelezo.", image: newProduct.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500", shop: newProduct.shop }
    const { error } = await supabase.from('products').insert([product])
    if (error) alert("Imefeli: " + error.message)
    else { 
      alert("Bidhaa imewekwa! 🚀"); 
      setNewProduct({ name: "", price: "", description: "", image: "", shop: loggedInShop ? loggedInShop.name : newProduct.shop }); 
      fetchProducts()
      if (loggedInShop) {
        const stats = await calculateShopStats(loggedInShop.name)
        setShopStats(stats)
      }
    }
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    const { id, name, price, description, image, shop } = editingProduct
    const { error } = await supabase.from('products').update({ name, price: String(price).startsWith("Tsh") ? price : `Tsh ${price}`, description, image, shop }).eq('id', id)
    if (error) alert("Imefeli: " + error.message)
    else { alert("Mabadiliko yamehifadhiwa! 💾"); setEditingProduct(null); fetchProducts() }
  }

  const handleDeleteProduct = async (pid) => {
    if (confirm("Futa bidhaa hii?")) {
      const { error } = await supabase.from('products').delete().eq('id', pid)
      if (error) alert("Imefeli: " + error.message)
      else { alert("Bidhaa imefutwa! 🗑️"); fetchProducts() }
    }
  }

  const getShopLeads = (sn) => dbLeads.filter(l => l.shop_name === sn)

  // Styles
  const navLinkStyle = (p) => ({ cursor: "pointer", color: page === p ? "#38bdf8" : "white", fontSize: isMobile ? "14px" : "16px", whiteSpace: "nowrap" })
  const cardGridStyle = { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginTop: "20px" }
  const shopCardGridStyle = { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(350px, 1fr))", gap: "25px" }
  const inputStyle = { width: "100%", padding: isMobile ? "14px" : "12px", borderRadius: "12px", background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.1)", fontSize: isMobile ? "16px" : "14px" }
  const btnStyle = (bg, color = "white") => ({ padding: isMobile ? "14px 18px" : "12px 20px", borderRadius: "12px", background: bg, color, border: "none", fontWeight: "bold", cursor: "pointer", fontSize: isMobile ? "15px" : "14px", width: "100%" })
  const navigateTo = (p) => { setPage(p); setMobileMenuOpen(false) }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg,#0f172a,#111827,#1e293b)", color: "white", fontFamily: "Arial, sans-serif" }}>
      {/* NAVBAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "14px 15px" : "18px 25px", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 1000, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <h2 onClick={() => navigateTo("home")} style={{ margin: 0, cursor: "pointer", background: "linear-gradient(to right,#38bdf8,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: isMobile ? "22px" : "24px" }}>Horaizon</h2>
        {isMobile && <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: "none", border: "none", color: "white", fontSize: "28px", cursor: "pointer", padding: "5px" }}>{mobileMenuOpen ? "✕" : "☰"}</button>}
        {!isMobile && (
          <div style={{ display: "flex", gap: "20px", alignItems: "center", fontWeight: "bold" }}>
            <span onClick={() => navigateTo("home")} style={navLinkStyle("home")}>🏠 Home</span>
            <span onClick={() => navigateTo("shops")} style={navLinkStyle("shops")}>🏪 Shops</span>
            <span onClick={() => navigateTo("cart")} style={navLinkStyle("cart")}>🛒 Cart ({cart.reduce((a,b) => a+b.quantity, 0)})</span>
            <span onClick={() => navigateTo("dashboard")} style={navLinkStyle("dashboard")}>📊 Dashboard</span>
            {isLoggedIn && <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Logout</button>}
          </div>
        )}
      </div>
      {isMobile && mobileMenuOpen && (
        <div style={{ background: "rgba(15,23,42,0.98)", padding: "20px", display: "flex", flexDirection: "column", gap: "18px", borderBottom: "1px solid rgba(255,255,255,0.1)", position: "sticky", top: "57px", zIndex: 999 }}>
          <span onClick={() => navigateTo("home")} style={navLinkStyle("home")}>🏠 Home</span>
          <span onClick={() => navigateTo("shops")} style={navLinkStyle("shops")}>🏪 Shops</span>
          <span onClick={() => navigateTo("cart")} style={navLinkStyle("cart")}>🛒 Cart ({cart.reduce((a,b) => a+b.quantity, 0)})</span>
          <span onClick={() => navigateTo("dashboard")} style={navLinkStyle("dashboard")}>📊 Dashboard</span>
          {isLoggedIn && <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.3)", color: "#f87171", border: "none", padding: "12px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" }}>🚪 Logout</button>}
        </div>
      )}
      {/* ============ DESKTOP NAVBAR (Juu) ============ */}
{!isMobile && (
  <div style={{ 
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
  }}>
    <h2 onClick={() => navigateTo("home")} style={{ 
      margin: 0, 
      cursor: "pointer", 
      background: "linear-gradient(to right,#38bdf8,#8b5cf6)", 
      WebkitBackgroundClip: "text", 
      WebkitTextFillColor: "transparent", 
      fontSize: "24px" 
    }}>
      Horaizon
    </h2>
    <div style={{ display: "flex", gap: "20px", alignItems: "center", fontWeight: "bold" }}>
      <span onClick={() => navigateTo("home")} style={navLinkStyle("home")}>🏠 Home</span>
      <span onClick={() => navigateTo("shops")} style={navLinkStyle("shops")}>🏪 Shops</span>
      <span onClick={() => navigateTo("cart")} style={navLinkStyle("cart")}>🛒 Cart ({cart.reduce((a,b) => a+b.quantity, 0)})</span>
      <span onClick={() => navigateTo("dashboard")} style={navLinkStyle("dashboard")}>📊 Dashboard</span>
      {isLoggedIn && (
        <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
          Logout
        </button>
      )}
    </div>
  </div>
)}

{/* ============ MAIN CONTENT (with padding for bottom nav) ============ */}
<div style={{ paddingBottom: isMobile ? "80px" : "0px" }}>
  {/* All page content goes here */}
  {/* HOME, SHOPS, CART, DASHBOARD, etc. */}
</div>

{/* ============ MOBILE BOTTOM NAVIGATION BAR (Chini) ============ */}
{isMobile && (
  <div style={{
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "rgba(15,23,42,0.95)",
    backdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    padding: "10px 5px 20px 5px",
    zIndex: 1000,
    boxShadow: "0 -5px 25px rgba(0,0,0,0.5)"
  }}>
    {/* Home */}
    <div onClick={() => navigateTo("home")} style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      cursor: "pointer",
      color: page === "home" ? "#38bdf8" : "#94a3b8",
      gap: "4px",
      transition: "all 0.2s"
    }}>
      <span style={{ fontSize: "22px" }}>{page === "home" ? "🏠" : "🏠"}</span>
      <span style={{ fontSize: "10px", fontWeight: page === "home" ? "bold" : "normal" }}>Home</span>
      {page === "home" && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#38bdf8" }} />}
    </div>

    {/* Shops */}
    <div onClick={() => navigateTo("shops")} style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      cursor: "pointer",
      color: page === "shops" ? "#38bdf8" : "#94a3b8",
      gap: "4px",
      transition: "all 0.2s"
    }}>
      <span style={{ fontSize: "22px" }}>🏪</span>
      <span style={{ fontSize: "10px", fontWeight: page === "shops" ? "bold" : "normal" }}>Shops</span>
      {page === "shops" && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#38bdf8" }} />}
    </div>

    {/* Cart */}
    <div onClick={() => navigateTo("cart")} style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      cursor: "pointer",
      color: page === "cart" ? "#38bdf8" : "#94a3b8",
      gap: "4px",
      position: "relative",
      transition: "all 0.2s"
    }}>
      <span style={{ fontSize: "22px" }}>🛒</span>
      {cart.reduce((a,b) => a+b.quantity, 0) > 0 && (
        <span style={{
          position: "absolute",
          top: "0px",
          right: "calc(50% - 18px)",
          background: "#ef4444",
          color: "white",
          fontSize: "10px",
          fontWeight: "bold",
          minWidth: "18px",
          height: "18px",
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "2px"
        }}>
          {cart.reduce((a,b) => a+b.quantity, 0)}
        </span>
      )}
      <span style={{ fontSize: "10px", fontWeight: page === "cart" ? "bold" : "normal" }}>Cart</span>
      {page === "cart" && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#38bdf8" }} />}
    </div>

    {/* Dashboard */}
    <div onClick={() => navigateTo("dashboard")} style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      cursor: "pointer",
      color: page === "dashboard" ? "#a855f7" : "#94a3b8",
      gap: "4px",
      transition: "all 0.2s"
    }}>
      <span style={{ fontSize: "22px" }}>📊</span>
      <span style={{ fontSize: "10px", fontWeight: page === "dashboard" ? "bold" : "normal" }}>Dashboard</span>
      {page === "dashboard" && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#a855f7" }} />}
    </div>
  </div>
)}

      {/* HOME PAGE */}
      {page === "home" && (
        <>
          <div style={{ padding: isMobile ? "40px 15px" : "70px 20px", textAlign: "center" }}>
            <h1 style={{ fontSize: isMobile ? "30px" : "55px", marginBottom: "10px", background: "linear-gradient(to right,#60a5fa,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Horaizon Marketplace</h1>
            <p style={{ color: "#cbd5e1", fontSize: isMobile ? "14px" : "18px" }}>Discover trending products from trusted sellers.</p>
            <div style={{ marginTop: isMobile ? "20px" : "30px", display: "flex", justifyContent: "center", padding: "0 10px" }}>
              <input type="text" placeholder="Tafuta bidhaa au duka..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", maxWidth: "650px", padding: isMobile ? "14px" : "16px", borderRadius: "50px", border: "none", outline: "none", fontSize: "16px", background: "rgba(255,255,255,0.1)", color: "white", boxShadow: "0 0 20px rgba(59,130,246,0.3)" }} />
            </div>
          </div>

          {searchQuery === "" && (
            <div style={{ padding: isMobile ? "0 15px" : "0 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                <h2 style={{ fontSize: isMobile ? "18px" : "22px" }}>🔥 Popular Shops</h2>
                <button onClick={() => navigateTo("shops")} style={btnStyle("linear-gradient(to right,#06b6d4,#3b82f6)")}>View All Shops →</button>
              </div>
              <div style={{ display: "flex", gap: "15px", overflowX: "auto", paddingBottom: "10px" }}>
                {dbShops.slice(0, 5).map((shop, index) => (
                  <div key={index} onClick={() => { setSelectedShop(shop); navigateTo("shopProfile") }} style={{ minWidth: isMobile ? "200px" : "240px", padding: isMobile ? "18px" : "25px", borderRadius: "18px", background: "linear-gradient(135deg,#1e3a5f,#2d1b69)", boxShadow: "0 10px 25px rgba(0,0,0,0.4)", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ fontSize: "40px", marginBottom: "10px", textAlign: "center" }}>{shop.logo}</div>
                    <div style={{ fontWeight: "bold", fontSize: isMobile ? "14px" : "18px", marginBottom: "5px" }}>🏪 {shop.name}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>{shop.category}</div>
                    <div style={{ fontSize: "11px", color: "#fbbf24", marginTop: "5px" }}>⭐ {shop.rating} • {shop.location?.split(',')[0]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: isMobile ? "20px 15px" : "30px 20px" }}>
            <h2 style={{ fontSize: isMobile ? "18px" : "22px" }}>{searchQuery ? `Matokeo (${filteredProducts.length})` : "✨ Trending Products"}</h2>
            <div style={cardGridStyle}>
              {filteredProducts.map(product => (
                <div key={product.id} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "18px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ height: isMobile ? "180px" : "200px", overflow: "hidden" }}>
                    <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: isMobile ? "14px" : "18px" }}>
                    <span style={{ fontSize: "10px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "2px 8px", borderRadius: "20px", display: "inline-block", marginBottom: "8px" }}>🏪 {product.shop}</span>
                    <h3 style={{ marginBottom: "8px", fontSize: isMobile ? "16px" : "18px" }}>{product.name}</h3>
                    <p style={{ color: "#38bdf8", fontWeight: "bold", fontSize: isMobile ? "16px" : "18px" }}>{typeof product.price === 'number' ? `Tsh ${product.price.toLocaleString()}` : product.price}</p>
                    <button onClick={() => { setSelectedProduct(product); trackProductView(product); setSelectedShop(dbShops.find(s => s.name === product.shop)); navigateTo("productDetails") }} style={btnStyle("linear-gradient(to right,#3b82f6,#8b5cf6)")}>View Details 👀</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* SHOPS PAGE */}
      {page === "shops" && (
        <div style={{ padding: isMobile ? "20px 15px" : "30px 20px", maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ fontSize: isMobile ? "24px" : "32px", marginBottom: "10px" }}>Explore All Shops 🏪</h1>
          <p style={{ color: "#94a3b8", marginBottom: "25px", fontSize: isMobile ? "13px" : "14px" }}>Gundua maduka mbalimbali yenye bidhaa bora</p>
          <div style={shopCardGridStyle}>
            {dbShops.map((shop, index) => (
              <div key={index} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "20px", padding: isMobile ? "20px" : "30px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
                onClick={() => { setSelectedShop(shop); navigateTo("shopProfile") }}>
                <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
                  <div style={{ width: isMobile ? "55px" : "80px", height: isMobile ? "55px" : "80px", borderRadius: "16px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: isMobile ? "30px" : "40px" }}>{shop.logo}</div>
                  <div>
                    <h2 style={{ margin: "0 0 5px 0", fontSize: isMobile ? "16px" : "22px" }}>{shop.name}</h2>
                    <span style={{ fontSize: "11px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "3px 10px", borderRadius: "20px" }}>{shop.category}</span>
                  </div>
                </div>
                <p style={{ color: "#cbd5e1", fontSize: "13px", marginBottom: "15px" }}>{shop.description?.substring(0, 80)}...</p>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "15px" }}>⭐ {shop.rating} • 📍 {shop.location?.split(',')[0]}</div>
                <div style={{ background: "rgba(59,130,246,0.1)", padding: "8px 12px", borderRadius: "10px", marginBottom: "15px", fontSize: "13px" }}>📦 {dbProducts.filter(p => p.shop === shop.name).length} bidhaa available</div>
                <button style={btnStyle("linear-gradient(to right, #3b82f6, #8b5cf6)")}>Fungua Duka 🚀</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHOP PROFILE */}
      {page === "shopProfile" && selectedShop && (
        <div style={{ padding: isMobile ? "15px" : "30px 20px", maxWidth: "1200px", margin: "0 auto" }}>
          <button onClick={() => navigateTo("shops")} style={{ ...btnStyle("rgba(255,255,255,0.1)"), width: "auto", marginBottom: "20px" }}>⬅ Back</button>
          <div style={{ background: "linear-gradient(135deg, #1e3a5f, #2d1b69)", borderRadius: "20px", padding: isMobile ? "20px" : "40px", marginBottom: "25px" }}>
            <div style={{ display: "flex", gap: isMobile ? "15px" : "30px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: isMobile ? "70px" : "120px", height: isMobile ? "70px" : "120px", borderRadius: "20px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: isMobile ? "35px" : "60px" }}>{selectedShop.logo}</div>
              <div>
                <h1 style={{ fontSize: isMobile ? "22px" : "36px", margin: "0 0 5px 0" }}>{selectedShop.name}</h1>
                <span style={{ fontSize: "12px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "4px 12px", borderRadius: "20px" }}>{selectedShop.category}</span>
                <div style={{ fontSize: "13px", marginTop: "8px" }}>⭐ {selectedShop.rating} • 📦 {dbProducts.filter(p => p.shop === selectedShop.name).length} Products</div>
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "30px" }}>
            <div style={{ background: "rgba(255,255,255,0.08)", padding: "20px", borderRadius: "16px" }}>
              <h3 style={{ color: "#38bdf8", fontSize: "16px" }}>📝 Kuhusu Duka</h3>
              <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.6" }}>{selectedShop.description}</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", padding: "20px", borderRadius: "16px" }}>
              <h3 style={{ color: "#38bdf8", fontSize: "16px" }}>📞 Mawasiliano</h3>
              <div style={{ fontSize: "13px", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div>📍 {selectedShop.location}</div>
                <div>📱 {selectedShop.phone}</div>
                <div>📧 {selectedShop.email}</div>
                <div>🕐 {selectedShop.working_hours || selectedShop.workingHours}</div>
              </div>
              <button onClick={() => { trackWhatsAppClick(selectedShop.name); window.open(`https://wa.me/${shopWhatsAppNumbers[selectedShop.name] || selectedShop.phone || "255700000000"}?text=Habari ${selectedShop.name}`, "_blank") }} style={{ ...btnStyle("linear-gradient(to right, #22c55e, #16a34a)"), marginTop: "15px" }}>💬 WhatsApp</button>
            </div>
          </div>
          <h2 style={{ fontSize: isMobile ? "20px" : "24px", marginBottom: "15px" }}>📦 Bidhaa ({dbProducts.filter(p => p.shop === selectedShop.name).length})</h2>
          <div style={cardGridStyle}>
            {dbProducts.filter(p => p.shop === selectedShop.name).map(product => (
              <div key={product.id} style={{ background: "rgba(255,255,255,0.08)", borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ height: isMobile ? "160px" : "220px", overflow: "hidden", cursor: "pointer" }} onClick={() => { setSelectedProduct(product); trackProductView(product); navigateTo("productDetails") }}>
                  <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "15px" }}>
                  <h3 style={{ fontSize: isMobile ? "15px" : "18px" }}>{product.name}</h3>
                  <p style={{ color: "#38bdf8", fontWeight: "bold", fontSize: "16px" }}>{product.price}</p>
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <button onClick={() => { setSelectedProduct(product); trackProductView(product); navigateTo("productDetails") }} style={{ flex: 1, ...btnStyle("transparent"), border: "1px solid #3b82f6", padding: "10px" }}>👀</button>
                    <button onClick={() => addToCartDirect(product, selectedShop.name)} style={{ flex: 1, ...btnStyle("linear-gradient(to right, #3b82f6, #8b5cf6)"), padding: "10px" }}>🛒 Add</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS */}
      {page === "productDetails" && selectedProduct && (
        <div style={{ padding: isMobile ? "15px" : "30px 20px", maxWidth: "800px", margin: "0 auto" }}>
          <button onClick={() => navigateTo("home")} style={{ ...btnStyle("rgba(255,255,255,0.1)"), width: "auto", marginBottom: "20px" }}>⬅ Back</button>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "20px", overflow: "hidden" }}>
            <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: "100%", height: isMobile ? "250px" : "400px", objectFit: "cover" }} />
            <div style={{ padding: isMobile ? "18px" : "25px" }}>
              <span style={{ color: "#a855f7", fontSize: "13px" }}>🏪 {selectedShop?.name || selectedProduct.shop}</span>
              <h1 style={{ fontSize: isMobile ? "22px" : "28px", margin: "8px 0" }}>{selectedProduct.name}</h1>
              <h2 style={{ color: "#38bdf8", fontSize: isMobile ? "22px" : "28px" }}>{selectedProduct.price}</h2>
              <p style={{ color: "#cbd5e1", marginTop: "15px", fontSize: isMobile ? "14px" : "15px" }}>{selectedProduct.description}</p>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px", marginTop: "20px" }}>
                <button onClick={addToCart} style={{ ...btnStyle("transparent"), border: "1px solid #3b82f6" }}>🛒 Weka Cart</button>
                <button onClick={() => handleWhatsAppOrder(selectedShop?.name || selectedProduct.shop, selectedProduct)} style={btnStyle("linear-gradient(to right,#22c55e,#16a34a)")}>📱 Agiza WhatsApp</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART PAGE */}
      {page === "cart" && (
        <div style={{ padding: isMobile ? "15px" : "30px 20px", maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ fontSize: isMobile ? "22px" : "28px" }}>Your Cart 🛒</h1>
          {cart.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.08)", padding: "40px", borderRadius: "16px", marginTop: "20px", textAlign: "center" }}>Cart ni tupu. Tembelea maduka!</div>
          ) : (
            Object.keys(cartGroupedByShop).map((shopName) => {
              const items = cartGroupedByShop[shopName]
              const total = items.reduce((s, i) => s + (i.price * i.quantity), 0)
              return (
                <div key={shopName} style={{ background: "rgba(30,41,59,0.7)", padding: isMobile ? "15px" : "25px", borderRadius: "20px", marginBottom: "20px" }}>
                  <h2 style={{ borderBottom: "2px solid #38bdf8", paddingBottom: "10px", color: "#38bdf8", fontSize: isMobile ? "16px" : "18px" }}>🏪 {shopName}</h2>
                  {items.map((item) => (
                    <div key={item.id} style={{ background: "rgba(0,0,0,0.2)", borderRadius: "12px", padding: "12px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <img src={item.image} alt={item.name} style={{ width: "50px", height: "50px", borderRadius: "10px", objectFit: "cover" }} />
                        <div><h3 style={{ margin: "0 0 3px 0", fontSize: "14px" }}>{item.name}</h3><p style={{ margin: 0, color: "#cbd5e1", fontSize: "12px" }}>Tsh {item.price.toLocaleString()}</p></div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ width: "30px", height: "30px", borderRadius: "50%", border: "none", background: "#ef4444", color: "white", fontWeight: "bold", cursor: "pointer" }}>-</button>
                        <span style={{ fontWeight: "bold", fontSize: "15px" }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ width: "30px", height: "30px", borderRadius: "50%", border: "none", background: "#22c55e", color: "white", fontWeight: "bold", cursor: "pointer" }}>+</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "15px", flexWrap: "wrap", gap: "10px" }}>
                    <div><span style={{ color: "#94a3b8", fontSize: "13px" }}>Jumla: </span><strong style={{ fontSize: "18px", color: "#38bdf8" }}>Tsh {total.toLocaleString()}</strong></div>
                    <button onClick={() => handleShopCheckoutWhatsApp(shopName, items)} style={{ ...btnStyle("linear-gradient(to right, #22c55e, #16a34a)"), width: "auto" }}>Tuma Oda 📱</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* DASHBOARD */}
      {page === "dashboard" && (
        <div style={{ padding: isMobile ? "15px" : "30px 20px", maxWidth: "1400px", margin: "0 auto" }}>
          {!isLoggedIn ? (
            <div style={{ maxWidth: "500px", margin: isMobile ? "30px auto" : "60px auto" }}>
              <div style={{ background: "rgba(30,41,59,0.9)", padding: isMobile ? "25px" : "40px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ textAlign: "center", marginBottom: "25px" }}>
                  <div style={{ fontSize: "40px" }}>🔐</div>
                  <h2 style={{ fontSize: isMobile ? "22px" : "28px" }}>{isAdminMode ? "Access" : "Ingia Dashboard"}</h2>
                  <p style={{ color: "#94a3b8", fontSize: "13px" }}>{isAdminMode ? "Ingia na email na password" : "Weka jina la duka na password"}</p>
                </div>
                {isAdminMode ? (
                  <form onSubmit={handleAdminLogin}>
                    {loginError && <div style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "10px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px", textAlign: "center" }}>❌ {loginError}</div>}
                    <div style={{ marginBottom: "12px" }}><label style={{ color: "#cbd5e1", fontSize: "13px" }}>Email</label><input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={inputStyle} /></div>
                    <div style={{ marginBottom: "18px" }}><label style={{ color: "#cbd5e1", fontSize: "13px" }}>Password</label><input type="password" value={loginAdminPassword} onChange={(e) => setLoginAdminPassword(e.target.value)} style={inputStyle} /></div>
                    <button type="submit" style={btnStyle("linear-gradient(to right, #dc2626, #ef4444)")}>Ingia 🔑</button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin}>
                    {loginError && <div style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "10px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px", textAlign: "center" }}>❌ {loginError}</div>}
                    <div style={{ marginBottom: "12px" }}><label style={{ color: "#cbd5e1", fontSize: "13px" }}>Jina la Duka</label><select value={loginShopName} onChange={(e) => handleShopSelect(e.target.value)} style={inputStyle}><option value="">Chagua duka...</option>{dbShops.map((s, i) => (<option key={i} value={s.name}>{s.logo} {s.name}</option>))}</select></div>
                    <div style={{ marginBottom: "18px" }}><label style={{ color: "#cbd5e1", fontSize: "13px" }}>Password</label><input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={inputStyle} /></div>
                    <button type="submit" style={btnStyle("linear-gradient(to right, #3b82f6, #8b5cf6)")}>Ingia 📊</button>
                  </form>
                )}
              </div>
            </div>
          ) : isAdmin ? (
            // ADMIN DASHBOARD
            <>
              <div style={{ background: "linear-gradient(135deg, #1e1e3f, #2d1b4e)", borderRadius: "16px", padding: isMobile ? "18px" : "30px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: "linear-gradient(135deg, #dc2626, #991b1b)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "25px" }}>🛡️</div>
                  <div><h1 style={{ fontSize: isMobile ? "18px" : "24px", margin: 0 }}>Horaizon System</h1><p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>Udhibiti wa Marketplace</p></div>
                </div>
                <button onClick={() => { refreshAllData(); navigateTo("home") }} style={{ ...btnStyle("rgba(255,255,255,0.1)"), width: "auto", padding: "8px 15px" }}>🔄 Refresh Data</button>
              </div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
                {[{ id: "overview", label: "📈", color: "#3b82f6" }, { id: "shops", label: "🏪 Maduka", color: "#8b5cf6" }, { id: "post", label: "➕ Post", color: "#22c55e" }, { id: "products", label: "📦 Bidhaa", color: "#f59e0b" }, { id: "leads", label: "📨 Leads", color: "#ef4444" }].map(tab => (
                  <button key={tab.id} onClick={() => setAdminTab(tab.id)} style={{ padding: "10px 18px", borderRadius: "10px", background: adminTab === tab.id ? tab.color : "rgba(255,255,255,0.05)", color: "white", border: adminTab === tab.id ? "none" : "1px solid rgba(255,255,255,0.1)", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>{tab.label}</button>
                ))}
              </div>

              {adminTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                  {[{ icon: "🏪", v: adminStats.totalShops, c: "#3b82f6" }, { icon: "📦", v: adminStats.totalProducts, c: "#22c55e" }, { icon: "👁️", v: adminStats.totalViews, c: "#38bdf8" }, { icon: "💬", v: adminStats.totalWhatsappClicks, c: "#34d399" }, { icon: "🛒", v: adminStats.totalCartAdditions, c: "#a78bfa" }, { icon: "📨", v: adminStats.totalLeads, c: "#fbbf24" }].map((s, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.05)", padding: "18px", borderRadius: "14px", textAlign: "center" }}>
                      <div style={{ fontSize: "25px" }}>{s.icon}</div>
                      <div style={{ fontSize: "22px", fontWeight: "bold", color: s.c }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              )}

              {adminTab === "shops" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", flexWrap: "wrap", gap: "10px" }}>
                    <h3 style={{ fontSize: "16px" }}>🏪 Maduka ({dbShops.length})</h3>
                    <button onClick={() => setAddingNewShop(true)} style={{ ...btnStyle("linear-gradient(to right, #22c55e, #16a34a)"), width: "auto", padding: "10px 18px" }}>➕ Ongeza</button>
                  </div>
                  {addingNewShop && (
                    <div style={{ background: "rgba(30,41,59,0.7)", padding: "20px", borderRadius: "16px", marginBottom: "15px" }}>
                      <form onSubmit={handleAddShop} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "10px" }}>
                        <input type="text" placeholder="Jina la Duka *" value={newShopData.name} onChange={(e) => setNewShopData({...newShopData, name: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Logo (Emoji)" value={newShopData.logo} onChange={(e) => setNewShopData({...newShopData, logo: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Category" value={newShopData.category} onChange={(e) => setNewShopData({...newShopData, category: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Password *" value={newShopData.password} onChange={(e) => setNewShopData({...newShopData, password: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Phone" value={newShopData.phone} onChange={(e) => setNewShopData({...newShopData, phone: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Email" value={newShopData.email} onChange={(e) => setNewShopData({...newShopData, email: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Location" value={newShopData.location} onChange={(e) => setNewShopData({...newShopData, location: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Working Hours" value={newShopData.working_hours} onChange={(e) => setNewShopData({...newShopData, working_hours: e.target.value})} style={inputStyle} />
                        <textarea placeholder="Description" value={newShopData.description} onChange={(e) => setNewShopData({...newShopData, description: e.target.value})} style={{...inputStyle, gridColumn: "span 2", minHeight: "60px"}} />
                        <div style={{ gridColumn: "span 2", display: "flex", gap: "10px" }}>
                          <button type="submit" style={btnStyle("#22c55e")}>💾 Hifadhi</button>
                          <button type="button" onClick={() => setAddingNewShop(false)} style={btnStyle("gray")}>❌ Ghairi</button>
                        </div>
                      </form>
                    </div>
                  )}
                  {dbShops.map((shop, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.05)", padding: "14px", borderRadius: "12px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div><strong>{shop.logo} {shop.name}</strong><div style={{ fontSize: "11px", color: "#94a3b8" }}>{shop.category} • 📦 {dbProducts.filter(p => p.shop === shop.name).length}</div></div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => { setEditingShop({...shop}); setAddingNewShop(false) }} style={{ background: "#fbbf24", color: "black", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>✏️</button>
                        <button onClick={() => handleDeleteShop(shop.id, shop.name)} style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {adminTab === "post" && (
                <div style={{ background: "rgba(30,41,59,0.7)", padding: isMobile ? "18px" : "25px", borderRadius: "18px", maxWidth: "800px", margin: "0 auto" }}>
                  <h3 style={{ fontSize: "18px", marginBottom: "15px" }}>➕ Post Bidhaa Mpya (Admin)</h3>
                  <form onSubmit={handleAdminPostProduct}>
                    <div style={{ marginBottom: "12px" }}><label style={{ fontSize: "13px", color: "#cbd5e1" }}>Jina *</label><input type="text" value={adminNewProduct.name} onChange={(e) => setAdminNewProduct({...adminNewProduct, name: e.target.value})} style={inputStyle} /></div>
                    <div style={{ marginBottom: "12px" }}><label style={{ fontSize: "13px", color: "#cbd5e1" }}>Bei *</label><input type="text" value={adminNewProduct.price} onChange={(e) => setAdminNewProduct({...adminNewProduct, price: e.target.value})} style={inputStyle} /></div>
                    <div style={{ marginBottom: "12px" }}><label style={{ fontSize: "13px", color: "#cbd5e1" }}>Duka *</label><select value={adminNewProduct.shop} onChange={(e) => setAdminNewProduct({...adminNewProduct, shop: e.target.value})} style={inputStyle}>{dbShops.map((s, i) => (<option key={i} value={s.name}>{s.logo} {s.name}</option>))}</select></div>
                    <div style={{ marginBottom: "12px" }}><label style={{ fontSize: "13px", color: "#cbd5e1" }}>Maelezo</label><textarea value={adminNewProduct.description} onChange={(e) => setAdminNewProduct({...adminNewProduct, description: e.target.value})} style={{...inputStyle, minHeight: "80px"}} /></div>
                    <div style={{ marginBottom: "12px" }}><label style={{ fontSize: "13px", color: "#cbd5e1" }}>📤 Picha</label><input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], false, true)} style={inputStyle} /></div>
                    {adminNewProduct.image && <img src={adminNewProduct.image} alt="Preview" style={{ width: "100%", maxHeight: "150px", borderRadius: "10px", marginBottom: "15px", objectFit: "cover" }} />}
                    <button type="submit" style={btnStyle("linear-gradient(to right, #22c55e, #16a34a)")}>🚀 Post Bidhaa</button>
                  </form>
                </div>
              )}

              {adminTab === "products" && (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}><th style={{ padding: "10px", textAlign: "left" }}>Bidhaa</th><th style={{ padding: "10px" }}>Duka</th><th style={{ padding: "10px" }}>Bei</th><th style={{ padding: "10px" }}>🗑️</th></tr></thead>
                    <tbody>{dbProducts.map(p => (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "10px" }}><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><img src={p.image} alt="" style={{ width: "35px", height: "35px", borderRadius: "6px", objectFit: "cover" }} /><span style={{ fontSize: "12px" }}>{p.name}</span></div></td>
                        <td style={{ padding: "10px", color: "#a855f7", fontSize: "12px" }}>{p.shop}</td>
                        <td style={{ padding: "10px", color: "#38bdf8", fontSize: "12px" }}>{p.price}</td>
                        <td style={{ padding: "10px" }}><button onClick={() => handleDeleteProduct(p.id)} style={{ background: "#ef4444", color: "white", border: "none", padding: "5px 10px", borderRadius: "6px", cursor: "pointer" }}>🗑️</button></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}

              {adminTab === "leads" && (
                <div>
                  <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>📨 Leads ({dbLeads.length})</h3>
                  {dbLeads.map(lead => (
                    <div key={lead.id} style={{ background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "10px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ fontSize: "13px" }}><strong>{lead.product_name}</strong><div style={{ color: "#94a3b8", fontSize: "11px" }}>🏪 {lead.shop_name} • {lead.customer_action}</div></div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "15px", background: lead.status === "New" ? "rgba(59,130,246,0.2)" : "rgba(34,197,94,0.2)", color: lead.status === "New" ? "#60a5fa" : "#4ade80" }}>{lead.status}</span>
                        <button onClick={() => handleDeleteLead(lead.id)} style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 8px", borderRadius: "5px", cursor: "pointer", fontSize: "11px" }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // SHOP OWNER DASHBOARD
            <>
              <div style={{ background: "linear-gradient(135deg, #1e3a5f, #2d1b69)", borderRadius: "16px", padding: isMobile ? "18px" : "30px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "25px" }}>{loggedInShop?.logo}</div>
                  <div><h1 style={{ fontSize: isMobile ? "18px" : "24px", margin: 0 }}>{loggedInShop?.name}</h1><p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>Dashboard ya Duka</p></div>
                </div>
                <button onClick={() => { const s = dbShops.find(sh => sh.name === loggedInShop?.name); if (s) { setSelectedShop(s); navigateTo("shopProfile") } }} style={{ ...btnStyle("rgba(255,255,255,0.1)"), width: "auto", padding: "8px 15px" }}>🏪 Tazama Duka</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                {[{ icon: "👁️", v: shopStats.totalViews, c: "#38bdf8" }, { icon: "💬", v: shopStats.whatsappClicks, c: "#34d399" }, { icon: "🛒", v: shopStats.cartAdditions, c: "#a78bfa" }, { icon: "📦", v: shopStats.totalProducts, c: "#fca5a5" }].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.05)", padding: "18px", borderRadius: "14px", textAlign: "center" }}>
                    <div style={{ fontSize: "25px" }}>{s.icon}</div>
                    <div style={{ fontSize: "22px", fontWeight: "bold", color: s.c }}>{s.v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(400px, 1fr))", gap: "20px" }}>
                <div style={{ background: "rgba(30,41,59,0.7)", padding: isMobile ? "18px" : "25px", borderRadius: "18px" }}>
                  {editingProduct ? (
                    <form onSubmit={handleUpdateProduct}>
                      <h3 style={{ color: "#fbbf24", fontSize: "16px" }}>✏️ Badilisha Bidhaa</h3>
                      <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} placeholder="Jina" />
                      <input type="text" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} placeholder="Bei" />
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], true)} style={{...inputStyle, marginBottom: "8px"}} />
                      {editingProduct.image && <img src={editingProduct.image} style={{ width: "100%", height: "100px", borderRadius: "8px", marginBottom: "8px", objectFit: "cover" }} />}
                      <textarea value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} style={{...inputStyle, minHeight: "60px", marginBottom: "8px"}} placeholder="Maelezo" />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button type="submit" style={{ ...btnStyle("#fbbf24"), color: "black" }}>Hifadhi</button>
                        <button type="button" onClick={() => setEditingProduct(null)} style={btnStyle("gray")}>Ghairi</button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleAddProduct}>
                      <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>➕ Ongeza Bidhaa</h3>
                      <input type="text" placeholder="Jina la Bidhaa" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
                      <input type="text" placeholder="Bei" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], false)} style={{...inputStyle, marginBottom: "8px"}} />
                      {newProduct.image && <img src={newProduct.image} style={{ width: "100%", height: "100px", borderRadius: "8px", marginBottom: "8px", objectFit: "cover" }} />}
                      <textarea placeholder="Maelezo" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} style={{...inputStyle, minHeight: "60px", marginBottom: "8px"}} />
                      <button type="submit" style={btnStyle("linear-gradient(to right, #22c55e, #16a34a)")}>🚀 Weka Dukani</button>
                    </form>
                  )}
                </div>

                <div>
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "18px", borderRadius: "16px", marginBottom: "15px" }}>
                    <h3 style={{ fontSize: "15px" }}>📦 Bidhaa Zangu ({dbProducts.filter(p => p.shop === loggedInShop?.name).length})</h3>
                    {dbProducts.filter(p => p.shop === loggedInShop?.name).map(prod => (
                      <div key={prod.id} style={{ background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "10px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}><img src={prod.image} style={{ width: "35px", height: "35px", borderRadius: "6px", objectFit: "cover" }} /><div><strong style={{ fontSize: "13px" }}>{prod.name}</strong><div style={{ fontSize: "11px", color: "#38bdf8" }}>{prod.price}</div></div></div>
                        <div><button onClick={() => startEdit(prod)} style={{ background: "#fbbf24", color: "black", border: "none", padding: "4px 8px", borderRadius: "5px", cursor: "pointer", marginRight: "4px", fontSize: "11px" }}>✏️</button><button onClick={() => handleDeleteProduct(prod.id)} style={{ background: "#ef4444", color: "white", border: "none", padding: "4px 8px", borderRadius: "5px", cursor: "pointer", fontSize: "11px" }}>🗑️</button></div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.05)", padding: "18px", borderRadius: "16px" }}>
                    <h3 style={{ fontSize: "15px" }}>📨 Leads ({getShopLeads(loggedInShop?.name).length})</h3>
                    {getShopLeads(loggedInShop?.name).map(lead => (
                      <div key={lead.id} style={{ background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "8px", marginBottom: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}><strong>{lead.product_name}</strong><span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: lead.status === "New" ? "rgba(59,130,246,0.2)" : "rgba(34,197,94,0.2)", color: lead.status === "New" ? "#60a5fa" : "#4ade80" }}>{lead.status}</span></div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>{lead.customer_action}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
                          <span style={{ fontSize: "10px", color: "#64748b" }}>{new Date(lead.created_at).toLocaleDateString('sw-TZ')}</span>
                          {lead.status === "New" && <button onClick={() => updateLeadStatus(lead.id, "Contacted")} style={{ background: "#22c55e", color: "white", border: "none", padding: "3px 8px", borderRadius: "5px", cursor: "pointer", fontSize: "10px" }}>Contacted</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}