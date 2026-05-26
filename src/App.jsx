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
  const [dbShops, setDbShops] = useState([])
  const [dbLeads, setDbLeads] = useState([])
  const isMobile = useIsMobile()

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("horeizon_cart")
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

  const [editingShop, setEditingShop] = useState(null)
  const [addingNewShop, setAddingNewShop] = useState(false)
  const [newShopData, setNewShopData] = useState({
    name: "", logo: "🏪", category: "", description: "", location: "", phone: "", email: "",
    working_hours: "Jumatatu - Jumamosi: 8:00 AM - 6:00 PM", rating: "4.0", password: ""
  })
  const [adminTab, setAdminTab] = useState("overview")

  // Profile settings state
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [profileForm, setProfileForm] = useState({
    owner_name: "",
    phone: "",
    email: "",
    current_password: "",
    new_password: "",
    confirm_password: ""
  })
  const [profileMessage, setProfileMessage] = useState("")

  const shopWhatsAppNumbers = {
    "Kariakoo Electronics": "255712345678", "Tech Zone": "255787112233", "Mlimani Fashion": "255765443322",
    "Smart Devices": "255654112233", "Dar Furniture": "255711001122"
  }

  const [, setAvailableImages] = useState([])

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*')
    if (error) console.error("Error:", error.message)
    else setDbProducts(data || [])
  }

  const fetchShops = async () => {
    const { data, error } = await supabase.from('shops').select('*')
    if (error) console.error("Error:", error.message)
    else setDbShops(data || [])
  }

  const fetchLeads = async () => {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (error) console.error("Error:", error.message)
    else setDbLeads(data || [])
  }

  const fetchSupabaseImages = async () => {
    try {
      const { data } = await supabase.storage.from('products-images').list()
      if (data) setAvailableImages(data.map(file => {
        const { data: urlData } = supabase.storage.from('products-images').getPublicUrl(file.name)
        return { name: file.name, url: urlData?.publicUrl || "" }
      }))
    } catch {}
  }

  useEffect(() => { fetchProducts(); fetchShops(); fetchLeads(); fetchSupabaseImages() }, [])
  useEffect(() => { localStorage.setItem("horeizon_cart", JSON.stringify(cart)) }, [cart])

  const trackProductView = async (p) => { await supabase.from('analytics').insert([{ shop_name: p.shop, product_id: p.id, action_type: 'view' }]) }
  const trackWhatsAppClick = async (sn) => { await supabase.from('analytics').insert([{ shop_name: sn, action_type: 'whatsapp_click' }]) }
  const trackCartAddition = async (p) => { await supabase.from('analytics').insert([{ shop_name: p.shop, product_id: p.id, action_type: 'cart_add' }]) }
  const trackLead = async (pn, sn, ca) => { await supabase.from('leads').insert([{ product_name: pn, shop_name: sn, customer_action: ca, status: 'New' }]); fetchLeads() }
  const updateLeadStatus = async (lid, ns) => { await supabase.from('leads').update({ status: ns }).eq('id', lid); fetchLeads() }

  const fetchAnalytics = async () => { const { data } = await supabase.from('analytics').select('*'); return data || [] }

  const calculateAdminStats = async () => {
    const a = await fetchAnalytics()
    return {
      totalShops: dbShops.length, totalProducts: dbProducts.length,
      totalViews: a.filter(x => x.action_type === 'view').length,
      totalWhatsappClicks: a.filter(x => x.action_type === 'whatsapp_click').length,
      totalCartAdditions: a.filter(x => x.action_type === 'cart_add').length,
      totalLeads: dbLeads.length
    }
  }

  useEffect(() => { if (isAdmin) { calculateAdminStats().then(s => setAdminStats(s)) } }, [isAdmin, dbShops, dbProducts, dbLeads])

  const calculateShopStats = async (sn) => {
    const a = await fetchAnalytics(); const sa = a.filter(x => x.shop_name === sn)
    return { totalViews: sa.filter(x => x.action_type === 'view').length, whatsappClicks: sa.filter(x => x.action_type === 'whatsapp_click').length, cartAdditions: sa.filter(x => x.action_type === 'cart_add').length, totalProducts: dbProducts.filter(p => p.shop === sn).length }
  }

  const handleImageUpload = async (file, isEdit = false, isAdminUp = false) => {
    if (!file) return
    const fn = `${Date.now()}-${file.name}`
    try { await supabase.storage.createBucket('products-images', { public: true }) } catch {}
    const { error } = await supabase.storage.from('products-images').upload(fn, file)
    if (error) { alert("Upload imefeli"); return }
    const { data: urlData } = supabase.storage.from('products-images').getPublicUrl(fn)
    const url = urlData?.publicUrl
    if (isAdminUp) setAdminNewProduct({ ...adminNewProduct, image: url })
    else if (isEdit) setEditingProduct({ ...editingProduct, image: url })
    else setNewProduct({ ...newProduct, image: url })
    alert("Picha imeupload! ✅")
  }

  const filteredProducts = dbProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.shop.toLowerCase().includes(searchQuery.toLowerCase()))

  const addToCart = () => {
    if (!selectedProduct) return
    const shop = selectedShop?.name || selectedProduct.shop || "Horeizon"
    const np = typeof selectedProduct.price === 'number' ? selectedProduct.price : Number(String(selectedProduct.price).replace(/[^0-9]/g, ""))
    setCart(prev => { const ex = prev.find(i => i.id === selectedProduct.id); return ex ? prev.map(i => i.id === selectedProduct.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...selectedProduct, price: np, quantity: 1, shop }] })
    trackCartAddition(selectedProduct)
    alert("Imewekwa Cart! 🛒")
  }

  const addToCartDirect = (product, shopName) => {
    const np = typeof product.price === 'number' ? product.price : Number(String(product.price).replace(/[^0-9]/g, ""))
    setCart(prev => { const ex = prev.find(i => i.id === product.id); return ex ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...product, price: np, quantity: 1, shop: shopName }] })
    trackCartAddition(product)
    alert("Imewekwa Cart! 🛒")
  }

  const updateQuantity = (id, amt) => { setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + amt } : i).filter(i => i.quantity > 0)) }
  const cartGroupedByShop = cart.reduce((g, i) => { const s = i.shop || "Unknown"; if (!g[s]) g[s] = []; g[s].push(i); return g }, {})

  const handleWhatsAppOrder = (sn, p) => {
    trackWhatsAppClick(sn); trackLead(p.name, sn, "WhatsApp Order")
    const phone = shopWhatsAppNumbers[sn] || "255700000000"
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Habari ${sn}, nataka ${p.name} - ${p.price}\nKupitia Horeizon Marketplace.`)}`, "_blank")
  }

  const handleShopCheckoutWhatsApp = (sn, items) => {
    trackWhatsAppClick(sn); items.forEach(i => trackLead(i.name, sn, "Cart Checkout"))
    const phone = shopWhatsAppNumbers[sn] || "255700000000"
    let txt = "", total = 0
    items.forEach((i, idx) => { const st = i.price * i.quantity; total += st; txt += `${idx + 1}. ${i.name} (X${i.quantity}) - Tsh ${st.toLocaleString()}\n` })
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`🚀 ODA MPYA HOREIZON\n\n${txt}\n💰 Jumla: Tsh ${total.toLocaleString()}`)}`, "_blank")
  }

  // Shop Owner Login (NO auto-fill)
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError("")

    if (!loginShopName || !loginPassword) {
      setLoginError("Tafadhali jaza jina la duka na password!")
      return
    }

    const shop = dbShops.find(s => s.name.toLowerCase() === loginShopName.toLowerCase())

    if (!shop) {
      setLoginError("Duka halijapatikana! Angalia jina umeandika sahihi.")
      return
    }

    if (shop.password !== loginPassword) {
      setLoginError("Password si sahihi! Wasiliana na Horeizon kama umesahau.")
      return
    }

    setIsLoggedIn(true)
    setIsAdmin(false)
    setLoggedInShop(shop)
    setShopStats(await calculateShopStats(shop.name))
    setLoginShopName("")
    setLoginPassword("")
    alert(`Karibu ${shop.name}! 👋`)
  }

  // Admin Login
  const handleAdminLogin = (e) => {
    e.preventDefault(); setLoginError("")
    if (!loginEmail || !loginAdminPassword) { setLoginError("Jaza email na password!"); return }
    if (loginEmail === ADMIN_EMAIL && loginAdminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true); setIsLoggedIn(true); setLoginEmail(""); setLoginAdminPassword(""); setPage("dashboard")
      calculateAdminStats().then(s => setAdminStats(s))
    } else setLoginError("Email au password si sahihi!")
  }

  const handleLogout = () => {
    setIsLoggedIn(false); setLoggedInShop(null); setIsAdmin(false)
    setShopStats({ totalViews: 0, whatsappClicks: 0, cartAdditions: 0, totalProducts: 0 })
    setLoginError(""); setAdminTab("overview"); setPage("home"); setShowProfileSettings(false)
  }

  // Profile Settings Handlers
  const openProfileSettings = () => {
    setProfileForm({
      owner_name: loggedInShop?.owner_name || "",
      phone: loggedInShop?.phone || "",
      email: loggedInShop?.email || "",
      current_password: "",
      new_password: "",
      confirm_password: ""
    })
    setProfileMessage("")
    setShowProfileSettings(true)
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setProfileMessage("")

    // Verify current password
    if (profileForm.current_password !== loggedInShop?.password) {
      setProfileMessage("❌ Password ya sasa si sahihi!")
      return
    }

    // Check if new passwords match
    if (profileForm.new_password && profileForm.new_password !== profileForm.confirm_password) {
      setProfileMessage("❌ Password mpya hailingani!")
      return
    }

    // Update shop in Supabase
    const updateData = {
      phone: profileForm.phone,
      email: profileForm.email,
      owner_name: profileForm.owner_name
    }

    if (profileForm.new_password) {
      updateData.password = profileForm.new_password
    }

    const { error } = await supabase.from('shops').update(updateData).eq('id', loggedInShop.id)

    if (error) {
      setProfileMessage("❌ Imefeli kuhifadhi: " + error.message)
    } else {
      setProfileMessage("✅ Taarifa zimehifadhiwa!")
      // Refresh logged in shop data
      const { data } = await supabase.from('shops').select('*').eq('id', loggedInShop.id).single()
      if (data) setLoggedInShop(data)
    }
  }

  const handleAddShop = async (e) => {
    e.preventDefault()
    if (!newShopData.name || !newShopData.password) { alert("Jaza jina na password!"); return }
    await supabase.from('shops').insert([newShopData])
    setAddingNewShop(false); fetchShops()
    setNewShopData({ name: "", logo: "🏪", category: "", description: "", location: "", phone: "", email: "", working_hours: "Jumatatu - Jumamosi: 8:00 AM - 6:00 PM", rating: "4.0", password: "" })
    alert("Duka limeongezwa! 🏪")
  }

  const handleUpdateShop = async (e) => { e.preventDefault(); await supabase.from('shops').update(editingShop).eq('id', editingShop.id); setEditingShop(null); fetchShops(); alert("Saved! 💾") }
  const handleDeleteShop = async (id, name) => {
    if (confirm(`Futa "${name}"?`)) { await supabase.from('shops').delete().eq('id', id); await supabase.from('products').delete().eq('shop', name); fetchShops(); fetchProducts() }
  }

  const startEdit = (p) => setEditingProduct(p)

  const handleAdminPostProduct = async (e) => {
    e.preventDefault()
    if (!adminNewProduct.name || !adminNewProduct.price) { alert("Jaza jina na bei!"); return }
    await supabase.from('products').insert([{ ...adminNewProduct, price: adminNewProduct.price.startsWith("Tsh") ? adminNewProduct.price : `Tsh ${adminNewProduct.price}`, description: adminNewProduct.description || "Hakuna maelezo.", image: adminNewProduct.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500" }])
    alert("Bidhaa imewekwa! 🚀"); setAdminNewProduct({ name: "", price: "", description: "", image: "", shop: adminNewProduct.shop }); fetchProducts()
  }

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.price) { alert("Jaza jina na bei!"); return }
    await supabase.from('products').insert([{ ...newProduct, price: newProduct.price.startsWith("Tsh") ? newProduct.price : `Tsh ${newProduct.price}`, description: newProduct.description || "Hakuna maelezo.", image: newProduct.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500" }])
    alert("Bidhaa imewekwa! 🚀"); setNewProduct({ name: "", price: "", description: "", image: "", shop: loggedInShop ? loggedInShop.name : newProduct.shop }); fetchProducts()
    if (loggedInShop) setShopStats(await calculateShopStats(loggedInShop.name))
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    const { id, name, price, description, image, shop } = editingProduct
    await supabase.from('products').update({ name, price: String(price).startsWith("Tsh") ? price : `Tsh ${price}`, description, image, shop }).eq('id', id)
    alert("Saved! 💾"); setEditingProduct(null); fetchProducts()
  }

  const handleDeleteProduct = async (pid) => { if (confirm("Futa?")) { await supabase.from('products').delete().eq('id', pid); fetchProducts() } }
  const getShopLeads = (sn) => dbLeads.filter(l => l.shop_name === sn)
  const navigateTo = (p) => { setPage(p); setShowProfileSettings(false) }

  const compactGrid = { display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(160px, 1fr))", gap: isMobile ? "8px" : "12px", marginTop: "10px" }
  const inputStyle = { width: "100%", padding: isMobile ? "12px" : "10px", borderRadius: "10px", background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.1)", fontSize: "14px", outline: "none" }
  const btn = (bg, c = "white") => ({ padding: isMobile ? "12px 16px" : "10px 16px", borderRadius: "10px", background: bg, color: c, border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "13px", width: "100%" })

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", fontFamily: "Arial, sans-serif", paddingBottom: isMobile ? "75px" : "0px" }}>

      {/* DESKTOP NAVBAR */}
      {!isMobile && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 25px", background: "rgba(255,255,255,0.03)", position: "sticky", top: 0, zIndex: 1000, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 onClick={() => navigateTo("home")} style={{ margin: 0, cursor: "pointer", background: "linear-gradient(to right,#38bdf8,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "22px" }}>Horeizon</h2>
          <div style={{ display: "flex", gap: "18px", alignItems: "center", fontWeight: "bold", fontSize: "14px" }}>
            {["home", "shops", "cart", "dashboard"].map(p => (
              <span key={p} onClick={() => navigateTo(p)} style={{ cursor: "pointer", color: page === p ? "#38bdf8" : "#cbd5e1" }}>
                {p === "home" ? "🏠 Home" : p === "shops" ? "🏪 Shops" : p === "cart" ? `🛒 Cart (${cart.reduce((a, b) => a + b.quantity, 0)})` : "📊 Dashboard"}
              </span>
            ))}
            {isLoggedIn && <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>Logout</button>}
          </div>
        </div>
      )}

      {/* HOME PAGE */}
      {page === "home" && (
        <>
          <div style={{ padding: isMobile ? "10px 12px 6px" : "16px 20px 8px", textAlign: "center" }}>
            <h1 style={{ fontSize: isMobile ? "20px" : "30px", marginBottom: "2px", background: "linear-gradient(to right,#60a5fa,#a855f7,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Horeizon Marketplace</h1>
            <input type="text" placeholder="🔍 Tafuta bidhaa au duka..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: "100%", maxWidth: "450px", padding: isMobile ? "10px" : "11px", borderRadius: "25px", border: "none", outline: "none", fontSize: "12px", background: "rgba(255,255,255,0.08)", color: "white", marginTop: "4px" }} />
          </div>

          {searchQuery === "" && (
            <div style={{ padding: isMobile ? "6px 12px" : "8px 20px" }}>
              <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
                {dbShops.slice(0, 6).map((shop, i) => (
                  <div key={i} onClick={() => { setSelectedShop(shop); navigateTo("shopProfile") }} style={{ minWidth: isMobile ? "110px" : "150px", padding: isMobile ? "10px" : "14px", borderRadius: "12px", background: "linear-gradient(135deg,#1e3a5f,#2d1b69)", cursor: "pointer", textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: "24px" }}>{shop.logo}</div>
                    <div style={{ fontWeight: "bold", fontSize: "10px", marginTop: "4px" }}>{shop.name}</div>
                    <div style={{ fontSize: "9px", color: "#94a3b8" }}>{shop.category}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: isMobile ? "8px 12px" : "10px 20px" }}>
            <h2 style={{ fontSize: isMobile ? "13px" : "16px", marginBottom: "6px" }}>{searchQuery ? `Matokeo (${filteredProducts.length})` : "✨ Trending"}</h2>
            <div style={compactGrid}>
              {filteredProducts.map(product => (
                <div key={product.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", overflow: "hidden" }}>
                  <div style={{ height: isMobile ? "100px" : "130px", overflow: "hidden" }} onClick={() => { setSelectedProduct(product); trackProductView(product); navigateTo("productDetails") }}>
                    <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ padding: "7px" }}>
                    <span style={{ fontSize: "8px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "1px 5px", borderRadius: "8px" }}>{product.shop}</span>
                    <h3 style={{ margin: "3px 0", fontSize: "11px", fontWeight: "bold" }}>{product.name.length > 22 ? product.name.substring(0, 22) + '...' : product.name}</h3>
                    <p style={{ color: "#38bdf8", fontWeight: "bold", fontSize: "11px", margin: "2px 0" }}>{product.price}</p>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); trackProductView(product); navigateTo("productDetails") }} style={{ ...btn("linear-gradient(to right,#3b82f6,#8b5cf6)"), padding: "5px", fontSize: "9px", marginTop: "3px" }}>View 👀</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* SHOPS PAGE */}
      {page === "shops" && (
        <div style={{ padding: isMobile ? "12px" : "20px", maxWidth: "1000px", margin: "0 auto" }}>
          <h1 style={{ fontSize: isMobile ? "18px" : "24px", marginBottom: "4px" }}>Explore Shops 🏪</h1>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", marginTop: "10px" }}>
            {dbShops.map((shop, i) => (
              <div key={i} onClick={() => { setSelectedShop(shop); navigateTo("shopProfile") }} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "12px", cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: "28px" }}>{shop.logo}</div>
                <h3 style={{ fontSize: "12px", margin: "4px 0" }}>{shop.name}</h3>
                <span style={{ fontSize: "9px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "2px 7px", borderRadius: "8px" }}>{shop.category}</span>
                <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "4px" }}>⭐ {shop.rating} • 📦 {dbProducts.filter(p => p.shop === shop.name).length}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHOP PROFILE */}
      {page === "shopProfile" && selectedShop && (
        <div style={{ padding: isMobile ? "10px" : "20px", maxWidth: "1000px", margin: "0 auto" }}>
          <button onClick={() => navigateTo("shops")} style={{ ...btn("rgba(255,255,255,0.1)"), width: "auto", marginBottom: "10px", padding: "6px 14px", fontSize: "11px" }}>⬅ Back</button>
          <div style={{ background: "linear-gradient(135deg, #1e3a5f, #2d1b69)", borderRadius: "12px", padding: isMobile ? "12px" : "18px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "45px", height: "45px", borderRadius: "10px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "22px" }}>{selectedShop.logo}</div>
            <div>
              <h1 style={{ fontSize: isMobile ? "15px" : "20px", margin: 0 }}>{selectedShop.name}</h1>
              <span style={{ fontSize: "9px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "2px 7px", borderRadius: "8px" }}>{selectedShop.category}</span>
              <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "2px" }}>⭐ {selectedShop.rating} • 📞 {selectedShop.phone}</div>
            </div>
          </div>
          <h2 style={{ fontSize: isMobile ? "12px" : "15px", marginBottom: "6px" }}>📦 Bidhaa ({dbProducts.filter(p => p.shop === selectedShop.name).length})</h2>
          <div style={compactGrid}>
            {dbProducts.filter(p => p.shop === selectedShop.name).map(product => (
              <div key={product.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ height: isMobile ? "90px" : "120px", overflow: "hidden" }} onClick={() => { setSelectedProduct(product); trackProductView(product); navigateTo("productDetails") }}>
                  <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "7px" }}>
                  <h3 style={{ fontSize: "10px", margin: "2px 0" }}>{product.name.length > 18 ? product.name.substring(0, 18) + '...' : product.name}</h3>
                  <p style={{ color: "#38bdf8", fontWeight: "bold", fontSize: "10px", margin: "2px 0" }}>{product.price}</p>
                  <button onClick={() => addToCartDirect(product, selectedShop.name)} style={{ ...btn("linear-gradient(to right, #3b82f6, #8b5cf6)"), padding: "4px", fontSize: "9px" }}>🛒 Add</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS */}
      {page === "productDetails" && selectedProduct && (
        <div style={{ padding: isMobile ? "10px" : "20px", maxWidth: "700px", margin: "0 auto" }}>
          <button onClick={() => navigateTo("home")} style={{ ...btn("rgba(255,255,255,0.1)"), width: "auto", marginBottom: "10px", padding: "6px 14px", fontSize: "11px" }}>⬅ Back</button>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", overflow: "hidden" }}>
            <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: "100%", height: isMobile ? "180px" : "280px", objectFit: "cover" }} />
            <div style={{ padding: isMobile ? "10px" : "16px" }}>
              <span style={{ color: "#a855f7", fontSize: "10px" }}>🏪 {selectedShop?.name || selectedProduct.shop}</span>
              <h1 style={{ fontSize: isMobile ? "16px" : "20px", margin: "4px 0" }}>{selectedProduct.name}</h1>
              <h2 style={{ color: "#38bdf8", fontSize: isMobile ? "16px" : "20px", margin: "2px 0" }}>{selectedProduct.price}</h2>
              <p style={{ color: "#cbd5e1", fontSize: "12px", marginTop: "6px" }}>{selectedProduct.description}</p>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "8px", marginTop: "10px" }}>
                <button onClick={addToCart} style={{ ...btn("transparent"), border: "1px solid #3b82f6" }}>🛒 Weka Cart</button>
                <button onClick={() => handleWhatsAppOrder(selectedShop?.name || selectedProduct.shop, selectedProduct)} style={btn("linear-gradient(to right,#22c55e,#16a34a)")}>📱 Agiza WhatsApp</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART PAGE */}
      {page === "cart" && (
        <div style={{ padding: isMobile ? "10px" : "20px", maxWidth: "700px", margin: "0 auto" }}>
          <h1 style={{ fontSize: isMobile ? "18px" : "22px" }}>Cart 🛒</h1>
          {cart.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "30px", borderRadius: "10px", marginTop: "10px", textAlign: "center", fontSize: "12px" }}>Cart ni tupu</div>
          ) : (
            Object.keys(cartGroupedByShop).map((sn) => {
              const items = cartGroupedByShop[sn]
              const total = items.reduce((s, i) => s + (i.price * i.quantity), 0)
              return (
                <div key={sn} style={{ background: "rgba(30,41,59,0.5)", padding: "10px", borderRadius: "12px", marginBottom: "10px", marginTop: "10px" }}>
                  <h3 style={{ fontSize: "12px", color: "#38bdf8", marginBottom: "6px" }}>🏪 {sn}</h3>
                  {items.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "10px" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <img src={item.image} style={{ width: "30px", height: "30px", borderRadius: "5px", objectFit: "cover" }} />
                        <span>{item.name} <span style={{ color: "#38bdf8" }}>x{item.quantity}</span></span>
                      </div>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ width: "20px", height: "20px", borderRadius: "50%", border: "none", background: "#ef4444", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "10px" }}>-</button>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ width: "20px", height: "20px", borderRadius: "50%", border: "none", background: "#22c55e", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "10px" }}>+</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                    <strong style={{ fontSize: "12px", color: "#38bdf8" }}>Tsh {total.toLocaleString()}</strong>
                    <button onClick={() => handleShopCheckoutWhatsApp(sn, items)} style={{ ...btn("linear-gradient(to right, #22c55e, #16a34a)"), width: "auto", padding: "7px 12px", fontSize: "10px" }}>Tuma Oda 📱</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* DASHBOARD */}
      {page === "dashboard" && (
        <div style={{ padding: isMobile ? "10px" : "20px", maxWidth: "1000px", margin: "0 auto" }}>
          {!isLoggedIn ? (
            <div style={{ maxWidth: "400px", margin: "30px auto" }}>
              <div style={{ background: "rgba(30,41,59,0.8)", padding: "20px", borderRadius: "16px" }}>
                <div style={{ textAlign: "center", marginBottom: "14px" }}>
                  <div style={{ fontSize: "28px" }}>🔐</div>
                  <h2 style={{ fontSize: "18px", margin: "4px 0" }}>{isAdminMode ? "Access" : "Ingia Dashboard"}</h2>
                </div>
                {isAdminMode ? (
                  <form onSubmit={handleAdminLogin}>
                    {loginError && <div style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "6px", borderRadius: "6px", marginBottom: "6px", fontSize: "10px", textAlign: "center" }}>{loginError}</div>}
                    <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ ...inputStyle, marginBottom: "6px" }} />
                    <input type="password" placeholder="Password" value={loginAdminPassword} onChange={(e) => setLoginAdminPassword(e.target.value)} style={{ ...inputStyle, marginBottom: "10px" }} />
                    <button type="submit" style={btn("linear-gradient(to right, #dc2626, #ef4444)")}>Ingia 🔑</button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin}>
                    {loginError && <div style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "6px", borderRadius: "6px", marginBottom: "6px", fontSize: "10px" }}>{loginError}</div>}
                    <div style={{ marginBottom: "6px" }}>
                      <label style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>Jina la Duka</label>
                      <input type="text" placeholder="Andika jina la duka lako..." value={loginShopName} onChange={(e) => setLoginShopName(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ marginBottom: "10px" }}>
                      <label style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>Password ya Duka</label>
                      <input type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={inputStyle} />
                    </div>
                    <button type="submit" style={btn("linear-gradient(to right, #3b82f6, #8b5cf6)")}>Ingia kwenye Duka Langu 📊</button>
                    <p style={{ color: "#64748b", fontSize: "9px", marginTop: "6px", textAlign: "center" }}>🔐 Wamiliki wa maduka — ingia na jina la duka na password mlilopewa</p>
                  </form>
                )}
              </div>

              {/* SUPPORT MY WORK */}
              <div style={{ marginTop: "14px", textAlign: "center" }}>
                <a href="https://wa.me/255698656019?text=Habari%20nimeona%20Horeizon%20Marketplace%20na%20ningependa%20kukusapoti%20kwa%20kazi%20yako%20nzuri!" target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "25px", background: "linear-gradient(to right, #22c55e, #16a34a)", color: "white", textDecoration: "none", fontWeight: "bold", fontSize: "12px" }}>
                  💚 Support My Work
                </a>
                <p style={{ color: "#94a3b8", fontSize: "9px", marginTop: "4px" }}>Unapenda Horeizon? Nisaidie kuendeleza jukwaa hili bure kwa wafanyabiashara wote</p>
              </div>
            </div>
          ) : isAdmin ? (
            // ADMIN DASHBOARD
            <>
              <div style={{ background: "linear-gradient(135deg, #1e1e3f, #2d1b4e)", borderRadius: "10px", padding: "12px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                <strong style={{ fontSize: "14px" }}>🛡️ Horeizon System</strong>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {["overview", "shops", "post", "products", "leads"].map(t => (
                    <button key={t} onClick={() => setAdminTab(t)} style={{ padding: "5px 10px", borderRadius: "6px", background: adminTab === t ? "#3b82f6" : "rgba(255,255,255,0.1)", color: "white", border: "none", cursor: "pointer", fontSize: "9px" }}>{t}</button>
                  ))}
                </div>
              </div>
              {adminTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                  {[{ l: "Shops", v: adminStats.totalShops }, { l: "Products", v: adminStats.totalProducts }, { l: "Views", v: adminStats.totalViews }, { l: "WA Clicks", v: adminStats.totalWhatsappClicks }, { l: "Cart", v: adminStats.totalCartAdditions }, { l: "Leads", v: adminStats.totalLeads }].map((s, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "8px", textAlign: "center", fontSize: "10px" }}><strong style={{ fontSize: "14px" }}>{s.v}</strong><br />{s.l}</div>
                  ))}
                </div>
              )}
              {adminTab === "shops" && (
                <div>
                  <button onClick={() => setAddingNewShop(true)} style={{ ...btn("linear-gradient(to right, #22c55e, #16a34a)"), width: "auto", padding: "7px 14px", fontSize: "10px", marginBottom: "8px" }}>➕ Ongeza Duka</button>
                  {dbShops.map((s, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", padding: "8px 10px", borderRadius: "8px", marginBottom: "4px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px" }}>
                      <span>{s.logo} {s.name}</span>
                      <div>
                        <button onClick={() => setEditingShop({ ...s })} style={{ background: "#fbbf24", color: "black", border: "none", padding: "3px 7px", borderRadius: "4px", cursor: "pointer", fontSize: "9px", marginRight: "3px" }}>✏️</button>
                        <button onClick={() => handleDeleteShop(s.id, s.name)} style={{ background: "#ef4444", color: "white", border: "none", padding: "3px 7px", borderRadius: "4px", cursor: "pointer", fontSize: "9px" }}>🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {adminTab === "post" && (
                <form onSubmit={handleAdminPostProduct} style={{ background: "rgba(30,41,59,0.5)", padding: "12px", borderRadius: "10px" }}>
                  <input type="text" placeholder="Jina" value={adminNewProduct.name} onChange={(e) => setAdminNewProduct({ ...adminNewProduct, name: e.target.value })} style={{ ...inputStyle, marginBottom: "6px" }} />
                  <input type="text" placeholder="Bei" value={adminNewProduct.price} onChange={(e) => setAdminNewProduct({ ...adminNewProduct, price: e.target.value })} style={{ ...inputStyle, marginBottom: "6px" }} />
                  <select value={adminNewProduct.shop} onChange={(e) => setAdminNewProduct({ ...adminNewProduct, shop: e.target.value })} style={{ ...inputStyle, marginBottom: "6px" }}>{dbShops.map((s, i) => (<option key={i} value={s.name}>{s.logo} {s.name}</option>))}</select>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], false, true)} style={{ ...inputStyle, marginBottom: "6px" }} />
                  {adminNewProduct.image && <img src={adminNewProduct.image} style={{ width: "100%", height: "80px", borderRadius: "6px", marginBottom: "6px", objectFit: "cover" }} />}
                  <button type="submit" style={btn("linear-gradient(to right, #22c55e, #16a34a)")}>🚀 Post Bidhaa</button>
                </form>
              )}
            </>
          ) : showProfileSettings ? (
            // PROFILE SETTINGS PAGE
            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
              <button onClick={() => setShowProfileSettings(false)} style={{ ...btn("rgba(255,255,255,0.1)"), width: "auto", marginBottom: "14px", padding: "6px 14px", fontSize: "11px" }}>⬅ Back to Dashboard</button>

              <div style={{ background: "rgba(30,41,59,0.7)", padding: "20px", borderRadius: "16px" }}>
                <h2 style={{ fontSize: "18px", marginBottom: "16px", textAlign: "center" }}>⚙️ Profile Settings</h2>
                <p style={{ color: "#94a3b8", fontSize: "11px", textAlign: "center", marginBottom: "16px" }}>
                  Badilisha taarifa za duka lako na password
                </p>

                {profileMessage && (
                  <div style={{ 
                    background: profileMessage.startsWith("✅") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    color: profileMessage.startsWith("✅") ? "#4ade80" : "#f87171",
                    padding: "8px", borderRadius: "8px", marginBottom: "12px", fontSize: "11px", textAlign: "center"
                  }}>
                    {profileMessage}
                  </div>
                )}

                <form onSubmit={handleProfileUpdate}>
                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>Jina la Duka</label>
                    <input type="text" value={loggedInShop?.name || ""} disabled style={{ ...inputStyle, opacity: 0.6 }} />
                    <p style={{ color: "#64748b", fontSize: "9px", marginTop: "2px" }}>Haliwezi kubadilishwa. Wasiliana na Admin.</p>
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>Jina la Mmiliki</label>
                    <input type="text" placeholder="Jina lako" value={profileForm.owner_name} onChange={(e) => setProfileForm({ ...profileForm, owner_name: e.target.value })} style={inputStyle} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>Namba ya Simu</label>
                      <input type="text" placeholder="255..." value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>Email</label>
                      <input type="email" placeholder="email@example.com" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} style={inputStyle} />
                    </div>
                  </div>

                  <hr style={{ borderColor: "rgba(255,255,255,0.06)", margin: "14px 0" }} />

                  <h4 style={{ fontSize: "13px", marginBottom: "8px", color: "#fbbf24" }}>🔐 Badilisha Password</h4>

                  <div style={{ marginBottom: "8px" }}>
                    <label style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>Password ya Sasa *</label>
                    <input type="password" placeholder="••••••••" value={profileForm.current_password} onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })} required style={inputStyle} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>Password Mpya</label>
                      <input type="password" placeholder="Acha wazi kama hutaki" value={profileForm.new_password} onChange={(e) => setProfileForm({ ...profileForm, new_password: e.target.value })} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: "block", marginBottom: "4px", color: "#94a3b8", fontSize: "11px" }}>Thibitisha Password Mpya</label>
                      <input type="password" placeholder="••••••••" value={profileForm.confirm_password} onChange={(e) => setProfileForm({ ...profileForm, confirm_password: e.target.value })} style={inputStyle} />
                    </div>
                  </div>

                  <button type="submit" style={btn("linear-gradient(to right, #fbbf24, #f59e0b)", "black")}>💾 Hifadhi Mabadiliko</button>
                </form>
              </div>
            </div>
          ) : (
            // SHOP OWNER DASHBOARD
            <>
              <div style={{ background: "linear-gradient(135deg, #1e3a5f, #2d1b69)", borderRadius: "10px", padding: "12px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <strong style={{ fontSize: "14px" }}>{loggedInShop?.logo} {loggedInShop?.name}</strong>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={openProfileSettings} style={{ ...btn("rgba(255,255,255,0.15)"), width: "auto", padding: "6px 12px", fontSize: "10px" }}>⚙️ Settings</button>
                  <button onClick={() => { const s = dbShops.find(sh => sh.name === loggedInShop?.name); if (s) { setSelectedShop(s); navigateTo("shopProfile") } }} style={{ ...btn("rgba(255,255,255,0.15)"), width: "auto", padding: "6px 12px", fontSize: "10px" }}>🏪 View Shop</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", marginBottom: "8px" }}>
                {[{ l: "Views", v: shopStats.totalViews }, { l: "WA", v: shopStats.whatsappClicks }, { l: "Cart", v: shopStats.cartAdditions }, { l: "Products", v: shopStats.totalProducts }].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "8px", textAlign: "center", fontSize: "10px" }}><strong style={{ fontSize: "13px" }}>{s.v}</strong><br />{s.l}</div>
                ))}
              </div>
              <form onSubmit={handleAddProduct} style={{ background: "rgba(30,41,59,0.4)", padding: "10px", borderRadius: "10px", marginBottom: "8px" }}>
                <input type="text" placeholder="Jina la Bidhaa" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} style={{ ...inputStyle, marginBottom: "5px" }} />
                <input type="text" placeholder="Bei" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} style={{ ...inputStyle, marginBottom: "5px" }} />
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], false)} style={{ ...inputStyle, marginBottom: "5px" }} />
                <button type="submit" style={btn("linear-gradient(to right, #22c55e, #16a34a)")}>➕ Ongeza Bidhaa</button>
              </form>

              <div style={{ textAlign: "center", marginTop: "10px", padding: "10px", background: "rgba(34,197,94,0.04)", borderRadius: "10px" }}>
                <a href="https://wa.me/255698656019?text=Habari%20nimeona%20Horeizon%20Marketplace%20na%20ningependa%20kukusapoti%20kwa%20kazi%20yako%20nzuri!" target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "20px", background: "linear-gradient(to right, #22c55e, #16a34a)", color: "white", textDecoration: "none", fontWeight: "bold", fontSize: "11px" }}>
                  💚 Support My Work
                </a>
                <p style={{ color: "#94a3b8", fontSize: "8px", marginTop: "3px" }}>Je, unapenda jukwaa hili? Nisaidie kuendelea kutoa huduma bure</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(15,23,42,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 5px 20px 5px", zIndex: 1000 }}>
          {[
            { id: "home", icon: "🏠", label: "Home", color: "#38bdf8" },
            { id: "shops", icon: "🏪", label: "Shops", color: "#38bdf8" },
            { id: "cart", icon: "🛒", label: "Cart", color: "#38bdf8", badge: cart.reduce((a, b) => a + b.quantity, 0) },
            { id: "dashboard", icon: "📊", label: "Dash", color: "#a855f7" }
          ].map(tab => (
            <div key={tab.id} onClick={() => navigateTo(tab.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", color: page === tab.id ? tab.color : "#94a3b8", gap: "2px", position: "relative" }}>
              <span style={{ fontSize: "18px" }}>{tab.icon}</span>
              {tab.badge > 0 && <span style={{ position: "absolute", top: "-2px", right: "calc(50% - 14px)", background: "#ef4444", color: "white", fontSize: "8px", fontWeight: "bold", minWidth: "14px", height: "14px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center" }}>{tab.badge}</span>}
              <span style={{ fontSize: "8px", fontWeight: page === tab.id ? "bold" : "normal" }}>{tab.label}</span>
              {page === tab.id && <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: tab.color }} />}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}