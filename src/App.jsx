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

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem("horeizon_auth")
    if (saved) {
      const auth = JSON.parse(saved)
      if (auth.isAdmin) return true
    }
    return false
  })

  const [loggedInShop, setLoggedInShop] = useState(null)
  const [isAdmin, setIsAdmin] = useState(() => {
    const saved = localStorage.getItem("horeizon_auth")
    return saved ? JSON.parse(saved).isAdmin || false : false
  })

  const [loginError, setLoginError] = useState("")
  const [loginShopName, setLoginShopName] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginAdminPassword, setLoginAdminPassword] = useState("")
  const isAdminMode = window.location.hash === '#admin'

  const [editingProduct, setEditingProduct] = useState(null)
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", image: "", shop: "" })
  const [adminNewProduct, setAdminNewProduct] = useState({ name: "", price: "", description: "", image: "" })

  const [shopStats, setShopStats] = useState({ totalViews: 0, whatsappClicks: 0, cartAdditions: 0, totalProducts: 0 })
  const [adminStats, setAdminStats] = useState({ totalShops: 0, totalProducts: 0, totalViews: 0, totalWhatsappClicks: 0, totalCartAdditions: 0, totalLeads: 0 })

  const [editingShop, setEditingShop] = useState(null)
  const [newShopData, setNewShopData] = useState({
    name: "", logo: "", category: "", description: "", location: "", phone: "", email: "",
    working_hours: "Jumatatu - Jumamosi: 8:00 AM - 6:00 PM", rating: "4.0", password: ""
  })
  const [adminTab, setAdminTab] = useState("overview")
  const [adminMessage, setAdminMessage] = useState("")

  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [profileForm, setProfileForm] = useState({ owner_name: "", phone: "", email: "", current_password: "", new_password: "", confirm_password: "" })
  const [profileMessage, setProfileMessage] = useState("")

  const [, setAvailableImages] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem("horeizon_auth")
    if (saved && !isLoggedIn && dbShops.length > 0) {
      const auth = JSON.parse(saved)
      if (!auth.isAdmin && auth.shopName && auth.password) {
        const shop = dbShops.find(s => s.name === auth.shopName && s.password === auth.password)
        if (shop) { setIsLoggedIn(true); setLoggedInShop(shop); calculateShopStats(shop.name).then(s => setShopStats(s)) }
      }
    }
  }, [dbShops])

  const fetchProducts = async () => { const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false }); if (!error) setDbProducts(data || []) }
  const fetchShops = async () => { const { data, error } = await supabase.from('shops').select('*').order('id', { ascending: true }); if (!error) setDbShops(data || []) }
  const fetchLeads = async () => { const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false }); if (!error) setDbLeads(data || []) }

  useEffect(() => { fetchProducts(); fetchShops(); fetchLeads() }, [])
  useEffect(() => { localStorage.setItem("horeizon_cart", JSON.stringify(cart)) }, [cart])

  const trackProductView = async (p) => { try { await supabase.from('analytics').insert([{ shop_name: p.shop, product_id: p.id, action_type: 'view' }]) } catch {} }
  const trackWhatsAppClick = async (sn) => { try { await supabase.from('analytics').insert([{ shop_name: sn, action_type: 'whatsapp_click' }]) } catch {} }
  const trackCartAddition = async (p) => { try { await supabase.from('analytics').insert([{ shop_name: p.shop, product_id: p.id, action_type: 'cart_add' }]) } catch {} }
  const trackLead = async (pn, sn, ca) => { try { await supabase.from('leads').insert([{ product_name: pn, shop_name: sn, customer_action: ca, status: 'New' }]); fetchLeads() } catch {} }

  const fetchAnalytics = async () => { try { const { data } = await supabase.from('analytics').select('*'); return data || [] } catch { return [] } }

  const calculateAdminStats = async () => {
    const a = await fetchAnalytics()
    return { totalShops: dbShops.length, totalProducts: dbProducts.length, totalViews: a.filter(x => x.action_type === 'view').length, totalWhatsappClicks: a.filter(x => x.action_type === 'whatsapp_click').length, totalCartAdditions: a.filter(x => x.action_type === 'cart_add').length, totalLeads: dbLeads.length }
  }

  useEffect(() => { if (isAdmin) { calculateAdminStats().then(s => setAdminStats(s)) } }, [isAdmin, dbShops, dbProducts, dbLeads])

  const calculateShopStats = async (sn) => {
    const a = await fetchAnalytics(); const sa = a.filter(x => x.shop_name === sn)
    return { totalViews: sa.filter(x => x.action_type === 'view').length, whatsappClicks: sa.filter(x => x.action_type === 'whatsapp_click').length, cartAdditions: sa.filter(x => x.action_type === 'cart_add').length, totalProducts: dbProducts.filter(p => p.shop === sn).length }
  }

  const getShopWhatsApp = (shopName) => { const shop = dbShops.find(s => s.name === shopName); return shop?.phone || "255700000000" }

  const handleImageUpload = async (file, setter) => {
    if (!file) return
    try {
      const fn = `${Date.now()}-${file.name}`
      try { await supabase.storage.createBucket('products-images', { public: true }) } catch {}
      const { error } = await supabase.storage.from('products-images').upload(fn, file)
      if (error) { alert("⚠️ Upload imefeli: " + error.message); return }
      const { data: urlData } = supabase.storage.from('products-images').getPublicUrl(fn)
      if (urlData?.publicUrl) { setter(urlData.publicUrl); return urlData.publicUrl }
    } catch (err) { alert("⚠️ Upload imefeli") }
    return null
  }

  const filteredProducts = dbProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.shop.toLowerCase().includes(searchQuery.toLowerCase()))

  const addToCart = () => {
    if (!selectedProduct) return
    const shop = selectedShop?.name || selectedProduct.shop || "Horeizon"
    const np = typeof selectedProduct.price === 'number' ? selectedProduct.price : Number(String(selectedProduct.price).replace(/[^0-9]/g, ""))
    setCart(prev => { const ex = prev.find(i => i.id === selectedProduct.id); return ex ? prev.map(i => i.id === selectedProduct.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...selectedProduct, price: np, quantity: 1, shop }] })
    trackCartAddition(selectedProduct); alert("Imewekwa Cart! 🛒")
  }

  const addToCartDirect = (product, shopName) => {
    const np = typeof product.price === 'number' ? product.price : Number(String(product.price).replace(/[^0-9]/g, ""))
    setCart(prev => { const ex = prev.find(i => i.id === product.id); return ex ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...product, price: np, quantity: 1, shop: shopName }] })
    trackCartAddition(product); alert("Imewekwa Cart! 🛒")
  }

  const updateQuantity = (id, amt) => { setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + amt } : i).filter(i => i.quantity > 0)) }
  const cartGroupedByShop = cart.reduce((g, i) => { const s = i.shop || "Unknown"; if (!g[s]) g[s] = []; g[s].push(i); return g }, {})

  const handleWhatsAppOrder = (sn, p) => {
    trackWhatsAppClick(sn); trackLead(p.name, sn, "WhatsApp Order")
    window.open(`https://wa.me/${getShopWhatsApp(sn)}?text=${encodeURIComponent(`Habari ${sn}, nataka ${p.name} - ${p.price}\nKupitia Horeizon Marketplace.`)}`, "_blank")
  }

  const handleShopCheckoutWhatsApp = (sn, items) => {
    trackWhatsAppClick(sn); items.forEach(i => trackLead(i.name, sn, "Cart Checkout"))
    let txt = "", total = 0
    items.forEach((i, idx) => { const st = i.price * i.quantity; total += st; txt += `${idx + 1}. ${i.name} (X${i.quantity}) - Tsh ${st.toLocaleString()}\n` })
    window.open(`https://wa.me/${getShopWhatsApp(sn)}?text=${encodeURIComponent(`🚀 ODA MPYA HOREIZON\n\n${txt}\n💰 Jumla: Tsh ${total.toLocaleString()}`)}`, "_blank")
  }

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError("")
    if (!loginShopName || !loginPassword) { setLoginError("Jaza jina na password!"); return }
    const shop = dbShops.find(s => s.name.toLowerCase() === loginShopName.toLowerCase())
    if (!shop) { setLoginError("Duka halijapatikana!"); return }
    if (shop.password !== loginPassword) { setLoginError("Password si sahihi!"); return }
    setIsLoggedIn(true); setIsAdmin(false); setLoggedInShop(shop); setShopStats(await calculateShopStats(shop.name))
    localStorage.setItem("horeizon_auth", JSON.stringify({ shopName: shop.name, password: shop.password, isAdmin: false }))
    setLoginShopName(""); setLoginPassword("")
  }

  const handleAdminLogin = (e) => {
    e.preventDefault(); setLoginError("")
    if (!loginEmail || !loginAdminPassword) { setLoginError("Jaza email na password!"); return }
    if (loginEmail === ADMIN_EMAIL && loginAdminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true); setIsLoggedIn(true); setLoginEmail(""); setLoginAdminPassword(""); setPage("dashboard")
      localStorage.setItem("horeizon_auth", JSON.stringify({ isAdmin: true }))
      calculateAdminStats().then(s => setAdminStats(s))
    } else setLoginError("Email au password si sahihi!")
  }

  const handleLogout = () => {
    setIsLoggedIn(false); setLoggedInShop(null); setIsAdmin(false)
    setShopStats({ totalViews: 0, whatsappClicks: 0, cartAdditions: 0, totalProducts: 0 })
    setLoginError(""); setAdminTab("overview"); setPage("home"); setShowProfileSettings(false)
    localStorage.removeItem("horeizon_auth")
  }

  const handleAddShop = async (e) => {
    e.preventDefault(); setAdminMessage("")
    if (!newShopData.name || !newShopData.password || !newShopData.category) { setAdminMessage("❌ Jaza angalau: Jina, Category, na Password!"); return }
    const { error } = await supabase.from('shops').insert([{
      name: newShopData.name, logo: newShopData.logo || "🏪", category: newShopData.category,
      description: newShopData.description || "Hakuna maelezo bado.", location: newShopData.location || "",
      phone: newShopData.phone || "", email: newShopData.email || "",
      working_hours: newShopData.working_hours || "Jumatatu - Jumamosi: 8:00 AM - 6:00 PM",
      rating: newShopData.rating || "4.0", password: newShopData.password
    }])
    if (error) { setAdminMessage("❌ Imefeli: " + error.message) }
    else { setAdminMessage("✅ Duka limeongezwa!"); setNewShopData({ name: "", logo: "", category: "", description: "", location: "", phone: "", email: "", working_hours: "Jumatatu - Jumamosi: 8:00 AM - 6:00 PM", rating: "4.0", password: "" }); fetchShops() }
  }

  const handleUpdateShop = async (e) => {
    e.preventDefault()
    if (!editingShop?.name) { alert("Jina linahitajika!"); return }
    const { error } = await supabase.from('shops').update({
      name: editingShop.name, logo: editingShop.logo, category: editingShop.category,
      description: editingShop.description, location: editingShop.location,
      phone: editingShop.phone, email: editingShop.email,
      working_hours: editingShop.working_hours, rating: editingShop.rating, password: editingShop.password
    }).eq('id', editingShop.id)
    if (error) alert("Imefeli: " + error.message)
    else { setEditingShop(null); fetchShops(); alert("✅ Saved!") }
  }

  const handleDeleteShop = async (id, name) => {
    if (confirm(`Futa "${name}" KABISA?`)) {
      await supabase.from('products').delete().eq('shop', name)
      await supabase.from('leads').delete().eq('shop_name', name)
      await supabase.from('analytics').delete().eq('shop_name', name)
      const { error } = await supabase.from('shops').delete().eq('id', id)
      if (error) alert("Imefeli: " + error.message)
      else { fetchShops(); fetchProducts(); fetchLeads(); alert("✅ Imefutwa!") }
    }
  }

  const startEdit = (p) => setEditingProduct(p)

  const handleAddProduct = async (e) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.price) { alert("Jaza jina na bei!"); return }
    const { error } = await supabase.from('products').insert([{
      name: newProduct.name, price: newProduct.price,
      description: newProduct.description || "Hakuna maelezo bado.",
      image: newProduct.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500",
      shop: loggedInShop?.name || newProduct.shop
    }])
    if (error) alert("Imefeli: " + error.message)
    else { alert("✅ Imewekwa!"); setNewProduct({ name: "", price: "", description: "", image: "", shop: loggedInShop?.name || "" }); fetchProducts(); if (loggedInShop) setShopStats(await calculateShopStats(loggedInShop.name)) }
  }

  const handleUpdateProduct = async (e) => {
    e.preventDefault()
    const { id, name, price, description, image, shop } = editingProduct
    const { error } = await supabase.from('products').update({ name, price, description, image, shop }).eq('id', id)
    if (error) alert("Imefeli: " + error.message)
    else { alert("✅ Saved!"); setEditingProduct(null); fetchProducts() }
  }

  const handleDeleteProduct = async (pid) => {
    if (confirm("Futa bidhaa hii?")) {
      const { error } = await supabase.from('products').delete().eq('id', pid)
      if (error) alert("Imefeli: " + error.message)
      else { fetchProducts(); alert("✅ Imefutwa!") }
    }
  }

  const getShopLeads = (sn) => dbLeads.filter(l => l.shop_name === sn)
  const navigateTo = (p) => { setPage(p); setShowProfileSettings(false) }

  const openProfileSettings = () => {
    setProfileForm({ owner_name: loggedInShop?.owner_name || "", phone: loggedInShop?.phone || "", email: loggedInShop?.email || "", current_password: "", new_password: "", confirm_password: "" })
    setProfileMessage(""); setShowProfileSettings(true)
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault(); setProfileMessage("")
    if (profileForm.current_password !== loggedInShop?.password) { setProfileMessage("❌ Password ya sasa si sahihi!"); return }
    if (profileForm.new_password && profileForm.new_password !== profileForm.confirm_password) { setProfileMessage("❌ Password mpya hailingani!"); return }
    const updateData = { phone: profileForm.phone, email: profileForm.email, owner_name: profileForm.owner_name }
    if (profileForm.new_password) updateData.password = profileForm.new_password
    const { error } = await supabase.from('shops').update(updateData).eq('id', loggedInShop.id)
    if (error) setProfileMessage("❌ Imefeli: " + error.message)
    else { setProfileMessage("✅ Taarifa zimehifadhiwa!"); const { data } = await supabase.from('shops').select('*').eq('id', loggedInShop.id).single(); if (data) { setLoggedInShop(data); localStorage.setItem("horeizon_auth", JSON.stringify({ shopName: data.name, password: data.password, isAdmin: false })) } }
  }

  const compactGrid = { display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(160px, 1fr))", gap: isMobile ? "8px" : "12px", marginTop: "10px" }
  const inputStyle = { width: "100%", padding: isMobile ? "10px" : "9px", borderRadius: "8px", background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.15)", fontSize: "13px", outline: "none" }
  const btn = (bg, c = "white") => ({ padding: isMobile ? "12px 16px" : "10px 16px", borderRadius: "10px", background: bg, color: c, border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "13px", width: "100%" })

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", fontFamily: "Arial, sans-serif", paddingBottom: isMobile ? "75px" : "0px" }}>

      {/* DESKTOP NAVBAR */}
      {!isMobile && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 25px", background: "rgba(255,255,255,0.03)", position: "sticky", top: 0, zIndex: 1000, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 onClick={() => navigateTo("home")} style={{ margin: 0, cursor: "pointer", background: "linear-gradient(to right,#38bdf8,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "22px" }}>Horeizon</h2>
          <div style={{ display: "flex", gap: "18px", alignItems: "center", fontWeight: "bold", fontSize: "14px" }}>
            {["home","shops","cart","dashboard"].map(p => (
              <span key={p} onClick={() => navigateTo(p)} style={{ cursor: "pointer", color: page === p ? "#38bdf8" : "#cbd5e1" }}>
                {p === "home" ? "🏠 Home" : p === "shops" ? "🏪 Shops" : p === "cart" ? `🛒 Cart (${cart.reduce((a,b)=>a+b.quantity,0)})` : "📊 Dashboard"}
              </span>
            ))}
            {isLoggedIn && <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}>Logout</button>}
          </div>
        </div>
      )}

      {/* ============ HOME PAGE ============ */}
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
                {dbShops.slice(0, 8).map((shop, i) => (
                  <div key={i} onClick={() => { setSelectedShop(shop); navigateTo("shopProfile") }} style={{ minWidth: isMobile ? "110px" : "150px", padding: isMobile ? "10px" : "14px", borderRadius: "12px", background: "linear-gradient(135deg,#1e3a5f,#2d1b69)", cursor: "pointer", textAlign: "center", flexShrink: 0 }}>
                    {shop.logo && shop.logo.startsWith("http") ? <img src={shop.logo} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", marginBottom: "4px" }} /> : <div style={{ fontSize: "24px" }}>{shop.logo || "🏪"}</div>}
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
                    <h3 style={{ margin: "3px 0", fontSize: "11px", fontWeight: "bold" }}>{product.name.length > 22 ? product.name.substring(0,22)+'...' : product.name}</h3>
                    <p style={{ color: "#38bdf8", fontWeight: "bold", fontSize: "11px", margin: "2px 0" }}>{product.price}</p>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); trackProductView(product); navigateTo("productDetails") }} style={{ ...btn("linear-gradient(to right,#3b82f6,#8b5cf6)"), padding: "5px", fontSize: "9px", marginTop: "3px" }}>View 👀</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ============ SHOPS PAGE ============ */}
      {page === "shops" && (
        <div style={{ padding: isMobile ? "12px" : "20px", maxWidth: "1000px", margin: "0 auto" }}>
          <h1 style={{ fontSize: isMobile ? "18px" : "24px", marginBottom: "4px" }}>Explore Shops 🏪</h1>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px", marginTop: "10px" }}>
            {dbShops.map((shop, i) => (
              <div key={i} onClick={() => { setSelectedShop(shop); navigateTo("shopProfile") }} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "12px", cursor: "pointer", textAlign: "center" }}>
                {shop.logo && shop.logo.startsWith("http") ? <img src={shop.logo} style={{ width: "50px", height: "50px", borderRadius: "10px", objectFit: "cover", marginBottom: "4px" }} /> : <div style={{ fontSize: "28px" }}>{shop.logo || "🏪"}</div>}
                <h3 style={{ fontSize: "12px", margin: "4px 0" }}>{shop.name}</h3>
                <span style={{ fontSize: "9px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "2px 7px", borderRadius: "8px" }}>{shop.category}</span>
                <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "4px" }}>⭐ {shop.rating} • 📦 {dbProducts.filter(p => p.shop === shop.name).length}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ SHOP PROFILE ============ */}
      {page === "shopProfile" && selectedShop && (
        <div style={{ padding: isMobile ? "10px" : "20px", maxWidth: "1000px", margin: "0 auto" }}>
          <button onClick={() => navigateTo("shops")} style={{ ...btn("rgba(255,255,255,0.1)"), width: "auto", marginBottom: "10px", padding: "6px 14px", fontSize: "11px" }}>⬅ Back</button>
          <div style={{ background: "linear-gradient(135deg, #1e3a5f, #2d1b69)", borderRadius: "12px", padding: isMobile ? "12px" : "18px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
            {selectedShop.logo && selectedShop.logo.startsWith("http") ? <img src={selectedShop.logo} alt={selectedShop.name} style={{ width: "45px", height: "45px", borderRadius: "10px", objectFit: "cover" }} /> : <div style={{ width: "45px", height: "45px", borderRadius: "10px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "22px" }}>{selectedShop.logo || "🏪"}</div>}
            <div>
              <h1 style={{ fontSize: isMobile ? "15px" : "20px", margin: 0 }}>{selectedShop.name}</h1>
              <span style={{ fontSize: "9px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "2px 7px", borderRadius: "8px" }}>{selectedShop.category}</span>
              <div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "2px" }}>⭐ {selectedShop.rating} • 📞 {selectedShop.phone}</div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "10px", marginBottom: "12px", fontSize: "11px", color: "#cbd5e1" }}>
            <p style={{ margin: "0 0 4px 0" }}>📍 {selectedShop.location}</p>
            <p style={{ margin: 0 }}>📧 {selectedShop.email} | 🕐 {selectedShop.working_hours}</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "10px", color: "#94a3b8" }}>{selectedShop.description}</p>
          </div>
          <h2 style={{ fontSize: isMobile ? "12px" : "15px", marginBottom: "6px" }}>📦 Bidhaa ({dbProducts.filter(p => p.shop === selectedShop.name).length})</h2>
          <div style={compactGrid}>
            {dbProducts.filter(p => p.shop === selectedShop.name).map(product => (
              <div key={product.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", overflow: "hidden" }}>
                <div style={{ height: isMobile ? "90px" : "120px", overflow: "hidden" }} onClick={() => { setSelectedProduct(product); trackProductView(product); navigateTo("productDetails") }}>
                  <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "7px" }}>
                  <h3 style={{ fontSize: "10px", margin: "2px 0" }}>{product.name.length > 18 ? product.name.substring(0,18)+'...' : product.name}</h3>
                  <p style={{ color: "#38bdf8", fontWeight: "bold", fontSize: "10px", margin: "2px 0" }}>{product.price}</p>
                  <button onClick={() => addToCartDirect(product, selectedShop.name)} style={{ ...btn("linear-gradient(to right, #3b82f6, #8b5cf6)"), padding: "4px", fontSize: "9px" }}>🛒 Add</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ PRODUCT DETAILS ============ */}
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

      {/* ============ CART PAGE ============ */}
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
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}><img src={item.image} style={{ width: "30px", height: "30px", borderRadius: "5px", objectFit: "cover" }} /><span>{item.name} <span style={{ color: "#38bdf8" }}>x{item.quantity}</span></span></div>
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

      {/* ============ DASHBOARD ============ */}
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
                    <div style={{ marginBottom: "6px" }}><label style={{ color: "#94a3b8", fontSize: "11px" }}>Jina la Duka</label><input type="text" placeholder="Andika jina la duka..." value={loginShopName} onChange={(e) => setLoginShopName(e.target.value)} style={inputStyle} /></div>
                    <div style={{ marginBottom: "10px" }}><label style={{ color: "#94a3b8", fontSize: "11px" }}>Password ya Duka</label><input type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={inputStyle} /></div>
                    <button type="submit" style={btn("linear-gradient(to right, #3b82f6, #8b5cf6)")}>Ingia 📊</button>
                  </form>
                )}
              </div>
              <div style={{ marginTop: "14px", textAlign: "center" }}>
                <a href="https://wa.me/255698656019?text=Habari%20nimeona%20Horeizon%20Marketplace%20na%20ningependa%20kukusapoti!" target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "25px", background: "linear-gradient(to right, #22c55e, #16a34a)", color: "white", textDecoration: "none", fontWeight: "bold", fontSize: "12px" }}>💚 Support My Work</a>
              </div>
            </div>
          ) : isAdmin ? (
            // ============ ADMIN DASHBOARD ============
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <div style={{ background: "linear-gradient(135deg, #1e1e3f, #2d1b4e)", borderRadius: "12px", padding: "14px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "24px" }}>🛡️</span>
                  <div><strong style={{ fontSize: "15px" }}>Horeizon Admin</strong><p style={{ margin: 0, fontSize: "10px", color: "#94a3b8" }}>{dbShops.length} shops • {dbProducts.length} products</p></div>
                </div>
                <button onClick={handleLogout} style={{ padding: "6px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.2)", color: "#f87171", border: "none", cursor: "pointer", fontSize: "10px", fontWeight: "bold" }}>🚪 Logout</button>
              </div>

              <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
                {[
                  { id: "overview", icon: "📈", label: "Overview" },
                  { id: "addShop", icon: "🏪", label: "+ Add Shop" },
                  { id: "manageShops", icon: "⚙️", label: "Shops List" },
                  { id: "leads", icon: "📨", label: "Leads" }
                ].map(tab => (
                  <button key={tab.id} onClick={() => { setAdminTab(tab.id); setAdminMessage(""); setEditingShop(null) }} style={{
                    padding: "8px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", border: "none",
                    background: adminTab === tab.id ? "#3b82f6" : "rgba(255,255,255,0.06)", color: "white"
                  }}>{tab.icon} {tab.label}</button>
                ))}
              </div>

              {adminMessage && (
                <div style={{ background: adminMessage.startsWith("✅") ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: adminMessage.startsWith("✅") ? "#4ade80" : "#f87171", padding: "10px", borderRadius: "8px", marginBottom: "10px", fontSize: "12px", textAlign: "center" }}>{adminMessage}</div>
              )}

              {/* Overview */}
              {adminTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)", gap: "8px" }}>
                  {[{ icon: "🏪", label: "Shops", value: adminStats.totalShops, color: "#3b82f6" },{ icon: "📦", label: "Products", value: adminStats.totalProducts, color: "#22c55e" },{ icon: "👁️", label: "Views", value: adminStats.totalViews, color: "#38bdf8" },{ icon: "💬", label: "WA Clicks", value: adminStats.totalWhatsappClicks, color: "#34d399" },{ icon: "🛒", label: "Cart", value: adminStats.totalCartAdditions, color: "#a78bfa" },{ icon: "📨", label: "Leads", value: adminStats.totalLeads, color: "#fbbf24" }].map((s, i) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.04)", padding: "14px", borderRadius: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: "22px" }}>{s.icon}</div>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: "10px", color: "#94a3b8" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Shop */}
              {adminTab === "addShop" && (
                <div style={{ background: "rgba(30,41,59,0.6)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "12px", color: "#4ade80" }}>🏪 Ongeza Duka Jipya</h3>
                  <form onSubmit={handleAddShop} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "10px" }}>
                    <div style={{ gridColumn: isMobile ? "span 1" : "span 2", textAlign: "center" }}>
                      <label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>Picha/Logo ya Duka</label>
                      {newShopData.logo && newShopData.logo.startsWith("http") ? <img src={newShopData.logo} style={{ width: "80px", height: "80px", borderRadius: "12px", objectFit: "cover", marginBottom: "4px", border: "2px solid rgba(255,255,255,0.2)" }} /> : <div style={{ width: "80px", height: "80px", borderRadius: "12px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "inline-flex", justifyContent: "center", alignItems: "center", fontSize: "30px", marginBottom: "4px" }}>🏪</div>}
                      <input type="file" accept="image/*" onChange={async (e) => { const url = await handleImageUpload(e.target.files[0], (imgUrl) => setNewShopData({...newShopData, logo: imgUrl})); if (url) setNewShopData({...newShopData, logo: url}) }} style={inputStyle} />
                    </div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Jina la Duka *</label><input type="text" placeholder="Mfano: Kariakoo Electronics" value={newShopData.name} onChange={(e) => setNewShopData({...newShopData, name: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Category *</label><input type="text" placeholder="Mfano: Electronics" value={newShopData.category} onChange={(e) => setNewShopData({...newShopData, category: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Password *</label><input type="text" placeholder="Weka password ya duka" value={newShopData.password} onChange={(e) => setNewShopData({...newShopData, password: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Phone (WhatsApp) *</label><input type="text" placeholder="Mfano: 255712345678" value={newShopData.phone} onChange={(e) => setNewShopData({...newShopData, phone: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Email</label><input type="text" placeholder="Mfano: duka@example.com" value={newShopData.email} onChange={(e) => setNewShopData({...newShopData, email: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Location</label><input type="text" placeholder="Mfano: Kariakoo, Dar" value={newShopData.location} onChange={(e) => setNewShopData({...newShopData, location: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Working Hours</label><input type="text" placeholder="Mfano: 8AM - 6PM" value={newShopData.working_hours} onChange={(e) => setNewShopData({...newShopData, working_hours: e.target.value})} style={inputStyle} /></div>
                    <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Rating</label><input type="text" placeholder="Mfano: 4.5" value={newShopData.rating} onChange={(e) => setNewShopData({...newShopData, rating: e.target.value})} style={inputStyle} /></div>
                    <div style={{ gridColumn: isMobile ? "span 1" : "span 2" }}><label style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "3px" }}>Description</label><textarea placeholder="Maelezo ya duka..." value={newShopData.description} onChange={(e) => setNewShopData({...newShopData, description: e.target.value})} style={{...inputStyle, minHeight: "60px"}} /></div>
                    <div style={{ gridColumn: isMobile ? "span 1" : "span 2", display: "flex", gap: "8px" }}>
                      <button type="submit" style={btn("#22c55e")}>💾 Hifadhi Duka</button>
                      <button type="button" onClick={() => setNewShopData({ name: "", logo: "", category: "", description: "", location: "", phone: "", email: "", working_hours: "Jumatatu - Jumamosi: 8:00 AM - 6:00 PM", rating: "4.0", password: "" })} style={btn("gray")}>🔄 Clear</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Shops List (Manage + Products) */}
              {adminTab === "manageShops" && (
                <div>
                  <h3 style={{ fontSize: "14px", marginBottom: "10px" }}>⚙️ Shops List ({dbShops.length})</h3>

                  {editingShop && (
                    <div style={{ background: "rgba(30,41,59,0.9)", padding: "14px", borderRadius: "10px", marginBottom: "10px", border: "1px solid rgba(251,191,36,0.3)" }}>
                      <h4 style={{ fontSize: "13px", color: "#fbbf24", marginBottom: "8px" }}>
                        ✏️ Edit: {editingShop.name}
                        {editingShop.logo && editingShop.logo.startsWith("http") && <img src={editingShop.logo} style={{ width: "24px", height: "24px", borderRadius: "4px", marginLeft: "8px", verticalAlign: "middle", objectFit: "cover" }} />}
                      </h4>
                      <form onSubmit={handleUpdateShop} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "8px" }}>
                        <div style={{ gridColumn: isMobile ? "span 1" : "span 2", textAlign: "center" }}>
                          {editingShop.logo && editingShop.logo.startsWith("http") && <img src={editingShop.logo} style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", marginBottom: "4px" }} />}
                          <input type="file" accept="image/*" onChange={async (e) => { const url = await handleImageUpload(e.target.files[0], (imgUrl) => setEditingShop({...editingShop, logo: imgUrl})); if (url) setEditingShop({...editingShop, logo: url}) }} style={inputStyle} />
                        </div>
                        <input type="text" placeholder="Jina" value={editingShop.name} onChange={(e) => setEditingShop({...editingShop, name: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Category" value={editingShop.category} onChange={(e) => setEditingShop({...editingShop, category: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Password" value={editingShop.password} onChange={(e) => setEditingShop({...editingShop, password: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Phone" value={editingShop.phone} onChange={(e) => setEditingShop({...editingShop, phone: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Email" value={editingShop.email} onChange={(e) => setEditingShop({...editingShop, email: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Location" value={editingShop.location} onChange={(e) => setEditingShop({...editingShop, location: e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Working Hours" value={editingShop.working_hours} onChange={(e) => setEditingShop({...editingShop, working_hours: e.target.value})} style={inputStyle} />
                        <textarea placeholder="Description" value={editingShop.description} onChange={(e) => setEditingShop({...editingShop, description: e.target.value})} style={{...inputStyle, gridColumn: isMobile ? "span 1" : "span 2", minHeight: "50px"}} />
                        <div style={{ gridColumn: isMobile ? "span 1" : "span 2", display: "flex", gap: "8px" }}>
                          <button type="submit" style={btn("#fbbf24", "black")}>💾 Save</button>
                          <button type="button" onClick={() => setEditingShop(null)} style={btn("gray")}>Cancel</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {dbShops.map((shop, i) => (
                      <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", overflow: "hidden" }}>
                        <div style={{ padding: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                          {shop.logo && shop.logo.startsWith("http") ? <img src={shop.logo} alt={shop.name} style={{ width: "55px", height: "55px", borderRadius: "12px", objectFit: "cover", border: "2px solid rgba(255,255,255,0.15)", flexShrink: 0 }} /> : <div style={{ width: "55px", height: "55px", borderRadius: "12px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "22px", flexShrink: 0 }}>{shop.logo || "🏪"}</div>}
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: "13px" }}>{shop.name}</strong>
                            <div style={{ fontSize: "10px", color: "#94a3b8" }}>{shop.category}</div>
                            <div style={{ fontSize: "9px", color: "#64748b" }}>📦 {dbProducts.filter(p => p.shop === shop.name).length} products • 📨 {getShopLeads(shop.name).length} leads • ⭐ {shop.rating}</div>
                            <div style={{ fontSize: "9px", color: "#64748b" }}>📞 {shop.phone} | 🔑 Pass: {shop.password} | 📍 {shop.location}</div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <button onClick={() => setEditingShop({...shop})} style={{ background: "#fbbf24", color: "black", border: "none", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "10px", fontWeight: "bold", whiteSpace: "nowrap" }}>✏️ Edit</button>
                            <button onClick={() => handleDeleteShop(shop.id, shop.name)} style={{ background: "#ef4444", color: "white", border: "none", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "10px", fontWeight: "bold", whiteSpace: "nowrap" }}>🗑️ Futa</button>
                          </div>
                        </div>

                        {/* Products Section ndani ya duka */}
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 12px", background: "rgba(0,0,0,0.15)" }}>
                          <h5 style={{ fontSize: "11px", marginBottom: "8px", color: "#60a5fa" }}>📦 Bidhaa za {shop.name} ({dbProducts.filter(p => p.shop === shop.name).length})</h5>
                          <form onSubmit={async (e) => {
                            e.preventDefault()
                            if (!adminNewProduct.name || !adminNewProduct.price) { setAdminMessage("❌ Jaza jina na bei!"); return }
                            const { error } = await supabase.from('products').insert([{ name: adminNewProduct.name, price: adminNewProduct.price, description: adminNewProduct.description || "Hakuna maelezo bado.", image: adminNewProduct.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500", shop: shop.name }])
                            if (error) setAdminMessage("❌ Imefeli: " + error.message)
                            else { setAdminMessage(`✅ Bidhaa imewekwa kwenye ${shop.name}!`); setAdminNewProduct({ name: "", price: "", description: "", image: "" }); fetchProducts() }
                          }} style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px", alignItems: "flex-end" }}>
                            <input type="text" placeholder="Jina la bidhaa" value={adminNewProduct.name} onChange={(e) => setAdminNewProduct({...adminNewProduct, name: e.target.value})} style={{ flex: "1 1 120px", minWidth: "100px", padding: "7px", borderRadius: "6px", background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.15)", fontSize: "11px", outline: "none" }} />
                            <input type="text" placeholder="Bei (Tsh)" value={adminNewProduct.price} onChange={(e) => setAdminNewProduct({...adminNewProduct, price: e.target.value})} style={{ flex: "1 1 80px", minWidth: "70px", padding: "7px", borderRadius: "6px", background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.15)", fontSize: "11px", outline: "none" }} />
                            <input type="text" placeholder="Link ya picha" value={adminNewProduct.image} onChange={(e) => setAdminNewProduct({...adminNewProduct, image: e.target.value})} style={{ flex: "1 1 120px", minWidth: "100px", padding: "7px", borderRadius: "6px", background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.15)", fontSize: "11px", outline: "none" }} />
                            <button type="submit" style={{ padding: "7px 14px", borderRadius: "6px", background: "linear-gradient(to right, #3b82f6, #8b5cf6)", color: "white", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "11px", whiteSpace: "nowrap" }}>➕ Add</button>
                          </form>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "200px", overflowY: "auto" }}>
                            {dbProducts.filter(p => p.shop === shop.name).length === 0 ? <p style={{ color: "#64748b", fontSize: "10px", textAlign: "center", padding: "8px" }}>Hakuna bidhaa bado</p> :
                              dbProducts.filter(p => p.shop === shop.name).map(prod => (
                                <div key={prod.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", background: "rgba(255,255,255,0.02)", borderRadius: "6px", fontSize: "10px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <img src={prod.image} style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover" }} />
                                    <span>{prod.name}</span>
                                    <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{prod.price}</span>
                                  </div>
                                  <button onClick={() => handleDeleteProduct(prod.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px" }}>🗑️</button>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leads */}
              {adminTab === "leads" && (
                <div>
                  <h3 style={{ fontSize: "14px", marginBottom: "8px" }}>📨 All Leads ({dbLeads.length})</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {dbLeads.length === 0 ? <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px", fontSize: "11px" }}>Hakuna leads bado</p> :
                      dbLeads.map(lead => (
                        <div key={lead.id} style={{ background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", flexWrap: "wrap", gap: "6px" }}>
                          <div><strong>{lead.product_name}</strong><div style={{ color: "#94a3b8", fontSize: "9px" }}>🏪 {lead.shop_name} • {lead.customer_action}</div></div>
                          <span style={{ fontSize: "8px", padding: "2px 8px", borderRadius: "10px", background: lead.status === "New" ? "rgba(59,130,246,0.2)" : "rgba(34,197,94,0.2)", color: lead.status === "New" ? "#60a5fa" : "#4ade80" }}>{lead.status}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          ) : showProfileSettings ? (
            <div style={{ maxWidth: "500px", margin: "0 auto" }}>
              <button onClick={() => setShowProfileSettings(false)} style={{ ...btn("rgba(255,255,255,0.1)"), width: "auto", marginBottom: "14px", padding: "6px 14px", fontSize: "11px" }}>⬅ Back</button>
              <div style={{ background: "rgba(30,41,59,0.7)", padding: "20px", borderRadius: "16px" }}>
                <h2 style={{ fontSize: "18px", marginBottom: "16px", textAlign: "center" }}>⚙️ Profile Settings</h2>
                {profileMessage && <div style={{ background: profileMessage.startsWith("✅") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: profileMessage.startsWith("✅") ? "#4ade80" : "#f87171", padding: "8px", borderRadius: "8px", marginBottom: "12px", fontSize: "11px", textAlign: "center" }}>{profileMessage}</div>}
                <form onSubmit={handleProfileUpdate}>
                  <div style={{ marginBottom: "10px" }}><label style={{ color: "#94a3b8", fontSize: "11px" }}>Jina la Duka</label><input type="text" value={loggedInShop?.name || ""} disabled style={{ ...inputStyle, opacity: 0.6 }} /></div>
                  <div style={{ marginBottom: "10px" }}><label style={{ color: "#94a3b8", fontSize: "11px" }}>Jina la Mmiliki</label><input type="text" value={profileForm.owner_name} onChange={(e) => setProfileForm({...profileForm, owner_name: e.target.value})} style={inputStyle} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    <div><label style={{ color: "#94a3b8", fontSize: "11px" }}>Namba</label><input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ color: "#94a3b8", fontSize: "11px" }}>Email</label><input type="email" value={profileForm.email} onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} style={inputStyle} /></div>
                  </div>
                  <hr style={{ borderColor: "rgba(255,255,255,0.06)", margin: "14px 0" }} />
                  <h4 style={{ fontSize: "13px", marginBottom: "8px", color: "#fbbf24" }}>🔐 Badilisha Password</h4>
                  <div style={{ marginBottom: "8px" }}><label style={{ color: "#94a3b8", fontSize: "11px" }}>Password ya Sasa *</label><input type="password" value={profileForm.current_password} onChange={(e) => setProfileForm({...profileForm, current_password: e.target.value})} required style={inputStyle} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    <div><label style={{ color: "#94a3b8", fontSize: "11px" }}>Password Mpya</label><input type="password" value={profileForm.new_password} onChange={(e) => setProfileForm({...profileForm, new_password: e.target.value})} style={inputStyle} /></div>
                    <div><label style={{ color: "#94a3b8", fontSize: "11px" }}>Thibitisha</label><input type="password" value={profileForm.confirm_password} onChange={(e) => setProfileForm({...profileForm, confirm_password: e.target.value})} style={inputStyle} /></div>
                  </div>
                  <button type="submit" style={btn("linear-gradient(to right, #fbbf24, #f59e0b)", "black")}>💾 Hifadhi</button>
                </form>
              </div>
            </div>
          ) : (
            // SHOP OWNER DASHBOARD
            <>
              <div style={{ background: "linear-gradient(135deg, #1e3a5f, #2d1b69)", borderRadius: "10px", padding: "12px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <strong style={{ fontSize: "14px" }}>{loggedInShop?.logo && loggedInShop.logo.startsWith("http") ? <img src={loggedInShop.logo} style={{ width: "20px", height: "20px", borderRadius: "4px", verticalAlign: "middle", marginRight: "4px", objectFit: "cover" }} /> : loggedInShop?.logo} {loggedInShop?.name}</strong>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={openProfileSettings} style={{ ...btn("rgba(255,255,255,0.15)"), width: "auto", padding: "6px 12px", fontSize: "10px" }}>⚙️ Settings</button>
                  <button onClick={() => { const s = dbShops.find(sh => sh.name === loggedInShop?.name); if (s) { setSelectedShop(s); navigateTo("shopProfile") } }} style={{ ...btn("rgba(255,255,255,0.15)"), width: "auto", padding: "6px 12px", fontSize: "10px" }}>🏪 View Shop</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", marginBottom: "8px" }}>
                {[{ l: "Views", v: shopStats.totalViews },{ l: "WA", v: shopStats.whatsappClicks },{ l: "Cart", v: shopStats.cartAdditions },{ l: "Products", v: shopStats.totalProducts }].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "8px", textAlign: "center", fontSize: "10px" }}><strong style={{ fontSize: "13px" }}>{s.v}</strong><br />{s.l}</div>
                ))}
              </div>
              <form onSubmit={handleAddProduct} style={{ background: "rgba(30,41,59,0.4)", padding: "10px", borderRadius: "10px", marginBottom: "8px" }}>
                <input type="text" placeholder="Jina la Bidhaa" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} style={{...inputStyle, marginBottom: "5px"}} />
                <input type="text" placeholder="Bei" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} style={{...inputStyle, marginBottom: "5px"}} />
                <input type="file" accept="image/*" onChange={async (e) => { const url = await handleImageUpload(e.target.files[0], (imgUrl) => setNewProduct({...newProduct, image: imgUrl})); if (url) setNewProduct({...newProduct, image: url}) }} style={{...inputStyle, marginBottom: "5px"}} />
                <button type="submit" style={btn("linear-gradient(to right, #22c55e, #16a34a)")}>➕ Ongeza Bidhaa</button>
              </form>
              <div style={{ textAlign: "center", marginTop: "10px", padding: "10px", background: "rgba(34,197,94,0.04)", borderRadius: "10px" }}>
                <a href="https://wa.me/255698656019?text=Habari%20nimeona%20Horeizon%20Marketplace%20na%20ningependa%20kukusapoti!" target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "20px", background: "linear-gradient(to right, #22c55e, #16a34a)", color: "white", textDecoration: "none", fontWeight: "bold", fontSize: "11px" }}>💚 Support My Work</a>
              </div>
            </>
          )}
        </div>
      )}

      {/* ============ MOBILE BOTTOM NAV ============ */}
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