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
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [dbProducts, setDbProducts] = useState([])
  const [dbShops, setDbShops] = useState([])
  const [dbLeads, setDbLeads] = useState([])
  const [dbCustomers, setDbCustomers] = useState([])
  const isMobile = useIsMobile()

  const [cart, setCart] = useState(() => {
    try { const savedCart = localStorage.getItem("baizona_cart"); return savedCart ? JSON.parse(savedCart) : [] } catch { return [] }
  })

  // Auth states
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try { const saved = localStorage.getItem("baizona_auth"); return saved ? true : false } catch { return false }
  })
  const [loggedInShop, setLoggedInShop] = useState(null)
  const [isAdmin, setIsAdmin] = useState(() => {
    try { const saved = localStorage.getItem("baizona_auth"); return saved ? JSON.parse(saved).isAdmin || false : false } catch { return false }
  })
  const [isCustomer, setIsCustomer] = useState(() => {
    try { const saved = localStorage.getItem("baizona_auth"); return saved ? JSON.parse(saved).isCustomer || false : false } catch { return false }
  })
  const [loggedInCustomer, setLoggedInCustomer] = useState(null)

  // Customer auth states
  const [showCustomerAuth, setShowCustomerAuth] = useState(false)
  const [customerAuthMode, setCustomerAuthMode] = useState("login")
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "", password: "", confirmPassword: "" })
  const [customerError, setCustomerError] = useState("")
  const [customerMessage, setCustomerMessage] = useState("")

  // Customer profile states
  const [showCustomerProfile, setShowCustomerProfile] = useState(false)
  const [customerProfileForm, setCustomerProfileForm] = useState({ name: "", phone: "", currentPassword: "", newPassword: "", confirmNewPassword: "" })
  const [customerProfileMsg, setCustomerProfileMsg] = useState("")

  // Shop registration states
  const [showShopRegister, setShowShopRegister] = useState(false)
  const [shopRegForm, setShopRegForm] = useState({
    name: "", logo: "", logoFile: null, category: "Electronics", description: "", location: "", phone: "", email: "",
    working_hours: "Mon - Sat: 8AM - 6PM", password: "", confirmPassword: ""
  })
  const [shopRegError, setShopRegError] = useState("")
  const [shopRegMessage, setShopRegMessage] = useState("")

  const [loginError, setLoginError] = useState("")
  const [loginShopName, setLoginShopName] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginAdminPassword, setLoginAdminPassword] = useState("")
  const isAdminMode = window.location.hash === '#admin'

  const [editingProduct, setEditingProduct] = useState(null)
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", image: "", imageFile: null, shop: "" })
  const [adminNewProduct, setAdminNewProduct] = useState({ name: "", price: "", description: "", image: "", imageFile: null })

  const [shopStats, setShopStats] = useState({ totalViews: 0, whatsappClicks: 0, cartAdditions: 0, totalProducts: 0 })
  const [adminStats, setAdminStats] = useState({ totalShops: 0, totalProducts: 0, totalViews: 0, totalWhatsappClicks: 0, totalCartAdditions: 0, totalLeads: 0, totalCustomers: 0, pendingShops: 0 })

  const [editingShop, setEditingShop] = useState(null)
  const [newShopData, setNewShopData] = useState({
    name: "", logo: "", logoFile: null, category: "Electronics", description: "", location: "", phone: "", email: "",
    working_hours: "Mon - Sat: 8AM - 6PM", rating: "4.0", password: "", status: "approved"
  })
  const [adminTab, setAdminTab] = useState("overview")
  const [adminMessage, setAdminMessage] = useState("")

  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [profileForm, setProfileForm] = useState({ owner_name: "", phone: "", email: "", current_password: "", new_password: "", confirm_password: "" })
  const [profileMessage, setProfileMessage] = useState("")

  const categories = ["All", "Electronics", "Fashion", "Beauty", "Home", "Sports", "Food", "Books", "Services", "Other"]

  const fetchProducts = async () => {
    try { const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false }); if (!error && data) setDbProducts(data) } catch {}
  }
  const fetchAllShops = async () => {
    try { const { data, error } = await supabase.from('shops').select('*').order('id', { ascending: true }); if (!error && data) setDbShops(data) } catch {}
  }
  const fetchLeads = async () => {
    try { const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false }); if (!error && data) setDbLeads(data) } catch {}
  }
  const fetchCustomers = async () => {
    try { const { data, error } = await supabase.from('customers').select('*').order('id', { ascending: false }); if (!error && data) setDbCustomers(data) } catch {}
  }

  useEffect(() => { fetchProducts(); fetchAllShops(); fetchLeads(); fetchCustomers() }, [])
  useEffect(() => { try { localStorage.setItem("baizona_cart", JSON.stringify(cart)) } catch {} }, [cart])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("baizona_auth")
      if (saved) {
        const auth = JSON.parse(saved)
        if (auth.isCustomer && auth.customerId && dbCustomers.length > 0) {
          const customer = dbCustomers.find(c => c.id === auth.customerId)
          if (customer) { setIsCustomer(true); setIsLoggedIn(true); setLoggedInCustomer(customer) }
        }
        if (!auth.isAdmin && !auth.isCustomer && auth.shopName && auth.password && dbShops.length > 0) {
          const shop = dbShops.find(s => s.name === auth.shopName && s.password === auth.password)
          if (shop && shop.status === 'approved') { setIsLoggedIn(true); setLoggedInShop(shop); calculateShopStats(shop.name).then(s => setShopStats(s)) }
        }
      }
    } catch {}
  }, [dbShops, dbCustomers])

  const uploadImage = async (file) => {
    if (!file) return null
    try {
      const fn = `${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('products-images').upload(fn, file)
      if (!error) { const { data: urlData } = supabase.storage.from('products-images').getPublicUrl(fn); return urlData?.publicUrl || null }
    } catch {}
    return null
  }

  const trackProductView = async (p) => { try { await supabase.from('analytics').insert([{ shop_name: p.shop, product_id: p.id, action_type: 'view' }]) } catch {} }
  const trackWhatsAppClick = async (sn) => { try { await supabase.from('analytics').insert([{ shop_name: sn, action_type: 'whatsapp_click' }]) } catch {} }
  const trackCartAddition = async (p) => { try { await supabase.from('analytics').insert([{ shop_name: p.shop, product_id: p.id, action_type: 'cart_add' }]) } catch {} }
  const trackLead = async (pn, sn, ca, cid) => { try { await supabase.from('leads').insert([{ product_name: pn, shop_name: sn, customer_action: ca, status: 'New', customer_id: cid }]); fetchLeads() } catch {} }

  const fetchAnalytics = async () => { try { const { data } = await supabase.from('analytics').select('*'); return data || [] } catch { return [] } }

  const calculateAdminStats = async () => {
    const a = await fetchAnalytics()
    const pending = dbShops.filter(s => s.status === 'pending').length
    const approved = dbShops.filter(s => s.status === 'approved')
    return { totalShops: approved.length, totalProducts: dbProducts.length, totalViews: a.filter(x => x.action_type === 'view').length, totalWhatsappClicks: a.filter(x => x.action_type === 'whatsapp_click').length, totalCartAdditions: a.filter(x => x.action_type === 'cart_add').length, totalLeads: dbLeads.length, totalCustomers: dbCustomers.length, pendingShops: pending }
  }

  useEffect(() => { if (isAdmin) { calculateAdminStats().then(s => setAdminStats(s)) } }, [isAdmin, dbShops, dbProducts, dbLeads, dbCustomers])

  const calculateShopStats = async (sn) => {
    const a = await fetchAnalytics(); const sa = a.filter(x => x.shop_name === sn)
    return { totalViews: sa.filter(x => x.action_type === 'view').length, whatsappClicks: sa.filter(x => x.action_type === 'whatsapp_click').length, cartAdditions: sa.filter(x => x.action_type === 'cart_add').length, totalProducts: dbProducts.filter(p => p.shop === sn).length }
  }

  const getShopWhatsApp = (shopName) => { const shop = dbShops.find(s => s.name === shopName); return shop?.phone || "255700000000" }
  const approvedShops = dbShops.filter(s => s.status === 'approved')
  const filteredShops = selectedCategory === "All" ? approvedShops : approvedShops.filter(s => s.category === selectedCategory)
  const filteredProducts = dbProducts.filter(p => {
    const shop = dbShops.find(s => s.name === p.shop)
    if (!shop || shop.status !== 'approved') return false
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.shop.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // ============ SHOP REGISTRATION ============
  const handleShopRegister = async (e) => {
    e.preventDefault(); setShopRegError(""); setShopRegMessage("")
    if (!shopRegForm.name || !shopRegForm.password || !shopRegForm.category || !shopRegForm.phone) { setShopRegError("❌ Fill: Name, Category, Password, and Phone!"); return }
    if (shopRegForm.password !== shopRegForm.confirmPassword) { setShopRegError("❌ Passwords don't match!"); return }
    if (shopRegForm.password.length < 4) { setShopRegError("❌ Password must be 4+ chars!"); return }
    const { data: existing } = await supabase.from('shops').select('*').eq('name', shopRegForm.name)
    if (existing && existing.length > 0) { setShopRegError("❌ Shop name already exists!"); return }
    let logoUrl = shopRegForm.logo || "🏪"
    if (shopRegForm.logoFile) { const uploaded = await uploadImage(shopRegForm.logoFile); if (uploaded) logoUrl = uploaded }
    const { error } = await supabase.from('shops').insert([{ name: shopRegForm.name, logo: logoUrl, category: shopRegForm.category, description: shopRegForm.description || "", location: shopRegForm.location || "", phone: shopRegForm.phone, email: shopRegForm.email || "", working_hours: shopRegForm.working_hours || "Mon - Sat: 8AM - 6PM", rating: "4.0", password: shopRegForm.password, status: 'pending' }])
    if (error) { setShopRegError("❌ Failed: " + error.message) }
    else { setShopRegMessage("✅ Shop registered! Wait for admin approval."); setShopRegForm({ name: "", logo: "", logoFile: null, category: "Electronics", description: "", location: "", phone: "", email: "", working_hours: "Mon - Sat: 8AM - 6PM", password: "", confirmPassword: "" }); fetchAllShops() }
  }

  // ============ CUSTOMER AUTH ============
  const handleCustomerRegister = async (e) => {
    e.preventDefault(); setCustomerError(""); setCustomerMessage("")
    if (!customerForm.name || !customerForm.password || !customerForm.phone) { setCustomerError("Fill all fields!"); return }
    if (customerForm.password.length < 4) { setCustomerError("Password: 4+ chars!"); return }
    if (customerForm.password !== customerForm.confirmPassword) { setCustomerError("Passwords don't match!"); return }
    const { data: existing } = await supabase.from('customers').select('*').eq('phone', customerForm.phone)
    if (existing && existing.length > 0) { setCustomerError("Phone already registered!"); return }
    const { error } = await supabase.from('customers').insert([{ name: customerForm.name, phone: customerForm.phone, password: customerForm.password }])
    if (error) { setCustomerError("Failed: " + error.message) }
    else { setCustomerMessage("✅ Registered! Now login."); setCustomerForm({ name: "", phone: "", password: "", confirmPassword: "" }); setCustomerAuthMode("login"); fetchCustomers() }
  }

  const handleCustomerLogin = async (e) => {
    e.preventDefault(); setCustomerError(""); setCustomerMessage("")
    const { data } = await supabase.from('customers').select('*').eq('phone', customerForm.phone)
    if (!data || data.length === 0) { setCustomerError("Account not found!"); return }
    const customer = data[0]
    if (customer.password !== customerForm.password) { setCustomerError("Wrong password!"); return }
    setIsCustomer(true); setIsLoggedIn(true); setLoggedInCustomer(customer); setShowCustomerAuth(false)
    setCustomerForm({ name: "", phone: "", password: "", confirmPassword: "" })
    try { localStorage.setItem("baizona_auth", JSON.stringify({ isCustomer: true, customerId: customer.id })) } catch {}
  }

  // ============ CUSTOMER PROFILE UPDATE ============
  const openCustomerProfile = () => {
    setCustomerProfileForm({ name: loggedInCustomer?.name || "", phone: loggedInCustomer?.phone || "", currentPassword: "", newPassword: "", confirmNewPassword: "" })
    setCustomerProfileMsg("")
    setShowCustomerProfile(true)
  }

  const handleCustomerProfileUpdate = async (e) => {
    e.preventDefault(); setCustomerProfileMsg("")
    if (customerProfileForm.currentPassword !== loggedInCustomer?.password) { setCustomerProfileMsg("❌ Current password is wrong!"); return }
    if (customerProfileForm.newPassword && customerProfileForm.newPassword !== customerProfileForm.confirmNewPassword) { setCustomerProfileMsg("❌ New passwords don't match!"); return }
    const updateData = { name: customerProfileForm.name, phone: customerProfileForm.phone }
    if (customerProfileForm.newPassword) updateData.password = customerProfileForm.newPassword
    const { error } = await supabase.from('customers').update(updateData).eq('id', loggedInCustomer.id)
    if (error) { setCustomerProfileMsg("❌ Failed: " + error.message) }
    else { setCustomerProfileMsg("✅ Profile updated!"); const { data } = await supabase.from('customers').select('*').eq('id', loggedInCustomer.id).single(); if (data) { setLoggedInCustomer(data); try { localStorage.setItem("baizona_auth", JSON.stringify({ isCustomer: true, customerId: data.id })) } catch {} } }
  }

  const requireCustomerAuth = (action) => {
    if (!isCustomer && !isAdmin && !loggedInShop) { setShowCustomerAuth(true); setCustomerAuthMode("login"); return false }
    return true
  }

  // ============ CART & ORDER ============
  const addToCart = () => { if (!selectedProduct || !requireCustomerAuth()) return; const shop = selectedShop?.name || selectedProduct.shop || "Baizona"; const np = typeof selectedProduct.price === 'number' ? selectedProduct.price : Number(String(selectedProduct.price).replace(/[^0-9]/g, "")); setCart(prev => { const ex = prev.find(i => i.id === selectedProduct.id); return ex ? prev.map(i => i.id === selectedProduct.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...selectedProduct, price: np, quantity: 1, shop }] }); trackCartAddition(selectedProduct); alert("Added to Cart!") }
  const addToCartDirect = (product, shopName) => { if (!requireCustomerAuth()) return; const np = typeof product.price === 'number' ? product.price : Number(String(product.price).replace(/[^0-9]/g, "")); setCart(prev => { const ex = prev.find(i => i.id === product.id); return ex ? prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...product, price: np, quantity: 1, shop: shopName }] }); trackCartAddition(product); alert("Added to Cart!") }
  const updateQuantity = (id, amt) => { setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + amt } : i).filter(i => i.quantity > 0)) }
  const cartGroupedByShop = cart.reduce((g, i) => { const s = i.shop || "Unknown"; if (!g[s]) g[s] = []; g[s].push(i); return g }, {})

  const handleWhatsAppOrder = (sn, p) => { if (!requireCustomerAuth()) return; trackWhatsAppClick(sn); trackLead(p.name, sn, "WhatsApp Order", loggedInCustomer?.id); window.open(`https://wa.me/${getShopWhatsApp(sn)}?text=${encodeURIComponent(`Hello ${sn}, I want: ${p.name} - ${p.price}\nFrom Baizona\nCustomer: ${loggedInCustomer?.name || ''} (${loggedInCustomer?.phone || ''})`)}`, "_blank") }
  const handleShopCheckoutWhatsApp = (sn, items) => { if (!requireCustomerAuth()) return; trackWhatsAppClick(sn); items.forEach(i => trackLead(i.name, sn, "Cart Checkout", loggedInCustomer?.id)); let txt = "", total = 0; items.forEach((i, idx) => { const st = i.price * i.quantity; total += st; txt += `${idx + 1}. ${i.name} (X${i.quantity}) - Tsh ${st.toLocaleString()}\n` }); window.open(`https://wa.me/${getShopWhatsApp(sn)}?text=${encodeURIComponent(`ORDER FROM BAIZONA\n\n${txt}\nTotal: Tsh ${total.toLocaleString()}\nCustomer: ${loggedInCustomer?.name || ''} (${loggedInCustomer?.phone || ''})`)}`, "_blank") }

  // ============ LOGIN ============
  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError("")
    if (!loginShopName || !loginPassword) { setLoginError("Fill shop name and password!"); return }
    const shop = dbShops.find(s => s.name.toLowerCase() === loginShopName.toLowerCase())
    if (!shop) { setLoginError("Shop not found!"); return }
    if (shop.status !== 'approved') { setLoginError("Shop not approved yet!"); return }
    if (shop.password !== loginPassword) { setLoginError("Wrong password!"); return }
    setIsLoggedIn(true); setIsAdmin(false); setIsCustomer(false); setLoggedInShop(shop)
    try { const stats = await calculateShopStats(shop.name); setShopStats(stats) } catch {}
    try { localStorage.setItem("baizona_auth", JSON.stringify({ shopName: shop.name, password: shop.password, isAdmin: false })) } catch {}
    setLoginShopName(""); setLoginPassword("")
  }

  const handleAdminLogin = (e) => {
    e.preventDefault(); setLoginError("")
    if (!loginEmail || !loginAdminPassword) { setLoginError("Fill email and password!"); return }
    if (loginEmail === ADMIN_EMAIL && loginAdminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true); setIsLoggedIn(true); setIsCustomer(false); setLoginEmail(""); setLoginAdminPassword(""); setPage("dashboard")
      try { localStorage.setItem("baizona_auth", JSON.stringify({ isAdmin: true })) } catch {}
      calculateAdminStats().then(s => setAdminStats(s))
    } else setLoginError("Wrong email or password!")
  }

  const handleLogout = () => {
    setIsLoggedIn(false); setLoggedInShop(null); setIsAdmin(false); setIsCustomer(false); setLoggedInCustomer(null)
    setShopStats({ totalViews: 0, whatsappClicks: 0, cartAdditions: 0, totalProducts: 0 })
    setLoginError(""); setAdminTab("overview"); setPage("home"); setShowProfileSettings(false); setShowCustomerAuth(false); setShowShopRegister(false); setShowCustomerProfile(false)
    try { localStorage.removeItem("baizona_auth") } catch {}
  }

  // ============ ADMIN FUNCTIONS ============
  const handleAddShop = async (e) => {
    e.preventDefault(); setAdminMessage("")
    if (!newShopData.name || !newShopData.password || !newShopData.category) { setAdminMessage("❌ Fill: Name, Category, Password!"); return }
    let logoUrl = newShopData.logo || "🏪"
    if (newShopData.logoFile) { const uploaded = await uploadImage(newShopData.logoFile); if (uploaded) logoUrl = uploaded }
    const { error } = await supabase.from('shops').insert([{ name: newShopData.name, logo: logoUrl, category: newShopData.category, description: newShopData.description || "", location: newShopData.location || "", phone: newShopData.phone || "", email: newShopData.email || "", working_hours: newShopData.working_hours || "Mon - Sat: 8AM - 6PM", rating: newShopData.rating || "4.0", password: newShopData.password, status: newShopData.status }])
    if (error) { setAdminMessage("❌ Failed: " + error.message) }
    else { setAdminMessage("✅ Shop added!"); setNewShopData({ name: "", logo: "", logoFile: null, category: "Electronics", description: "", location: "", phone: "", email: "", working_hours: "Mon - Sat: 8AM - 6PM", rating: "4.0", password: "", status: "approved" }); fetchAllShops(); calculateAdminStats().then(s => setAdminStats(s)) }
  }

  const handleApproveShop = async (shop) => {
    const { error } = await supabase.from('shops').update({ status: 'approved' }).eq('id', shop.id)
    if (error) { setAdminMessage("❌ Failed: " + error.message) }
    else { setAdminMessage(`✅ "${shop.name}" approved!`); fetchAllShops(); calculateAdminStats().then(s => setAdminStats(s)) }
  }

  const handleRejectShop = async (shop) => {
    if (confirm(`Reject "${shop.name}"?`)) { const { error } = await supabase.from('shops').delete().eq('id', shop.id); if (error) { setAdminMessage("❌ Failed: " + error.message) } else { setAdminMessage(`❌ "${shop.name}" rejected!`); fetchAllShops(); calculateAdminStats().then(s => setAdminStats(s)) } }
  }

  const handleUpdateShop = async (e) => { e.preventDefault(); if (!editingShop?.name) { alert("Name required!"); return }; let logoUrl = editingShop.logo || "🏪"; if (editingShop.logoFile) { const uploaded = await uploadImage(editingShop.logoFile); if (uploaded) logoUrl = uploaded }; const { error } = await supabase.from('shops').update({ name: editingShop.name, logo: logoUrl, category: editingShop.category, description: editingShop.description, location: editingShop.location, phone: editingShop.phone, email: editingShop.email, working_hours: editingShop.working_hours, rating: editingShop.rating, password: editingShop.password, status: editingShop.status }).eq('id', editingShop.id); if (error) { alert("Failed: " + error.message) } else { setEditingShop(null); fetchAllShops(); alert("✅ Saved!") } }

  const handleDeleteShop = async (id, name) => { if (confirm(`Delete "${name}"?`)) { try { await supabase.from('products').delete().eq('shop', name) } catch {}; try { await supabase.from('leads').delete().eq('shop_name', name) } catch {}; try { await supabase.from('analytics').delete().eq('shop_name', name) } catch {}; const { error } = await supabase.from('shops').delete().eq('id', id); if (error) { alert("Failed: " + error.message) } else { fetchAllShops(); fetchProducts(); fetchLeads(); alert("✅ Deleted!"); calculateAdminStats().then(s => setAdminStats(s)) } } }

  const handleAddProduct = async (e) => { e.preventDefault(); if (!newProduct.name || !newProduct.price) { alert("Fill name and price!"); return }; let imageUrl = newProduct.image || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500"; if (newProduct.imageFile) { const uploaded = await uploadImage(newProduct.imageFile); if (uploaded) imageUrl = uploaded }; const { error } = await supabase.from('products').insert([{ name: newProduct.name, price: newProduct.price, description: newProduct.description || "", image: imageUrl, shop: loggedInShop?.name || newProduct.shop }]); if (error) { alert("Failed: " + error.message) } else { alert("✅ Product added!"); setNewProduct({ name: "", price: "", description: "", image: "", imageFile: null, shop: loggedInShop?.name || "" }); fetchProducts(); if (loggedInShop) { try { const stats = await calculateShopStats(loggedInShop.name); setShopStats(stats) } catch {} } } }

  const handleDeleteProduct = async (pid) => { if (confirm("Delete?")) { await supabase.from('products').delete().eq('id', pid); fetchProducts() } }
  const getShopLeads = (sn) => dbLeads.filter(l => l.shop_name === sn)
  const getCustomerLeads = () => dbLeads.filter(l => l.customer_id === loggedInCustomer?.id)
  const navigateTo = (p) => { setPage(p); setShowProfileSettings(false); setSelectedCategory("All"); setShowCustomerAuth(false); setShowShopRegister(false); setShowCustomerProfile(false) }

  const compactGrid = { display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(160px, 1fr))", gap: isMobile ? "8px" : "12px", marginTop: "10px" }
  const inputStyle = { width: "100%", padding: "10px", borderRadius: "8px", background: "#0f172a", color: "white", border: "1px solid rgba(255,255,255,0.15)", fontSize: "13px", outline: "none", boxSizing: "border-box" }
  const btn = (bg, c = "white") => ({ padding: "10px 16px", borderRadius: "10px", background: bg, color: c, border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "13px", width: "100%" })

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", fontFamily: "Arial, sans-serif", paddingBottom: isMobile ? "75px" : "0px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "10px 15px 8px" : "12px 25px 10px", background: "rgba(15,23,42,0.95)", position: "sticky", top: 0, zIndex: 1000, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", flexDirection: "column", cursor: "pointer" }} onClick={() => navigateTo("home")}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", fontSize: "14px" }}>B</div>
            <span style={{ fontWeight: "bold", fontSize: isMobile ? "18px" : "20px", background: "linear-gradient(to right,#60a5fa,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Baizona</span>
          </div>
          <span style={{ fontSize: isMobile ? "9px" : "10px", color: "#94a3b8", marginTop: "1px", marginLeft: "40px", fontStyle: "italic" }}>Chimbo la Machimbo</span>
        </div>
        {!isMobile && (
          <div style={{ display: "flex", gap: "20px", alignItems: "center", fontWeight: "bold", fontSize: "13px" }}>
            <span onClick={() => navigateTo("home")} style={{ cursor: "pointer", color: page === "home" ? "#38bdf8" : "#cbd5e1" }}>🏠 Home</span>
            <span onClick={() => navigateTo("shops")} style={{ cursor: "pointer", color: page === "shops" ? "#38bdf8" : "#cbd5e1" }}>🏪 Shops</span>
            <span onClick={() => navigateTo("cart")} style={{ cursor: "pointer", color: page === "cart" ? "#38bdf8" : "#cbd5e1" }}>🛒 Cart ({cart.reduce((a,b)=>a+b.quantity,0)})</span>
            <span onClick={() => navigateTo("dashboard")} style={{ cursor: "pointer", color: page === "dashboard" ? "#a855f7" : "#cbd5e1" }}>📊 Dashboard</span>
            {isCustomer && <span onClick={openCustomerProfile} style={{ color: "#4ade80", fontSize: "11px", cursor: "pointer" }}>👤 {loggedInCustomer?.name}</span>}
            {isLoggedIn && <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "none", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>Logout</button>}
          </div>
        )}
      </div>

      {/* CUSTOMER PROFILE MODAL */}
      {showCustomerProfile && loggedInCustomer && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
          <div style={{ background: "#1e293b", padding: isMobile ? "16px" : "24px", borderRadius: "16px", maxWidth: "450px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ textAlign: "center", marginBottom: "12px", fontSize: "16px" }}>👤 My Profile</h3>
            {customerProfileMsg && <div style={{ background: customerProfileMsg.startsWith("✅") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: customerProfileMsg.startsWith("✅") ? "#4ade80" : "#f87171", padding: "8px", borderRadius: "8px", marginBottom: "10px", fontSize: "11px", textAlign: "center" }}>{customerProfileMsg}</div>}
            <form onSubmit={handleCustomerProfileUpdate}>
              <label style={{ fontSize: "10px", color: "#94a3b8" }}>Name</label>
              <input type="text" value={customerProfileForm.name} onChange={(e) => setCustomerProfileForm({...customerProfileForm, name: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
              <label style={{ fontSize: "10px", color: "#94a3b8" }}>Phone</label>
              <input type="text" value={customerProfileForm.phone} onChange={(e) => setCustomerProfileForm({...customerProfileForm, phone: e.target.value})} style={{...inputStyle, marginBottom: "12px"}} />
              <hr style={{ borderColor: "rgba(255,255,255,0.06)", margin: "10px 0" }} />
              <label style={{ fontSize: "10px", color: "#fbbf24" }}>🔐 Current Password *</label>
              <input type="password" placeholder="Required to save changes" value={customerProfileForm.currentPassword} onChange={(e) => setCustomerProfileForm({...customerProfileForm, currentPassword: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
              <label style={{ fontSize: "10px", color: "#94a3b8" }}>New Password (optional)</label>
              <input type="password" placeholder="Leave blank to keep" value={customerProfileForm.newPassword} onChange={(e) => setCustomerProfileForm({...customerProfileForm, newPassword: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
              <label style={{ fontSize: "10px", color: "#94a3b8" }}>Confirm New Password</label>
              <input type="password" placeholder="Confirm" value={customerProfileForm.confirmNewPassword} onChange={(e) => setCustomerProfileForm({...customerProfileForm, confirmNewPassword: e.target.value})} style={{...inputStyle, marginBottom: "12px"}} />
              <button type="submit" style={btn("linear-gradient(to right, #3b82f6, #8b5cf6)")}>💾 Save Profile</button>
            </form>
            {/* Customer Order History */}
            <div style={{ marginTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
              <h4 style={{ fontSize: "13px", marginBottom: "8px" }}>📦 My Orders ({getCustomerLeads().length})</h4>
              {getCustomerLeads().length === 0 ? <p style={{ color: "#64748b", fontSize: "10px", textAlign: "center" }}>No orders yet</p> :
                getCustomerLeads().map(l => (
                  <div key={l.id} style={{ background: "rgba(255,255,255,0.03)", padding: "8px", borderRadius: "6px", marginBottom: "4px", fontSize: "10px", display: "flex", justifyContent: "space-between" }}>
                    <div><strong>{l.product_name}</strong><div style={{ color: "#94a3b8" }}>🏪 {l.shop_name}</div></div>
                    <span style={{ fontSize: "8px", padding: "2px 6px", borderRadius: "8px", background: l.status === "New" ? "rgba(59,130,246,0.2)" : "rgba(34,197,94,0.2)", color: l.status === "New" ? "#60a5fa" : "#4ade80" }}>{l.status}</span>
                  </div>
                ))
              }
            </div>
            <button onClick={() => setShowCustomerProfile(false)} style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "10px" }}>✕ Close</button>
          </div>
        </div>
      )}

      {/* SHOP REGISTRATION MODAL */}
      {showShopRegister && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
          <div style={{ background: "#1e293b", padding: isMobile ? "16px" : "24px", borderRadius: "16px", maxWidth: "550px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ textAlign: "center", marginBottom: "14px" }}><div style={{ fontSize: "30px" }}>🏪</div><h2 style={{ fontSize: "17px", margin: "0" }}>Register Your Shop</h2><p style={{ color: "#94a3b8", fontSize: "10px", marginTop: "4px" }}>Fill in shop details. Admin will approve.</p></div>
            {shopRegError && <div style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "8px", borderRadius: "8px", marginBottom: "10px", fontSize: "11px", textAlign: "center" }}>{shopRegError}</div>}
            {shopRegMessage && <div style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", padding: "8px", borderRadius: "8px", marginBottom: "10px", fontSize: "11px", textAlign: "center" }}>{shopRegMessage}</div>}
            <form onSubmit={handleShopRegister} style={{ display: "grid", gap: "8px" }}>
              <input type="text" placeholder="Shop Name *" value={shopRegForm.name} onChange={(e) => setShopRegForm({...shopRegForm, name: e.target.value})} style={inputStyle} />
              <select value={shopRegForm.category} onChange={(e) => setShopRegForm({...shopRegForm, category: e.target.value})} style={{...inputStyle, background: "#1e293b"}}>{categories.filter(c=>c!=="All").map(c=><option key={c} value={c}>{c}</option>)}</select>
              <input type="text" placeholder="Phone (WhatsApp) *" value={shopRegForm.phone} onChange={(e) => setShopRegForm({...shopRegForm, phone: e.target.value})} style={inputStyle} />
              <input type="text" placeholder="Email (optional)" value={shopRegForm.email} onChange={(e) => setShopRegForm({...shopRegForm, email: e.target.value})} style={inputStyle} />
              <input type="text" placeholder="Location" value={shopRegForm.location} onChange={(e) => setShopRegForm({...shopRegForm, location: e.target.value})} style={inputStyle} />
              <input type="text" placeholder="Working Hours" value={shopRegForm.working_hours} onChange={(e) => setShopRegForm({...shopRegForm, working_hours: e.target.value})} style={inputStyle} />
              <textarea placeholder="Description (optional)" value={shopRegForm.description} onChange={(e) => setShopRegForm({...shopRegForm, description: e.target.value})} style={{...inputStyle, minHeight: "50px"}} />
              <input type="password" placeholder="Password *" value={shopRegForm.password} onChange={(e) => setShopRegForm({...shopRegForm, password: e.target.value})} style={inputStyle} />
              <input type="password" placeholder="Confirm Password *" value={shopRegForm.confirmPassword} onChange={(e) => setShopRegForm({...shopRegForm, confirmPassword: e.target.value})} style={inputStyle} />
              <div><label style={{ fontSize: "10px", color: "#94a3b8" }}>Logo (optional)</label><input type="file" accept="image/*" onChange={(e) => setShopRegForm({...shopRegForm, logoFile: e.target.files[0]})} style={inputStyle} /></div>
              <button type="submit" style={btn("linear-gradient(to right, #22c55e, #16a34a)")}>📝 Register Shop</button>
            </form>
            <button onClick={() => setShowShopRegister(false)} style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "10px" }}>✕ Close</button>
          </div>
        </div>
      )}

      {/* CUSTOMER AUTH MODAL */}
      {showCustomerAuth && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
          <div style={{ background: "#1e293b", padding: isMobile ? "20px" : "30px", borderRadius: "16px", maxWidth: "420px", width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}><div style={{ fontSize: "35px" }}>{customerAuthMode === "login" ? "👤" : "✨"}</div><h2 style={{ fontSize: "18px", margin: "0" }}>{customerAuthMode === "login" ? "Welcome Back!" : "Create Account"}</h2></div>
            {customerError && <div style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "8px", borderRadius: "8px", marginBottom: "10px", fontSize: "11px", textAlign: "center" }}>{customerError}</div>}
            {customerMessage && <div style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", padding: "8px", borderRadius: "8px", marginBottom: "10px", fontSize: "11px", textAlign: "center" }}>{customerMessage}</div>}
            {customerAuthMode === "register" ? (
              <form onSubmit={handleCustomerRegister}>
                <input type="text" placeholder="Full Name *" value={customerForm.name} onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
                <input type="text" placeholder="Phone *" value={customerForm.phone} onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
                <input type="password" placeholder="Password *" value={customerForm.password} onChange={(e) => setCustomerForm({...customerForm, password: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
                <input type="password" placeholder="Confirm Password *" value={customerForm.confirmPassword} onChange={(e) => setCustomerForm({...customerForm, confirmPassword: e.target.value})} style={{...inputStyle, marginBottom: "12px"}} />
                <button type="submit" style={btn("linear-gradient(to right, #3b82f6, #8b5cf6)")}>📝 Register</button>
              </form>
            ) : (
              <form onSubmit={handleCustomerLogin}>
                <input type="text" placeholder="Phone number" value={customerForm.phone} onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
                <input type="password" placeholder="Password" value={customerForm.password} onChange={(e) => setCustomerForm({...customerForm, password: e.target.value})} style={{...inputStyle, marginBottom: "12px"}} />
                <button type="submit" style={btn("linear-gradient(to right, #22c55e, #16a34a)")}>🔓 Login</button>
              </form>
            )}
            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <button onClick={() => { setCustomerAuthMode(customerAuthMode === "login" ? "register" : "login"); setCustomerError(""); setCustomerMessage("") }} style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "11px", fontWeight: "bold" }}>{customerAuthMode === "login" ? "👈 Register" : "👈 Login"}</button>
            </div>
            <button onClick={() => setShowCustomerAuth(false)} style={{ display: "block", margin: "8px auto 0", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "10px" }}>✕ Close</button>
          </div>
        </div>
      )}

      {/* HOME PAGE */}
      {page === "home" && (
        <>
          <div style={{ padding: isMobile ? "8px 12px" : "10px 20px", overflowX: "auto", whiteSpace: "nowrap" }}>
            <div style={{ display: "flex", gap: "8px" }}>{categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold", cursor: "pointer", border: "none", background: selectedCategory === cat ? "#3b82f6" : "rgba(255,255,255,0.06)", color: "white", whiteSpace: "nowrap", flexShrink: 0 }}>{cat === "All" ? "🌟 All" : cat}</button>))}</div>
          </div>
          <div style={{ padding: isMobile ? "6px 12px" : "8px 20px" }}>
            <input type="text" placeholder="🔍 Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", maxWidth: "500px", padding: "10px", borderRadius: "25px", border: "none", outline: "none", fontSize: "12px", background: "rgba(255,255,255,0.08)", color: "white", display: "block", margin: "0 auto" }} />
          </div>
          {searchQuery === "" && (
            <div style={{ padding: isMobile ? "8px 12px" : "10px 20px" }}>
              <h2 style={{ fontSize: isMobile ? "13px" : "16px", marginBottom: "6px" }}>🏪 Popular Shops</h2>
              <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>{filteredShops.slice(0, 4).map((shop, i) => (<div key={i} onClick={() => { setSelectedShop(shop); navigateTo("shopProfile") }} style={{ minWidth: isMobile ? "120px" : "160px", padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg,#1e3a5f,#2d1b69)", cursor: "pointer", textAlign: "center", flexShrink: 0 }}>{shop.logo && shop.logo.startsWith("http") ? <img src={shop.logo} style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", marginBottom: "4px" }} alt={shop.name} /> : <div style={{ fontSize: "28px" }}>{shop.logo || "🏪"}</div>}<div style={{ fontWeight: "bold", fontSize: "11px" }}>{shop.name}</div><div style={{ fontSize: "9px", color: "#94a3b8" }}>{shop.category}</div></div>))}</div>
            </div>
          )}
          <div style={{ padding: isMobile ? "8px 12px" : "10px 20px" }}>
            <h2 style={{ fontSize: isMobile ? "13px" : "16px", marginBottom: "6px" }}>{searchQuery || selectedCategory !== "All" ? `Results (${filteredProducts.length})` : "✨ Trending Products"}</h2>
            <div style={compactGrid}>{filteredProducts.map(product => (<div key={product.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", overflow: "hidden" }}><div style={{ height: isMobile ? "100px" : "130px", overflow: "hidden", cursor: "pointer" }} onClick={() => { setSelectedProduct(product); trackProductView(product); navigateTo("productDetails") }}><img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div><div style={{ padding: "7px" }}><span style={{ fontSize: "8px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "1px 5px", borderRadius: "8px" }}>{product.shop}</span><h3 style={{ margin: "3px 0", fontSize: "11px", fontWeight: "bold" }}>{product.name.length > 22 ? product.name.substring(0,22)+'...' : product.name}</h3><p style={{ color: "#38bdf8", fontWeight: "bold", fontSize: "11px", margin: "2px 0" }}>{product.price}</p><button onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); trackProductView(product); navigateTo("productDetails") }} style={{ ...btn("linear-gradient(to right,#3b82f6,#8b5cf6)"), padding: "5px", fontSize: "9px", marginTop: "3px" }}>View 👀</button></div></div>))}</div>
          </div>
        </>
      )}

      {/* SHOPS PAGE */}
      {page === "shops" && (
        <div style={{ padding: isMobile ? "12px" : "20px", maxWidth: "1000px", margin: "0 auto" }}>
          <h1 style={{ fontSize: isMobile ? "18px" : "24px", marginBottom: "8px" }}>Explore Shops 🏪</h1>
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "8px", marginBottom: "10px" }}>{categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: "5px 12px", borderRadius: "16px", fontSize: "10px", fontWeight: "bold", cursor: "pointer", border: "none", background: selectedCategory === cat ? "#3b82f6" : "rgba(255,255,255,0.06)", color: "white", whiteSpace: "nowrap", flexShrink: 0 }}>{cat === "All" ? "🌟 All" : cat}</button>))}</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>{filteredShops.map((shop, i) => (<div key={i} onClick={() => { setSelectedShop(shop); navigateTo("shopProfile") }} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "12px", cursor: "pointer", textAlign: "center" }}>{shop.logo && shop.logo.startsWith("http") ? <img src={shop.logo} style={{ width: "50px", height: "50px", borderRadius: "10px", objectFit: "cover", marginBottom: "4px" }} alt={shop.name} /> : <div style={{ fontSize: "28px" }}>{shop.logo || "🏪"}</div>}<h3 style={{ fontSize: "12px", margin: "4px 0" }}>{shop.name}</h3><span style={{ fontSize: "9px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "2px 7px", borderRadius: "8px" }}>{shop.category}</span><div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "4px" }}>⭐ {shop.rating} • 📦 {dbProducts.filter(p => p.shop === shop.name).length}</div></div>))}</div>
        </div>
      )}

      {/* SHOP PROFILE */}
      {page === "shopProfile" && selectedShop && (
        <div style={{ padding: isMobile ? "10px" : "20px", maxWidth: "1000px", margin: "0 auto" }}>
          <button onClick={() => navigateTo("shops")} style={{ ...btn("rgba(255,255,255,0.1)"), width: "auto", marginBottom: "10px", padding: "6px 14px", fontSize: "11px" }}>⬅ Back</button>
          <div style={{ background: "linear-gradient(135deg, #1e3a5f, #2d1b69)", borderRadius: "12px", padding: isMobile ? "12px" : "18px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
            {selectedShop.logo && selectedShop.logo.startsWith("http") ? <img src={selectedShop.logo} alt={selectedShop.name} style={{ width: "45px", height: "45px", borderRadius: "10px", objectFit: "cover" }} /> : <div style={{ width: "45px", height: "45px", borderRadius: "10px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "22px" }}>{selectedShop.logo || "🏪"}</div>}
            <div><h1 style={{ fontSize: isMobile ? "15px" : "20px", margin: 0 }}>{selectedShop.name}</h1><span style={{ fontSize: "9px", background: "rgba(56,189,248,0.2)", color: "#38bdf8", padding: "2px 7px", borderRadius: "8px" }}>{selectedShop.category}</span><div style={{ fontSize: "9px", color: "#94a3b8", marginTop: "2px" }}>⭐ {selectedShop.rating} • 📦 {dbProducts.filter(p => p.shop === selectedShop.name).length}</div></div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: "12px", borderRadius: "10px", marginBottom: "12px", fontSize: "11px", color: "#cbd5e1" }}>
            <p style={{ margin: "0 0 4px 0" }}>📍 {selectedShop.location}</p><p style={{ margin: 0 }}>🕐 {selectedShop.working_hours}</p>
            {isCustomer || isAdmin || loggedInShop ? (<div style={{ marginTop: "8px", padding: "8px", background: "rgba(34,197,94,0.1)", borderRadius: "8px" }}><p style={{ margin: "0 0 4px 0" }}>📞 {selectedShop.phone}</p><p style={{ margin: 0 }}>📧 {selectedShop.email}</p><button onClick={() => { trackWhatsAppClick(selectedShop.name); window.open(`https://wa.me/${getShopWhatsApp(selectedShop.name)}?text=Hello ${selectedShop.name}`, "_blank") }} style={{ ...btn("linear-gradient(to right, #22c55e, #16a34a)"), marginTop: "6px", padding: "6px", fontSize: "10px" }}>💬 Chat on WhatsApp</button></div>) : (<div style={{ marginTop: "8px", padding: "8px", background: "rgba(59,130,246,0.1)", borderRadius: "8px", textAlign: "center" }}><p style={{ margin: "0 0 6px 0", fontSize: "10px" }}>🔒 Login to see contacts</p><button onClick={() => { setShowCustomerAuth(true); setCustomerAuthMode("login") }} style={{ ...btn("linear-gradient(to right, #3b82f6, #8b5cf6)"), padding: "6px", fontSize: "10px" }}>👤 Login / Register</button></div>)}
          </div>
          <h2 style={{ fontSize: isMobile ? "12px" : "15px", marginBottom: "6px" }}>📦 Products ({dbProducts.filter(p => p.shop === selectedShop.name).length})</h2>
          <div style={compactGrid}>{dbProducts.filter(p => p.shop === selectedShop.name).map(product => (<div key={product.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", overflow: "hidden" }}><div style={{ height: isMobile ? "90px" : "120px", overflow: "hidden", cursor: "pointer" }} onClick={() => { setSelectedProduct(product); trackProductView(product); navigateTo("productDetails") }}><img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div><div style={{ padding: "7px" }}><h3 style={{ fontSize: "10px", margin: "2px 0" }}>{product.name.length > 18 ? product.name.substring(0,18)+'...' : product.name}</h3><p style={{ color: "#38bdf8", fontWeight: "bold", fontSize: "10px", margin: "2px 0" }}>{product.price}</p><button onClick={() => addToCartDirect(product, selectedShop.name)} style={{ ...btn("linear-gradient(to right, #3b82f6, #8b5cf6)"), padding: "4px", fontSize: "9px" }}>🛒 Add</button></div></div>))}</div>
        </div>
      )}

      {/* PRODUCT DETAILS */}
      {page === "productDetails" && selectedProduct && (
        <div style={{ padding: isMobile ? "10px" : "20px", maxWidth: "700px", margin: "0 auto" }}>
          <button onClick={() => navigateTo("home")} style={{ ...btn("rgba(255,255,255,0.1)"), width: "auto", marginBottom: "10px", padding: "6px 14px", fontSize: "11px" }}>⬅ Back</button>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "12px", overflow: "hidden" }}>
            <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: "100%", height: isMobile ? "180px" : "280px", objectFit: "cover" }} />
            <div style={{ padding: isMobile ? "10px" : "16px" }}><span style={{ color: "#a855f7", fontSize: "10px" }}>🏪 {selectedShop?.name || selectedProduct.shop}</span><h1 style={{ fontSize: isMobile ? "16px" : "20px", margin: "4px 0" }}>{selectedProduct.name}</h1><h2 style={{ color: "#38bdf8", fontSize: isMobile ? "16px" : "20px", margin: "2px 0" }}>{selectedProduct.price}</h2><p style={{ color: "#cbd5e1", fontSize: "12px", marginTop: "6px" }}>{selectedProduct.description}</p><div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "8px", marginTop: "10px" }}><button onClick={addToCart} style={{ ...btn("transparent"), border: "1px solid #3b82f6" }}>🛒 Add to Cart</button><button onClick={() => handleWhatsAppOrder(selectedShop?.name || selectedProduct.shop, selectedProduct)} style={btn("linear-gradient(to right,#22c55e,#16a34a)")}>📱 Order via WhatsApp</button></div></div>
          </div>
        </div>
      )}

      {/* CART PAGE */}
      {page === "cart" && (
        <div style={{ padding: isMobile ? "10px" : "20px", maxWidth: "700px", margin: "0 auto" }}>
          <h1 style={{ fontSize: isMobile ? "18px" : "22px" }}>Cart 🛒</h1>
          {cart.length === 0 ? <div style={{ background: "rgba(255,255,255,0.03)", padding: "30px", borderRadius: "10px", marginTop: "10px", textAlign: "center", fontSize: "12px" }}>Cart is empty</div> : Object.keys(cartGroupedByShop).map((sn) => { const items = cartGroupedByShop[sn]; const total = items.reduce((s, i) => s + (i.price * i.quantity), 0); return (<div key={sn} style={{ background: "rgba(30,41,59,0.5)", padding: "10px", borderRadius: "12px", marginBottom: "10px", marginTop: "10px" }}><h3 style={{ fontSize: "12px", color: "#38bdf8", marginBottom: "6px" }}>🏪 {sn}</h3>{items.map((item) => (<div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "10px" }}><div style={{ display: "flex", gap: "6px", alignItems: "center" }}><img src={item.image} style={{ width: "30px", height: "30px", borderRadius: "5px", objectFit: "cover" }} alt={item.name} /><span>{item.name} <span style={{ color: "#38bdf8" }}>x{item.quantity}</span></span></div><div style={{ display: "flex", gap: "5px" }}><button onClick={() => updateQuantity(item.id, -1)} style={{ width: "20px", height: "20px", borderRadius: "50%", border: "none", background: "#ef4444", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "10px" }}>-</button><button onClick={() => updateQuantity(item.id, 1)} style={{ width: "20px", height: "20px", borderRadius: "50%", border: "none", background: "#22c55e", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "10px" }}>+</button></div></div>))}<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}><strong style={{ fontSize: "12px", color: "#38bdf8" }}>Tsh {total.toLocaleString()}</strong><button onClick={() => handleShopCheckoutWhatsApp(sn, items)} style={{ ...btn("linear-gradient(to right, #22c55e, #16a34a)"), width: "auto", padding: "7px 12px", fontSize: "10px" }}>Send Order 📱</button></div></div>)})}
        </div>
      )}

      {/* DASHBOARD */}
      {page === "dashboard" && (
        <div style={{ padding: isMobile ? "10px" : "20px", maxWidth: "1000px", margin: "0 auto" }}>
          {!isLoggedIn ? (
            <div style={{ maxWidth: "400px", margin: "30px auto" }}>
              <div style={{ background: "rgba(30,41,59,0.8)", padding: "20px", borderRadius: "16px" }}>
                <div style={{ textAlign: "center", marginBottom: "14px" }}><div style={{ fontSize: "28px" }}>🔐</div><h2 style={{ fontSize: "18px", margin: "4px 0" }}>{isAdminMode ? "Admin Access" : "Shop Login"}</h2></div>
                {isAdminMode ? (<form onSubmit={handleAdminLogin}>{loginError && <div style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "6px", borderRadius: "6px", marginBottom: "6px", fontSize: "10px", textAlign: "center" }}>{loginError}</div>}<input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ ...inputStyle, marginBottom: "6px" }} /><input type="password" placeholder="Password" value={loginAdminPassword} onChange={(e) => setLoginAdminPassword(e.target.value)} style={{ ...inputStyle, marginBottom: "10px" }} /><button type="submit" style={btn("linear-gradient(to right, #dc2626, #ef4444)")}>Login 🔑</button></form>) : (<form onSubmit={handleLogin}>{loginError && <div style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", padding: "6px", borderRadius: "6px", marginBottom: "6px", fontSize: "10px" }}>{loginError}</div>}<div style={{ marginBottom: "6px" }}><label style={{ color: "#94a3b8", fontSize: "11px" }}>Shop Name</label><input type="text" placeholder="Enter shop name..." value={loginShopName} onChange={(e) => setLoginShopName(e.target.value)} style={inputStyle} /></div><div style={{ marginBottom: "10px" }}><label style={{ color: "#94a3b8", fontSize: "11px" }}>Password</label><input type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={inputStyle} /></div><button type="submit" style={btn("linear-gradient(to right, #3b82f6, #8b5cf6)")}>Login 📊</button></form>)}
                <div style={{ textAlign: "center", marginTop: "14px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}><p style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "6px" }}>Don't have a shop yet?</p><button onClick={() => { setShowShopRegister(true); setPage("dashboard") }} style={{ ...btn("linear-gradient(to right, #22c55e, #16a34a)"), padding: "10px", fontSize: "12px" }}>🏪 Register Your Shop</button></div>
              </div>
            </div>
          ) : isAdmin ? (
            <div style={{ maxWidth: "900px", margin: "0 auto" }}>
              <div style={{ background: "linear-gradient(135deg, #1e1e3f, #2d1b4e)", borderRadius: "12px", padding: "14px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}><div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ fontSize: "24px" }}>🛡️</span><div><strong style={{ fontSize: "15px" }}>Baizona Admin</strong><p style={{ margin: 0, fontSize: "10px", color: "#94a3b8" }}>{adminStats.totalShops} shops • {adminStats.pendingShops} pending</p></div></div><button onClick={handleLogout} style={{ padding: "6px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.2)", color: "#f87171", border: "none", cursor: "pointer", fontSize: "10px", fontWeight: "bold" }}>🚪 Logout</button></div>
              <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>{[{ id: "overview", icon: "📈", label: "Overview" },{ id: "pending", icon: "⏳", label: `Pending (${adminStats.pendingShops})` },{ id: "addShop", icon: "🏪", label: "+ Add Shop" },{ id: "manageShops", icon: "⚙️", label: "All Shops" },{ id: "products", icon: "📦", label: "Products" },{ id: "leads", icon: "📨", label: "Leads" },{ id: "customers", icon: "👥", label: `Customers (${adminStats.totalCustomers})` }].map(tab => (<button key={tab.id} onClick={() => setAdminTab(tab.id)} style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "10px", fontWeight: "bold", cursor: "pointer", border: "none", background: adminTab === tab.id ? "#3b82f6" : "rgba(255,255,255,0.06)", color: "white", whiteSpace: "nowrap" }}>{tab.icon} {tab.label}</button>))}</div>
              {adminMessage && <div style={{ background: adminMessage.startsWith("✅") ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: adminMessage.startsWith("✅") ? "#4ade80" : "#f87171", padding: "10px", borderRadius: "8px", marginBottom: "10px", fontSize: "12px", textAlign: "center" }}>{adminMessage}</div>}
              {adminTab === "overview" && (<div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "8px" }}>{[{ icon: "🏪", label: "Shops", value: adminStats.totalShops, color: "#3b82f6" },{ icon: "⏳", label: "Pending", value: adminStats.pendingShops, color: "#fbbf24" },{ icon: "📦", label: "Products", value: adminStats.totalProducts, color: "#22c55e" },{ icon: "👥", label: "Customers", value: adminStats.totalCustomers, color: "#a78bfa" },{ icon: "👁️", label: "Views", value: adminStats.totalViews, color: "#38bdf8" },{ icon: "💬", label: "WA Clicks", value: adminStats.totalWhatsappClicks, color: "#34d399" },{ icon: "🛒", label: "Cart", value: adminStats.totalCartAdditions, color: "#f472b6" },{ icon: "📨", label: "Leads", value: adminStats.totalLeads, color: "#fbbf24" }].map((s, i) => (<div key={i} style={{ background: "rgba(255,255,255,0.04)", padding: "14px", borderRadius: "10px", textAlign: "center" }}><div style={{ fontSize: "20px" }}>{s.icon}</div><div style={{ fontSize: "18px", fontWeight: "bold", color: s.color }}>{s.value}</div><div style={{ fontSize: "9px", color: "#94a3b8" }}>{s.label}</div></div>))}</div>)}
              {adminTab === "pending" && (<div><h3 style={{ fontSize: "14px", marginBottom: "10px" }}>⏳ Pending Approvals</h3>{dbShops.filter(s => s.status === 'pending').map((shop, i) => (<div key={i} style={{ background: "rgba(255,255,255,0.04)", padding: "14px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}><div><strong>{shop.logo||"🏪"} {shop.name}</strong><div style={{ fontSize: "10px", color: "#94a3b8" }}>{shop.category} | 📞 {shop.phone}</div></div><div style={{ display: "flex", gap: "6px" }}><button onClick={() => handleApproveShop(shop)} style={{ background: "#22c55e", color: "white", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "10px" }}>✅ Approve</button><button onClick={() => handleRejectShop(shop)} style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "10px" }}>❌ Reject</button></div></div>))}</div>)}
            </div>
          ) : (
            // SHOP OWNER DASHBOARD - IMPROVED
            <>
              <div style={{ background: "linear-gradient(135deg, #1e3a5f, #2d1b69)", borderRadius: "10px", padding: "12px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <strong style={{ fontSize: "14px" }}>{loggedInShop?.logo && loggedInShop.logo.startsWith("http") ? <img src={loggedInShop.logo} style={{ width: "20px", height: "20px", borderRadius: "4px", verticalAlign: "middle", marginRight: "4px", objectFit: "cover" }} alt="" /> : loggedInShop?.logo} {loggedInShop?.name}</strong>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => { setShowProfileSettings(true); setProfileForm({ owner_name: loggedInShop?.owner_name || "", phone: loggedInShop?.phone || "", email: loggedInShop?.email || "", current_password: "", new_password: "", confirm_password: "" }) }} style={{ ...btn("rgba(255,255,255,0.15)"), width: "auto", padding: "6px 12px", fontSize: "10px" }}>⚙️ Settings</button>
                  <button onClick={handleLogout} style={{ ...btn("rgba(239,68,68,0.2)", "#f87171"), width: "auto", padding: "6px 12px", fontSize: "10px" }}>Logout</button>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", marginBottom: "8px" }}>
                {[{ l: "Views", v: shopStats.totalViews },{ l: "WA Clicks", v: shopStats.whatsappClicks },{ l: "Cart", v: shopStats.cartAdditions },{ l: "Products", v: shopStats.totalProducts }].map((s, i) => (<div key={i} style={{ background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "8px", textAlign: "center", fontSize: "10px" }}><strong style={{ fontSize: "13px" }}>{s.v}</strong><br />{s.l}</div>))}
              </div>

              {/* Add Product */}
              <form onSubmit={handleAddProduct} style={{ background: "rgba(30,41,59,0.4)", padding: "10px", borderRadius: "10px", marginBottom: "8px" }}>
                <h4 style={{ fontSize: "12px", marginBottom: "6px" }}>➕ Add Product</h4>
                <input type="text" placeholder="Product Name" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} style={{...inputStyle, marginBottom: "5px"}} />
                <input type="text" placeholder="Price (Tsh)" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} style={{...inputStyle, marginBottom: "5px"}} />
                <input type="file" accept="image/*" onChange={(e) => setNewProduct({...newProduct, imageFile: e.target.files[0]})} style={{...inputStyle, marginBottom: "5px"}} />
                <textarea placeholder="Description (optional)" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} style={{...inputStyle, marginBottom: "5px", minHeight: "40px"}} />
                <button type="submit" style={btn("linear-gradient(to right, #22c55e, #16a34a)")}>➕ Add Product</button>
              </form>

              {/* My Products */}
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "10px", marginBottom: "8px" }}>
                <h4 style={{ fontSize: "12px", marginBottom: "6px" }}>📦 My Products ({dbProducts.filter(p => p.shop === loggedInShop?.name).length})</h4>
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {dbProducts.filter(p => p.shop === loggedInShop?.name).map(prod => (
                    <div key={prod.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><img src={prod.image} style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover" }} alt="" /><span>{prod.name} - <span style={{ color: "#38bdf8" }}>{prod.price}</span></span></div>
                      <button onClick={() => handleDeleteProduct(prod.id)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "12px" }}>🗑️</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* My Leads */}
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "10px" }}>
                <h4 style={{ fontSize: "12px", marginBottom: "6px" }}>📨 My Leads ({getShopLeads(loggedInShop?.name).length})</h4>
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {getShopLeads(loggedInShop?.name).length === 0 ? <p style={{ color: "#64748b", fontSize: "10px", textAlign: "center" }}>No leads yet</p> :
                    getShopLeads(loggedInShop?.name).map(lead => (
                      <div key={lead.id} style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "10px" }}>
                        <strong>{lead.product_name}</strong>
                        <span style={{ fontSize: "8px", marginLeft: "6px", padding: "2px 6px", borderRadius: "8px", background: lead.status === "New" ? "rgba(59,130,246,0.2)" : "rgba(34,197,94,0.2)", color: lead.status === "New" ? "#60a5fa" : "#4ade80" }}>{lead.status}</span>
                        <div style={{ color: "#94a3b8", fontSize: "9px" }}>{lead.customer_action}</div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Shop Settings Modal */}
              {showProfileSettings && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
                  <div style={{ background: "#1e293b", padding: "20px", borderRadius: "16px", maxWidth: "450px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
                    <h3 style={{ textAlign: "center", marginBottom: "12px", fontSize: "16px" }}>⚙️ Shop Settings</h3>
                    {profileMessage && <div style={{ background: profileMessage.startsWith("✅") ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: profileMessage.startsWith("✅") ? "#4ade80" : "#f87171", padding: "8px", borderRadius: "8px", marginBottom: "10px", fontSize: "11px", textAlign: "center" }}>{profileMessage}</div>}
                    <form onSubmit={async (e) => { e.preventDefault(); setProfileMessage(""); if (profileForm.current_password !== loggedInShop?.password) { setProfileMessage("❌ Current password wrong!"); return } if (profileForm.new_password && profileForm.new_password !== profileForm.confirm_password) { setProfileMessage("❌ New passwords don't match!"); return } const updateData = { phone: profileForm.phone, email: profileForm.email, owner_name: profileForm.owner_name }; if (profileForm.new_password) updateData.password = profileForm.new_password; const { error } = await supabase.from('shops').update(updateData).eq('id', loggedInShop.id); if (error) { setProfileMessage("❌ Failed: " + error.message) } else { setProfileMessage("✅ Settings saved!"); const { data } = await supabase.from('shops').select('*').eq('id', loggedInShop.id).single(); if (data) { setLoggedInShop(data); try { localStorage.setItem("baizona_auth", JSON.stringify({ shopName: data.name, password: data.password, isAdmin: false })) } catch {} } } }}>
                      <label style={{ fontSize: "10px", color: "#94a3b8" }}>Shop Name</label><input type="text" value={loggedInShop?.name || ""} disabled style={{...inputStyle, opacity: 0.6, marginBottom: "8px"}} />
                      <label style={{ fontSize: "10px", color: "#94a3b8" }}>Owner Name</label><input type="text" value={profileForm.owner_name} onChange={(e) => setProfileForm({...profileForm, owner_name: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
                      <label style={{ fontSize: "10px", color: "#94a3b8" }}>Phone</label><input type="text" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
                      <label style={{ fontSize: "10px", color: "#94a3b8" }}>Email</label><input type="email" value={profileForm.email} onChange={(e) => setProfileForm({...profileForm, email: e.target.value})} style={{...inputStyle, marginBottom: "12px"}} />
                      <hr style={{ borderColor: "rgba(255,255,255,0.06)", margin: "10px 0" }} />
                      <label style={{ fontSize: "10px", color: "#fbbf24" }}>🔐 Current Password *</label><input type="password" value={profileForm.current_password} onChange={(e) => setProfileForm({...profileForm, current_password: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
                      <label style={{ fontSize: "10px", color: "#94a3b8" }}>New Password</label><input type="password" value={profileForm.new_password} onChange={(e) => setProfileForm({...profileForm, new_password: e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
                      <label style={{ fontSize: "10px", color: "#94a3b8" }}>Confirm New Password</label><input type="password" value={profileForm.confirm_password} onChange={(e) => setProfileForm({...profileForm, confirm_password: e.target.value})} style={{...inputStyle, marginBottom: "12px"}} />
                      <button type="submit" style={btn("linear-gradient(to right, #fbbf24, #f59e0b)", "black")}>💾 Save Settings</button>
                    </form>
                    <button onClick={() => setShowProfileSettings(false)} style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "10px" }}>✕ Close</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(15,23,42,0.98)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 5px 20px 5px", zIndex: 1000 }}>
          {[
            { id: "home", label: "Home", color: "#38bdf8", icon: (active) => (<svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#38bdf8" : "none"} stroke={active ? "#38bdf8" : "#94a3b8"} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>)},
            { id: "shops", label: "Shops", color: "#38bdf8", icon: (active) => (<svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#38bdf8" : "none"} stroke={active ? "#38bdf8" : "#94a3b8"} strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>)},
            { id: "cart", label: "Cart", color: "#38bdf8", badge: cart.reduce((a,b)=>a+b.quantity,0), icon: (active) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#38bdf8" : "#94a3b8"} strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>)},
            { id: "dashboard", label: "Dash", color: "#a855f7", icon: (active) => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#a855f7" : "#94a3b8"} strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>)}
          ].map(tab => (
            <div key={tab.id} onClick={() => navigateTo(tab.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "3px", position: "relative", padding: "4px 14px" }}>
              {tab.icon(page === tab.id)}
              {tab.badge > 0 && <span style={{ position: "absolute", top: "-2px", right: "calc(50% - 18px)", background: "#ef4444", color: "white", fontSize: "9px", fontWeight: "bold", minWidth: "16px", height: "16px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center" }}>{tab.badge}</span>}
              <span style={{ fontSize: "9px", fontWeight: page === tab.id ? "bold" : "normal", color: page === tab.id ? tab.color : "#94a3b8" }}>{tab.label}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}