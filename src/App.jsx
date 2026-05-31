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
  const [pageHistory, setPageHistory] = useState(["home"])
  const [selectedShop, setSelectedShop] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Zote")
  const [shopType, setShopType] = useState("Rejareja")
  const [dbProducts, setDbProducts] = useState([])
  const [dbShops, setDbShops] = useState([])
  const [dbLeads, setDbLeads] = useState([])
  const [dbCustomers, setDbCustomers] = useState([])
  const isMobile = useIsMobile()

  useEffect(() => {
    const handlePopState = () => {
      if (pageHistory.length > 1) {
        const newHistory = [...pageHistory]
        newHistory.pop()
        const previousPage = newHistory[newHistory.length - 1]
        setPageHistory(newHistory)
        setPage(previousPage)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [pageHistory])

  const navigateTo = (p) => {
    setPage(p)
    setPageHistory(prev => [...prev, p])
    setShowProfileSettings(false)
    setSelectedCategory("Zote")
    setShowCustomerAuth(false)
    setShowShopRegister(false)
    setShowCustomerProfile(false)
    window.history.pushState({ page: p }, '', '')
  }

  const goBack = () => {
    if (pageHistory.length > 1) {
      const newHistory = [...pageHistory]
      newHistory.pop()
      const previousPage = newHistory[newHistory.length - 1]
      setPageHistory(newHistory)
      setPage(previousPage)
      window.history.back()
    }
  }

  const [cart, setCart] = useState(() => {
    try { const savedCart = localStorage.getItem("baizona_cart"); return savedCart ? JSON.parse(savedCart) : [] } catch { return [] }
  })

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

  const [showCustomerAuth, setShowCustomerAuth] = useState(false)
  const [customerAuthMode, setCustomerAuthMode] = useState("login")
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "", password: "", confirmPassword: "" })
  const [customerError, setCustomerError] = useState("")
  const [customerMessage, setCustomerMessage] = useState("")

  const [showCustomerProfile, setShowCustomerProfile] = useState(false)
  const [customerProfileForm, setCustomerProfileForm] = useState({ name: "", phone: "", currentPassword: "", newPassword: "", confirmNewPassword: "" })
  const [customerProfileMsg, setCustomerProfileMsg] = useState("")

  const [showShopRegister, setShowShopRegister] = useState(false)
  const [shopRegForm, setShopRegForm] = useState({ name: "", logo: "", logoFile: null, category: "Electronics", shopType: "Rejareja", description: "", location: "", phone: "", email: "", working_hours: "Jumatatu - Jumamosi: 8AM - 6PM", password: "", confirmPassword: "" })
  const [shopRegError, setShopRegError] = useState("")
  const [shopRegMessage, setShopRegMessage] = useState("")

  const [loginError, setLoginError] = useState("")
  const [loginShopName, setLoginShopName] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginAdminPassword, setLoginAdminPassword] = useState("")
  const isAdminMode = window.location.hash === '#admin'

  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", image: "", imageFile: null, shop: "" })
  const [adminNewProduct, setAdminNewProduct] = useState({ name: "", price: "", description: "", image: "", imageFile: null, shop: "" })

  const [shopStats, setShopStats] = useState({ totalViews: 0, whatsappClicks: 0, cartAdditions: 0, totalProducts: 0 })
  const [adminStats, setAdminStats] = useState({ totalShops: 0, totalProducts: 0, totalViews: 0, totalWhatsappClicks: 0, totalCartAdditions: 0, totalLeads: 0, totalCustomers: 0, pendingShops: 0 })

  const [editingShop, setEditingShop] = useState(null)
  const [newShopData, setNewShopData] = useState({ name: "", logo: "", logoFile: null, category: "Electronics", shopType: "Rejareja", description: "", location: "", phone: "", email: "", working_hours: "Jumatatu - Jumamosi: 8AM - 6PM", rating: "4.0", password: "", status: "approved" })
  const [adminTab, setAdminTab] = useState("overview")
  const [adminMessage, setAdminMessage] = useState("")

  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [profileForm, setProfileForm] = useState({ owner_name: "", phone: "", email: "", current_password: "", new_password: "", confirm_password: "" })
  const [profileMessage, setProfileMessage] = useState("")

  const categories = ["Zote", "Electronics", "Mavazi", "Vipodozi", "Viatu", "Samani", "Vyombo vya Muziki", "Vifaa vya Nyumbani", "Vifaa vya Ofisini", "Vingine"]

  const fetchProducts = async () => { try { const { data } = await supabase.from('products').select('*').order('id', { ascending: false }); if (data) setDbProducts(data) } catch {} }
  const fetchAllShops = async () => { try { const { data } = await supabase.from('shops').select('*').order('id', { ascending: true }); if (data) setDbShops(data) } catch {} }
  const fetchLeads = async () => { try { const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false }); if (data) setDbLeads(data) } catch {} }
  const fetchCustomers = async () => { try { const { data } = await supabase.from('customers').select('*').order('id', { ascending: false }); if (data) setDbCustomers(data) } catch {} }

  useEffect(() => { fetchProducts(); fetchAllShops(); fetchLeads(); fetchCustomers() }, [])
  useEffect(() => { try { localStorage.setItem("baizona_cart", JSON.stringify(cart)) } catch {} }, [cart])

  useEffect(() => { try { const saved = localStorage.getItem("baizona_auth"); if (saved) { const auth = JSON.parse(saved); if (auth.isCustomer && auth.customerId && dbCustomers.length > 0) { const c = dbCustomers.find(x => x.id === auth.customerId); if (c) { setIsCustomer(true); setIsLoggedIn(true); setLoggedInCustomer(c) } } if (!auth.isAdmin && !auth.isCustomer && auth.shopName && auth.password && dbShops.length > 0) { const shop = dbShops.find(s => s.name === auth.shopName && s.password === auth.password); if (shop && shop.status === 'approved') { setIsLoggedIn(true); setLoggedInShop(shop); calculateShopStats(shop.name).then(s => setShopStats(s)) } } } } catch {} }, [dbShops, dbCustomers])

  const uploadImage = async (file) => { if(!file)return null; try{const fn=`${Date.now()}-${file.name}`; const{error}=await supabase.storage.from('products-images').upload(fn,file); if(!error){const{data:u}=supabase.storage.from('products-images').getPublicUrl(fn);return u?.publicUrl||null}}catch{}return null }
  const trackProductView = async (p) => { try { await supabase.from('analytics').insert([{ shop_name: p.shop, product_id: p.id, action_type: 'view' }]) } catch {} }
  const trackWhatsAppClick = async (sn) => { try { await supabase.from('analytics').insert([{ shop_name: sn, action_type: 'whatsapp_click' }]) } catch {} }
  const trackCartAddition = async (p) => { try { await supabase.from('analytics').insert([{ shop_name: p.shop, product_id: p.id, action_type: 'cart_add' }]) } catch {} }
  const trackLead = async (pn, sn, ca, cid) => { try { await supabase.from('leads').insert([{ product_name: pn, shop_name: sn, customer_action: ca, status: 'New', customer_id: cid || null }]); fetchLeads() } catch {} }

  const fetchAnalytics = async () => { try { const { data } = await supabase.from('analytics').select('*'); return data || [] } catch { return [] } }
  const calculateAdminStats = async () => { const a = await fetchAnalytics(); return { totalShops: dbShops.filter(s=>s.status==='approved').length, totalProducts: dbProducts.length, totalViews: a.filter(x=>x.action_type==='view').length, totalWhatsappClicks: a.filter(x=>x.action_type==='whatsapp_click').length, totalCartAdditions: a.filter(x=>x.action_type==='cart_add').length, totalLeads: dbLeads.length, totalCustomers: dbCustomers.length, pendingShops: dbShops.filter(s=>s.status==='pending').length } }
  useEffect(() => { if (isAdmin) { calculateAdminStats().then(s => setAdminStats(s)) } }, [isAdmin, dbShops, dbProducts, dbLeads, dbCustomers])

  const calculateShopStats = async (sn) => { const a = await fetchAnalytics(); const sa = a.filter(x=>x.shop_name===sn); return { totalViews: sa.filter(x=>x.action_type==='view').length, whatsappClicks: sa.filter(x=>x.action_type==='whatsapp_click').length, cartAdditions: sa.filter(x=>x.action_type==='cart_add').length, totalProducts: dbProducts.filter(p=>p.shop===sn).length } }

  const getShopWhatsApp = (sn) => { const s = dbShops.find(x=>x.name===sn); return s?.phone || "255700000000" }
  const approvedShops = dbShops.filter(s => s.status === 'approved')
  const shopsByType = approvedShops
  const filteredShops = selectedCategory === "Zote" ? shopsByType : shopsByType.filter(s => s.category === selectedCategory)
  const filteredProducts = dbProducts.filter(p => { const s = dbShops.find(x=>x.name===p.shop); if(!s||s.status!=='approved')return false; const ms = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.shop.toLowerCase().includes(searchQuery.toLowerCase()); const mc = selectedCategory==="Zote"||p.category===selectedCategory; return ms&&mc })

  const handleCustomerRegister = async (e) => { e.preventDefault(); setCustomerError(""); setCustomerMessage(""); if(!customerForm.name||!customerForm.phone||!customerForm.password){setCustomerError("Tafadhali jaza sehemu zote!");return}; if(customerForm.phone.length<10){setCustomerError("Namba ya simu isiwe chini ya tarakimu 10!");return}; if(customerForm.password.length<4){setCustomerError("Password iwe na angalau herufi 4!");return}; if(customerForm.password!==customerForm.confirmPassword){setCustomerError("Password hailingani!");return}; const{data:existing}=await supabase.from('customers').select('*').eq('phone',customerForm.phone); if(existing&&existing.length>0){setCustomerError("Namba hii tayari imesajiliwa! Ingia badala yake.");return}; const{error}=await supabase.from('customers').insert([{name:customerForm.name,phone:customerForm.phone,password:customerForm.password}]); if(error){setCustomerError("Imefeli: "+error.message)}else{setCustomerMessage("✅ Umesajiliwa! Sasa ingia.");setCustomerForm({name:"",phone:"",password:"",confirmPassword:""});setCustomerAuthMode("login");fetchCustomers()} }
  const handleCustomerLogin = async (e) => { e.preventDefault(); setCustomerError(""); if(!customerForm.phone||!customerForm.password){setCustomerError("Jaza namba na password!");return}; const{data,error}=await supabase.from('customers').select('*').eq('phone',customerForm.phone); if(error||!data||data.length===0){setCustomerError("Akaunti haipo! Jisajili kwanza.");return}; const customer=data[0]; if(customer.password!==customerForm.password){setCustomerError("Password si sahihi!");return}; setIsCustomer(true);setIsLoggedIn(true);setLoggedInCustomer(customer);setShowCustomerAuth(false);setCustomerForm({name:"",phone:"",password:"",confirmPassword:""}); try{localStorage.setItem("baizona_auth",JSON.stringify({isCustomer:true,customerId:customer.id}))}catch{} }
  const requireCustomerAuth = () => { if(!isCustomer&&!isAdmin&&!loggedInShop){setShowCustomerAuth(true);setCustomerAuthMode("login");return false}return true }

  const openCustomerProfile = () => { setCustomerProfileForm({name:loggedInCustomer?.name||"",phone:loggedInCustomer?.phone||"",currentPassword:"",newPassword:"",confirmNewPassword:""});setCustomerProfileMsg("");setShowCustomerProfile(true) }
  const handleCustomerProfileUpdate = async (e) => { e.preventDefault();setCustomerProfileMsg("");if(customerProfileForm.currentPassword!==loggedInCustomer?.password){setCustomerProfileMsg("❌ Password ya sasa si sahihi!");return};if(customerProfileForm.newPassword&&customerProfileForm.newPassword!==customerProfileForm.confirmNewPassword){setCustomerProfileMsg("❌ Password mpya hailingani!");return};const u={name:customerProfileForm.name,phone:customerProfileForm.phone};if(customerProfileForm.newPassword)u.password=customerProfileForm.newPassword;const{error}=await supabase.from('customers').update(u).eq('id',loggedInCustomer.id);if(error){setCustomerProfileMsg("❌ Imefeli: "+error.message)}else{setCustomerProfileMsg("✅ Taarifa zimebadilishwa!");const{data}=await supabase.from('customers').select('*').eq('id',loggedInCustomer.id).single();if(data){setLoggedInCustomer(data);try{localStorage.setItem("baizona_auth",JSON.stringify({isCustomer:true,customerId:data.id}))}catch{}}} }
  const getCustomerLeads = () => dbLeads.filter(l => l.customer_id === loggedInCustomer?.id)

  const addToCart = () => { if(!selectedProduct||!requireCustomerAuth())return; const s=selectedShop?.name||selectedProduct.shop||"Baizona"; const np=typeof selectedProduct.price==='number'?selectedProduct.price:Number(String(selectedProduct.price).replace(/[^0-9]/g,"")); setCart(p=>{const ex=p.find(i=>i.id===selectedProduct.id);return ex?p.map(i=>i.id===selectedProduct.id?{...i,quantity:i.quantity+1}:i):[...p,{...selectedProduct,price:np,quantity:1,shop:s}]}); trackCartAddition(selectedProduct);alert("Imeongezwa kwenye Kikapu!") }
  const addToCartDirect = (p,sn) => { if(!requireCustomerAuth())return; const np=typeof p.price==='number'?p.price:Number(String(p.price).replace(/[^0-9]/g,"")); setCart(pr=>{const ex=pr.find(i=>i.id===p.id);return ex?pr.map(i=>i.id===p.id?{...i,quantity:i.quantity+1}:i):[...pr,{...p,price:np,quantity:1,shop:sn}]}); trackCartAddition(p);alert("Imeongezwa kwenye Kikapu!") }
  const updateQuantity = (id, amt) => { setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: i.quantity + amt } : i).filter(i => i.quantity > 0)) }
  const cartGroupedByShop = cart.reduce((g, i) => { const s = i.shop || "Asiyefahamika"; if (!g[s]) g[s] = []; g[s].push(i); return g }, {})

  const handleWhatsAppOrder = (sn, p) => { if(!requireCustomerAuth())return; trackWhatsAppClick(sn); trackLead(p.name,sn,"WhatsApp Order",loggedInCustomer?.id); const msg = `Habari ${sn}, nimeona bidhaa yako kupitia Baizona - Chimbo la Machimbo na ningependa kuagiza:\n\nBidhaa: ${p.name}\nBei: ${p.price}\n\nNaombaje nizungumze nawe ili kukamilisha malipo na upokeaji.\n\nAsante!\n\nUjumbe huu umetumwa kupitia Baizona - Chimbo la Machimbo\n\nUngependa kupata wateja zaidi kama mimi? Jisajili duka lako bure kupitia Baizona!\nhttps://baizona.netlify.app`; window.open(`https://wa.me/${getShopWhatsApp(sn)}?text=${encodeURIComponent(msg)}`,"_blank"); }
  const handleShopCheckoutWhatsApp = (sn, items) => { if(!requireCustomerAuth())return; trackWhatsAppClick(sn); items.forEach(i=>trackLead(i.name,sn,"Cart Checkout",loggedInCustomer?.id)); let txt="",total=0; items.forEach((i,idx)=>{const st=i.price*i.quantity;total+=st;txt+=`${idx+1}. ${i.name} (X${i.quantity}) - Tsh ${st.toLocaleString()}\n`}); const msg = `Habari ${sn}, nimeona bidhaa zako kupitia Baizona - Chimbo la Machimbo na ningependa kuagiza zifuatazo:\n\n${txt}\nJumla ya Malipo: Tsh ${total.toLocaleString()}\n\nNaombaje nizungumze nawe ili kukamilisha malipo na upokeaji.\n\nAsante!\n\nUjumbe huu umetumwa kupitia Baizona - Chimbo la Machimbo\n\nUngependa kupata wateja zaidi kama mimi? Jisajili duka lako bure kupitia Baizona!\nhttps://baizona.netlify.app`; window.open(`https://wa.me/${getShopWhatsApp(sn)}?text=${encodeURIComponent(msg)}`,"_blank"); }
  const handleBaizonaDelivery = (sn, items) => { if(!requireCustomerAuth())return; trackWhatsAppClick(sn); items.forEach(i=>trackLead(i.name,sn,"Baizona Delivery Order",loggedInCustomer?.id)); let txt="",total=0; items.forEach((i,idx)=>{const st=i.price*i.quantity;total+=st;txt+=`${idx+1}. ${i.name} (X${i.quantity}) - Tsh ${st.toLocaleString()}\n`}); window.open(`https://wa.me/255698656019?text=${encodeURIComponent(`AGIZA KUPITIA BAIZONA DELIVERY\n\n${txt}\nJumla: Tsh ${total.toLocaleString()}\n\nHuduma: Baizona itakusanyia bidhaa zako na kukuletea\n\nMteja: ${loggedInCustomer?.name||''} (${loggedInCustomer?.phone||''})`)}`,"_blank"); }

  const handleShopRegister = async (e) => { e.preventDefault();setShopRegError("");setShopRegMessage("");if(!shopRegForm.name||!shopRegForm.password||!shopRegForm.category||!shopRegForm.phone){setShopRegError("❌ Jaza: Jina, Aina, Password, na Simu!");return};if(shopRegForm.password!==shopRegForm.confirmPassword){setShopRegError("❌ Password hailingani!");return};if(shopRegForm.password.length<4){setShopRegError("❌ Password: 4+ chars!");return};const{data:existing}=await supabase.from('shops').select('*').eq('name',shopRegForm.name);if(existing&&existing.length>0){setShopRegError("❌ Duka lenye jina hili lipo!");return};let logo=shopRegForm.logo||"🏪";if(shopRegForm.logoFile){const u=await uploadImage(shopRegForm.logoFile);if(u)logo=u};const{error}=await supabase.from('shops').insert([{name:shopRegForm.name,logo:logo,category:shopRegForm.category,shop_type:shopRegForm.shopType,description:shopRegForm.description||"",location:shopRegForm.location||"",phone:shopRegForm.phone,email:shopRegForm.email||"",working_hours:shopRegForm.working_hours||"Jumatatu - Jumamosi: 8AM - 6PM",rating:"4.0",password:shopRegForm.password,status:'pending'}]);if(error){setShopRegError("❌ Imefeli: "+error.message)}else{setShopRegMessage("✅ Umesajiliwa! Subiri admin akuthibitishe.");setShopRegForm({name:"",logo:"",logoFile:null,category:"Electronics",shopType:"Rejareja",description:"",location:"",phone:"",email:"",working_hours:"Jumatatu - Jumamosi: 8AM - 6PM",password:"",confirmPassword:""});fetchAllShops()} }

  const handleLogin = async (e) => { e.preventDefault();setLoginError("");if(!loginShopName||!loginPassword){setLoginError("Jaza jina la duka na password!");return};const shop=dbShops.find(s=>s.name.toLowerCase()===loginShopName.toLowerCase());if(!shop){setLoginError("Duka halijapatikana!");return};if(shop.status!=='approved'){setLoginError("Duka halijaidhinishwa bado!");return};if(shop.password!==loginPassword){setLoginError("Password si sahihi!");return};setIsLoggedIn(true);setIsAdmin(false);setIsCustomer(false);setLoggedInShop(shop);try{const stats=await calculateShopStats(shop.name);setShopStats(stats)}catch{};try{localStorage.setItem("baizona_auth",JSON.stringify({shopName:shop.name,password:shop.password,isAdmin:false}))}catch{};setLoginShopName("");setLoginPassword("") }
  const handleAdminLogin = (e) => { e.preventDefault();setLoginError("");if(!loginEmail||!loginAdminPassword){setLoginError("Jaza email na password!");return};if(loginEmail===ADMIN_EMAIL&&loginAdminPassword===ADMIN_PASSWORD){setIsAdmin(true);setIsLoggedIn(true);setIsCustomer(false);setLoginEmail("");setLoginAdminPassword("");navigateTo("dashboard");try{localStorage.setItem("baizona_auth",JSON.stringify({isAdmin:true}))}catch{};calculateAdminStats().then(s=>setAdminStats(s))}else setLoginError("Email au password si sahihi!") }
  const handleLogout = () => { setIsLoggedIn(false);setLoggedInShop(null);setIsAdmin(false);setIsCustomer(false);setLoggedInCustomer(null);setShopStats({totalViews:0,whatsappClicks:0,cartAdditions:0,totalProducts:0});setLoginError("");setAdminTab("overview");setPage("home");setPageHistory(["home"]);setShowProfileSettings(false);setShowCustomerAuth(false);setShowShopRegister(false);setShowCustomerProfile(false);try{localStorage.removeItem("baizona_auth")}catch{} }

  const handleAddShop = async (e) => { e.preventDefault();setAdminMessage("");if(!newShopData.name||!newShopData.password||!newShopData.category){setAdminMessage("❌ Jaza: Jina, Aina, Password!");return};let logo= newShopData.logo||"🏪";if(newShopData.logoFile){const u=await uploadImage(newShopData.logoFile);if(u)logo=u};const{error}=await supabase.from('shops').insert([{name:newShopData.name,logo:logo,category:newShopData.category,shop_type:newShopData.shopType,description:newShopData.description||"",location:newShopData.location||"",phone:newShopData.phone||"",email:newShopData.email||"",working_hours:newShopData.working_hours||"Jumatatu - Jumamosi: 8AM - 6PM",rating:newShopData.rating||"4.0",password:newShopData.password,status:newShopData.status}]);if(error){setAdminMessage("❌ Imefeli: "+error.message)}else{setAdminMessage("✅ Duka limeongezwa!");setNewShopData({name:"",logo:"",logoFile:null,category:"Electronics",shopType:"Rejareja",description:"",location:"",phone:"",email:"",working_hours:"Jumatatu - Jumamosi: 8AM - 6PM",rating:"4.0",password:"",status:"approved"});fetchAllShops();calculateAdminStats().then(s=>setAdminStats(s))} }
  const handleApproveShop = async (shop) => { const{error}=await supabase.from('shops').update({status:'approved'}).eq('id',shop.id);if(error){setAdminMessage("❌ Imefeli: "+error.message)}else{setAdminMessage(`✅ "${shop.name}" imeidhinishwa!`);fetchAllShops();calculateAdminStats().then(s=>setAdminStats(s))} }
  const handleRejectShop = async (shop) => { if(confirm(`Kataa "${shop.name}"?`)){const{error}=await supabase.from('shops').delete().eq('id',shop.id);if(error){setAdminMessage("❌ Imefeli: "+error.message)}else{setAdminMessage(`❌ "${shop.name}" imekataliwa!`);fetchAllShops();calculateAdminStats().then(s=>setAdminStats(s))}} }
  const handleUpdateShop = async (e) => { e.preventDefault();if(!editingShop?.name){alert("Jina linahitajika!");return};const{error}=await supabase.from('shops').update({name:editingShop.name,logo:editingShop.logo,category:editingShop.category,shop_type:editingShop.shopType||editingShop.shop_type,description:editingShop.description,location:editingShop.location,phone:editingShop.phone,email:editingShop.email,working_hours:editingShop.working_hours,rating:editingShop.rating,password:editingShop.password,status:editingShop.status}).eq('id',editingShop.id);if(error){alert("Imefeli: "+error.message)}else{setEditingShop(null);fetchAllShops();alert("✅ Imehifadhiwa!")} }
  const handleDeleteShop = async (id,name) => { if(confirm(`Futa "${name}" KABISA?`)){try{await supabase.from('products').delete().eq('shop',name)}catch{};try{await supabase.from('leads').delete().eq('shop_name',name)}catch{};try{await supabase.from('analytics').delete().eq('shop_name',name)}catch{};const{error}=await supabase.from('shops').delete().eq('id',id);if(error){alert("Imefeli: "+error.message)}else{fetchAllShops();fetchProducts();fetchLeads();alert("✅ Imefutwa!");calculateAdminStats().then(s=>setAdminStats(s))}} }
  const handleDeleteProduct = async (pid) => { if(confirm("Futa bidhaa hii?")){await supabase.from('products').delete().eq('id',pid);fetchProducts();calculateAdminStats().then(s=>setAdminStats(s))} }
  const handleAddProduct = async (e) => { e.preventDefault();if(!newProduct.name||!newProduct.price){alert("Jaza jina na bei!");return};let img="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500";if(newProduct.imageFile){const u=await uploadImage(newProduct.imageFile);if(u)img=u};const{error}=await supabase.from('products').insert([{name:newProduct.name,price:newProduct.price,description:newProduct.description||"",image:img,shop:loggedInShop?.name||newProduct.shop}]);if(error){alert("Imefeli: "+error.message)}else{alert("✅ Bidhaa imeongezwa!");setNewProduct({name:"",price:"",description:"",image:"",imageFile:null,shop:loggedInShop?.name||""});fetchProducts();if(loggedInShop){try{const stats=await calculateShopStats(loggedInShop.name);setShopStats(stats)}catch{}}} }
  const getShopLeads = (sn) => dbLeads.filter(l => l.shop_name === sn)

  const compactGrid = { display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(220px, 1fr))", gap: isMobile ? "10px" : "16px", marginTop: "12px" }
  const inputStyle = { width: "100%", padding: "14px", borderRadius: "12px", background: "#f8fafc", color: "#1e293b", border: "2px solid #e2e8f0", fontSize: "15px", outline: "none", boxSizing: "border-box" }
  const btn = (bg, c = "white") => ({ padding: "14px 20px", borderRadius: "12px", background: bg, color: c, border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "15px", width: "100%" })

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f8fafc 0%, #f0f4ff 30%, #fdf2f8 60%, #f0fdf4 100%)", color: "#1e293b", fontFamily: "system-ui, -apple-system, sans-serif", paddingBottom: isMobile ? "85px" : "0px" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: isMobile ? "14px 16px" : "16px 28px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 1000, borderBottom: "2px solid #f1f5f9", boxShadow: "0 4px 20px rgba(99,102,241,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={() => navigateTo("home")}>
          <div style={{ width: "42px", height: "42px", borderRadius: "14px", background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: "bold", fontSize: "18px", color: "white", boxShadow: "0 4px 15px rgba(99,102,241,0.4)" }}>B</div>
          <div>
            <span style={{ fontWeight: "bold", fontSize: isMobile ? "18px" : "20px", color: "#1e293b" }}>Baizona</span>
            <div style={{ fontSize: "10px", color: "#8b5cf6", marginTop: "1px", fontStyle: "italic", fontWeight: "500" }}>Chimbo la Machimbo</div>
          </div>
        </div>
        {!isMobile && (
          <div style={{ display: "flex", gap: "24px", alignItems: "center", fontWeight: "600", fontSize: "14px" }}>
            <span onClick={() => navigateTo("home")} style={{ cursor: "pointer", color: page === "home" ? "#6366f1" : "#64748b", padding: "8px 12px", borderRadius: "10px", background: page === "home" ? "#eef2ff" : "transparent", transition: "all 0.2s" }}>🏠 Nyumbani</span>
            <span onClick={() => navigateTo("shops")} style={{ cursor: "pointer", color: page === "shops" ? "#6366f1" : "#64748b", padding: "8px 12px", borderRadius: "10px", background: page === "shops" ? "#eef2ff" : "transparent" }}>🏪 Maduka</span>
            <span onClick={() => navigateTo("cart")} style={{ cursor: "pointer", color: page === "cart" ? "#6366f1" : "#64748b", padding: "8px 12px", borderRadius: "10px", background: page === "cart" ? "#eef2ff" : "transparent" }}>🛒 Kikapu ({cart.reduce((a,b)=>a+b.quantity,0)})</span>
            <span onClick={() => navigateTo("dashboard")} style={{ cursor: "pointer", color: page === "dashboard" ? "#8b5cf6" : "#64748b", padding: "8px 12px", borderRadius: "10px", background: page === "dashboard" ? "#f3e8ff" : "transparent" }}>📊 Dashibodi</span>
            {isCustomer && <span onClick={openCustomerProfile} style={{ color: "#10b981", fontSize: "13px", cursor: "pointer", background: "#ecfdf5", padding: "6px 14px", borderRadius: "20px", fontWeight: "600" }}>👤 {loggedInCustomer?.name}</span>}
            {isLoggedIn && <button onClick={handleLogout} style={{ background: "#fef2f2", color: "#ef4444", border: "none", padding: "8px 16px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "13px" }}>Ondoka</button>}
          </div>
        )}
      </div>

      {/* CUSTOMER AUTH MODAL */}
      {showCustomerAuth && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
          <div style={{ background: "#ffffff", padding: isMobile ? "22px" : "32px", borderRadius: "24px", maxWidth: "420px", width: "100%", boxShadow: "0 20px 60px rgba(99,102,241,0.15)", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", marginBottom: "20px", background: "#f1f5f9", borderRadius: "14px", padding: "4px" }}>
              <button onClick={() => { setCustomerAuthMode("login"); setCustomerError(""); setCustomerMessage("") }} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", fontWeight: "bold", fontSize: "14px", cursor: "pointer", background: customerAuthMode === "login" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "transparent", color: customerAuthMode === "login" ? "white" : "#64748b", boxShadow: customerAuthMode === "login" ? "0 4px 15px rgba(99,102,241,0.3)" : "none" }}>Ingia</button>
              <button onClick={() => { setCustomerAuthMode("register"); setCustomerError(""); setCustomerMessage("") }} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", fontWeight: "bold", fontSize: "14px", cursor: "pointer", background: customerAuthMode === "register" ? "linear-gradient(135deg, #10b981, #059669)" : "transparent", color: customerAuthMode === "register" ? "white" : "#64748b", boxShadow: customerAuthMode === "register" ? "0 4px 15px rgba(16,185,129,0.3)" : "none" }}>Jisajili</button>
            </div>
            {customerError && <div style={{ background: "#fef2f2", color: "#ef4444", padding: "12px", borderRadius: "10px", marginBottom: "14px", fontSize: "13px", textAlign: "center", border: "1px solid #fecaca" }}>❌ {customerError}</div>}
            {customerMessage && <div style={{ background: "#ecfdf5", color: "#10b981", padding: "12px", borderRadius: "10px", marginBottom: "14px", fontSize: "13px", textAlign: "center", border: "1px solid #a7f3d0" }}>✅ {customerMessage}</div>}
            {customerAuthMode === "register" ? (
              <form onSubmit={handleCustomerRegister}>
                <input type="text" placeholder="👤 Jina Kamili" value={customerForm.name} onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})} style={{...inputStyle, marginBottom: "10px", borderColor: "#c7d2fe", background: "#eef2ff"}} />
                <input type="text" placeholder="📱 Namba ya Simu (mf: 255712345678)" value={customerForm.phone} onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})} style={{...inputStyle, marginBottom: "10px", borderColor: "#c7d2fe", background: "#eef2ff"}} />
                <input type="password" placeholder="🔒 Password (angalau herufi 4)" value={customerForm.password} onChange={(e) => setCustomerForm({...customerForm, password: e.target.value})} style={{...inputStyle, marginBottom: "10px", borderColor: "#c7d2fe", background: "#eef2ff"}} />
                <input type="password" placeholder="🔒 Thibitisha Password" value={customerForm.confirmPassword} onChange={(e) => setCustomerForm({...customerForm, confirmPassword: e.target.value})} style={{...inputStyle, marginBottom: "16px", borderColor: "#c7d2fe", background: "#eef2ff"}} />
                <button type="submit" style={{ ...btn("linear-gradient(135deg, #10b981, #059669, #34d399)"), boxShadow: "0 6px 20px rgba(16,185,129,0.4)", fontSize: "15px", fontWeight: "bold" }}>📝 Jisajili</button>
              </form>
            ) : (
              <form onSubmit={handleCustomerLogin}>
                <input type="text" placeholder="📱 Namba ya Simu" value={customerForm.phone} onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})} style={{...inputStyle, marginBottom: "10px", borderColor: "#c7d2fe", background: "#eef2ff"}} />
                <input type="password" placeholder="🔒 Password" value={customerForm.password} onChange={(e) => setCustomerForm({...customerForm, password: e.target.value})} style={{...inputStyle, marginBottom: "16px", borderColor: "#c7d2fe", background: "#eef2ff"}} />
                <button type="submit" style={{ ...btn("linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)"), boxShadow: "0 6px 20px rgba(99,102,241,0.4)", fontSize: "15px", fontWeight: "bold" }}>🚀 Ingia</button>
              </form>
            )}
            <button onClick={() => { setShowCustomerAuth(false); setCustomerError(""); setCustomerMessage("") }} style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>✕ Funga</button>
          </div>
        </div>
      )}

      {/* CUSTOMER PROFILE MODAL */}
      {showCustomerProfile && loggedInCustomer && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
          <div style={{ background: "#ffffff", padding: isMobile ? "18px" : "26px", borderRadius: "24px", maxWidth: "460px", width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(99,102,241,0.15)", border: "1px solid #e2e8f0" }}>
            <h3 style={{ textAlign: "center", marginBottom: "16px", fontSize: "20px", background: "linear-gradient(to right, #6366f1, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "bold" }}>👤 Wasifu Wangu</h3>
            {customerProfileMsg && <div style={{ background: customerProfileMsg.startsWith("✅")?"#ecfdf5":"#fef2f2", color: customerProfileMsg.startsWith("✅")?"#10b981":"#ef4444", padding: "10px", borderRadius: "10px", marginBottom: "14px", fontSize: "13px", textAlign: "center" }}>{customerProfileMsg}</div>}
            <form onSubmit={handleCustomerProfileUpdate}>
              <label style={{ fontSize: "12px", color: "#6366f1", fontWeight: "600" }}>Jina</label><input type="text" value={customerProfileForm.name} onChange={(e) => setCustomerProfileForm({...customerProfileForm, name: e.target.value})} style={{...inputStyle, marginBottom: "10px", borderColor: "#c7d2fe"}} />
              <label style={{ fontSize: "12px", color: "#6366f1", fontWeight: "600" }}>Namba ya Simu</label><input type="text" value={customerProfileForm.phone} onChange={(e) => setCustomerProfileForm({...customerProfileForm, phone: e.target.value})} style={{...inputStyle, marginBottom: "14px", borderColor: "#c7d2fe"}} />
              <hr style={{ borderColor: "#e2e8f0", margin: "14px 0" }} />
              <label style={{ fontSize: "12px", color: "#f59e0b", fontWeight: "600" }}>🔐 Password ya Sasa *</label><input type="password" value={customerProfileForm.currentPassword} onChange={(e) => setCustomerProfileForm({...customerProfileForm, currentPassword: e.target.value})} style={{...inputStyle, marginBottom: "10px", borderColor: "#fde68a"}} />
              <label style={{ fontSize: "12px", color: "#6366f1", fontWeight: "600" }}>Password Mpya (si lazima)</label><input type="password" value={customerProfileForm.newPassword} onChange={(e) => setCustomerProfileForm({...customerProfileForm, newPassword: e.target.value})} style={{...inputStyle, marginBottom: "10px", borderColor: "#c7d2fe"}} />
              <label style={{ fontSize: "12px", color: "#6366f1", fontWeight: "600" }}>Thibitisha Password Mpya</label><input type="password" value={customerProfileForm.confirmNewPassword} onChange={(e) => setCustomerProfileForm({...customerProfileForm, confirmNewPassword: e.target.value})} style={{...inputStyle, marginBottom: "16px", borderColor: "#c7d2fe"}} />
              <button type="submit" style={{ ...btn("linear-gradient(135deg, #6366f1, #8b5cf6)"), boxShadow: "0 6px 20px rgba(99,102,241,0.4)" }}>💾 Hifadhi</button>
            </form>
            <div style={{ marginTop: "18px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
              <h4 style={{ fontSize: "15px", marginBottom: "8px", color: "#6366f1" }}>📦 Maagizo Yangu ({getCustomerLeads().length})</h4>
              {getCustomerLeads().length===0?<p style={{color:"#94a3b8",fontSize:"12px",textAlign:"center"}}>Hakuna maagizo bado</p>:getCustomerLeads().map(l=>(<div key={l.id} style={{background:"#f8fafc",padding:"10px",borderRadius:"10px",marginBottom:"6px",fontSize:"12px",display:"flex",justifyContent:"space-between",border:"1px solid #e2e8f0"}}><div><strong>{l.product_name}</strong><div style={{color:"#64748b"}}>🏪 {l.shop_name}</div></div><span style={{fontSize:"10px",padding:"4px 10px",borderRadius:"8px",background:l.status==="New"?"#eef2ff":"#ecfdf5",color:l.status==="New"?"#6366f1":"#10b981"}}>{l.status}</span></div>))}
            </div>
            <button onClick={() => setShowCustomerProfile(false)} style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px" }}>✕ Funga</button>
          </div>
        </div>
      )}

      {/* SHOP REGISTRATION MODAL */}
      {showShopRegister && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, padding: "20px" }}>
          <div style={{ background: "#ffffff", padding: isMobile?"18px":"26px", borderRadius: "24px", maxWidth: "550px", width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(16,185,129,0.15)", border: "1px solid #e2e8f0" }}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}><div style={{ fontSize: "40px" }}>🏪</div><h2 style={{ fontSize: "20px", margin: "4px 0", background: "linear-gradient(to right, #10b981, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: "bold" }}>Sajili Duka Lako</h2><p style={{ color: "#64748b", fontSize: "13px" }}>Admin ataidhinisha duka lako</p></div>
            {shopRegError && <div style={{ background: "#fef2f2", color: "#ef4444", padding: "10px", borderRadius: "10px", marginBottom: "12px", fontSize: "13px", textAlign: "center" }}>{shopRegError}</div>}
            {shopRegMessage && <div style={{ background: "#ecfdf5", color: "#10b981", padding: "10px", borderRadius: "10px", marginBottom: "12px", fontSize: "13px", textAlign: "center" }}>{shopRegMessage}</div>}
            <form onSubmit={handleShopRegister} style={{ display: "grid", gap: "10px" }}>
              <input type="text" placeholder="Jina la Duka *" value={shopRegForm.name} onChange={(e) => setShopRegForm({...shopRegForm, name: e.target.value})} style={{...inputStyle, borderColor: "#a7f3d0", background: "#ecfdf5"}} />
              <select value={shopRegForm.category} onChange={(e) => setShopRegForm({...shopRegForm, category: e.target.value})} style={{...inputStyle, borderColor: "#a7f3d0", background: "#ecfdf5"}}>{categories.filter(c=>c!=="Zote").map(c=><option key={c} value={c}>{c}</option>)}</select>
              <select value={shopRegForm.shopType} onChange={(e) => setShopRegForm({...shopRegForm, shopType: e.target.value})} style={{...inputStyle, borderColor: "#a7f3d0", background: "#ecfdf5"}}>
                <option value="Rejareja">Duka la Rejareja</option>
                <option value="Jumla">Duka la Jumla</option>
              </select>
              <input type="text" placeholder="Simu (WhatsApp) *" value={shopRegForm.phone} onChange={(e) => setShopRegForm({...shopRegForm, phone: e.target.value})} style={{...inputStyle, borderColor: "#a7f3d0", background: "#ecfdf5"}} />
              <input type="text" placeholder="Mahali (Location)" value={shopRegForm.location} onChange={(e) => setShopRegForm({...shopRegForm, location: e.target.value})} style={{...inputStyle, borderColor: "#a7f3d0", background: "#ecfdf5"}} />
              <div>
                <label style={{ fontSize: "11px", color: "#10b981", display: "block", marginBottom: "4px", fontWeight: "600" }}>📸 Picha/Logo ya Duka (si lazima)</label>
                <input type="file" accept="image/*" onChange={(e) => setShopRegForm({...shopRegForm, logoFile: e.target.files[0]})} style={{...inputStyle, borderColor: "#a7f3d0", background: "#ecfdf5"}} />
                {shopRegForm.logo && shopRegForm.logo.startsWith("http") && (
                  <img src={shopRegForm.logo} alt="Preview" style={{ width: "60px", height: "60px", borderRadius: "12px", marginTop: "8px", objectFit: "cover", border: "2px solid #10b981" }} />
                )}
              </div>
              <input type="password" placeholder="Password *" value={shopRegForm.password} onChange={(e) => setShopRegForm({...shopRegForm, password: e.target.value})} style={{...inputStyle, borderColor: "#a7f3d0", background: "#ecfdf5"}} />
              <input type="password" placeholder="Thibitisha Password *" value={shopRegForm.confirmPassword} onChange={(e) => setShopRegForm({...shopRegForm, confirmPassword: e.target.value})} style={{...inputStyle, borderColor: "#a7f3d0", background: "#ecfdf5"}} />
              <button type="submit" style={{ ...btn("linear-gradient(135deg, #10b981, #059669, #34d399)"), boxShadow: "0 6px 20px rgba(16,185,129,0.4)", fontWeight: "bold" }}>📝 Sajili Duka</button>
            </form>
            <button onClick={() => setShowShopRegister(false)} style={{ display: "block", margin: "14px auto 0", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px" }}>✕ Funga</button>
          </div>
        </div>
      )}

      {/* HOME PAGE */}
      {page === "home" && (
        <>
          <div style={{ padding: isMobile ? "10px 14px" : "14px 22px", overflowX: "auto", whiteSpace: "nowrap", background: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", gap: "8px" }}>{categories.map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: "10px 18px", borderRadius: "25px", fontSize: "13px", fontWeight: "600", cursor: "pointer", border: "2px solid", borderColor: selectedCategory === cat ? "#6366f1" : "#e2e8f0", background: selectedCategory === cat ? "linear-gradient(135deg, #eef2ff, #e0e7ff)" : "#ffffff", color: selectedCategory === cat ? "#6366f1" : "#64748b", whiteSpace: "nowrap", flexShrink: 0, boxShadow: selectedCategory === cat ? "0 4px 12px rgba(99,102,241,0.2)" : "none" }}>{cat === "Zote" ? "🌟 Vyote" : cat}</button>))}</div>
          </div>
          <div style={{ padding: isMobile ? "10px 14px" : "12px 22px", background: "linear-gradient(135deg, #eef2ff, #f0f4ff)" }}>
            <input type="text" placeholder="🔍 Tafuta bidhaa..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", maxWidth: "600px", padding: "16px", borderRadius: "30px", border: "2px solid #c7d2fe", outline: "none", fontSize: "15px", background: "#ffffff", color: "#1e293b", display: "block", margin: "0 auto", boxShadow: "0 4px 15px rgba(99,102,241,0.08)" }} />
          </div>
          {searchQuery === "" && (
            <div style={{ padding: isMobile ? "12px 14px" : "14px 22px" }}>
              <h2 style={{ fontSize: isMobile ? "15px" : "18px", marginBottom: "10px", color: "#1e293b", fontWeight: "bold" }}>🏪 Maduka Maarufu ({Math.min(filteredShops.length, 4)})</h2>
              <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "8px", flexWrap: isMobile ? "nowrap" : "wrap", justifyContent: isMobile ? "flex-start" : "center" }}>{filteredShops.slice(0, 4).map((shop, i) => (
                <div key={i} onClick={() => { setSelectedShop(shop); navigateTo("shopProfile") }} style={{ minWidth: isMobile ? "140px" : "180px", padding: "16px", borderRadius: "16px", background: "#ffffff", cursor: "pointer", textAlign: "center", flexShrink: 0, border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", transition: "all 0.2s" }}>
                  {shop.logo && shop.logo.startsWith("http") ? <img src={shop.logo} style={{ width: "60px", height: "60px", borderRadius: "14px", objectFit: "cover", marginBottom: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} alt={shop.name} /> : <div style={{ fontSize: "40px", marginBottom: "6px" }}>{shop.logo || "🏪"}</div>}
                  <div style={{ fontWeight: "bold", fontSize: "13px", color: "#1e293b" }}>{shop.name}</div>
                  <div style={{ fontSize: "11px", color: "#6366f1", marginTop: "4px", background: "#eef2ff", padding: "2px 10px", borderRadius: "10px", display: "inline-block", fontWeight: "600" }}>{shop.category}</div>
                  <div style={{ fontSize: "10px", color: (shop.shop_type || shop.shopType) === "Jumla" ? "#f59e0b" : "#10b981", marginTop: "4px", fontWeight: "600" }}>{(shop.shop_type || shop.shopType) === "Jumla" ? "🏭 Jumla" : "🏪 Rejareja"}</div>
                </div>
              ))}</div>
            </div>
          )}
          <div style={{ padding: isMobile ? "12px 14px" : "14px 22px" }}>
            <h2 style={{ fontSize: isMobile ? "15px" : "18px", marginBottom: "10px", color: "#1e293b", fontWeight: "bold" }}>{searchQuery || selectedCategory !== "Zote" ? `Matokeo (${filteredProducts.length})` : "✨ Bidhaa Maarufu"}</h2>
            <div style={compactGrid}>{filteredProducts.map(product => (
              <div key={product.id} style={{ background: "#ffffff", borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.05)", transition: "all 0.2s" }}>
                <div style={{ height: isMobile ? "200px" : "200px", overflow: "hidden", cursor: "pointer" }} onClick={() => { setSelectedProduct(product); trackProductView(product); navigateTo("productDetails") }}>
                  <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ padding: "14px" }}>
                  <span style={{ fontSize: "11px", background: "#eef2ff", color: "#6366f1", padding: "4px 10px", borderRadius: "8px", fontWeight: "600" }}>🏪 {product.shop}</span>
                  <h3 style={{ margin: "10px 0 6px", fontSize: "15px", fontWeight: "bold", color: "#1e293b" }}>{product.name.length > 25 ? product.name.substring(0,25)+'...' : product.name}</h3>
                  <p style={{ color: "#6366f1", fontWeight: "bold", fontSize: "18px", margin: "4px 0" }}>{product.price}</p>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); trackProductView(product); navigateTo("productDetails") }} style={{ ...btn("linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)"), padding: "12px", fontSize: "13px", marginTop: "10px", boxShadow: "0 4px 15px rgba(99,102,241,0.3)" }}>Angalia 👀</button>
                </div>
              </div>
            ))}</div>
          </div>
        </>
      )}

      {/* SHOPS PAGE */}
      {page === "shops" && (
        <div style={{ padding: isMobile ? "14px" : "22px", maxWidth: "1100px", margin: "0 auto", background: "#ffffff" }}>
          <h1 style={{ fontSize: isMobile ? "20px" : "26px", marginBottom: "6px", color: "#1e293b", fontWeight: "bold" }}>Maduka 🏪</h1>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <button onClick={() => setShopType("Jumla")} style={{ padding: "12px 24px", borderRadius: "14px", fontSize: "14px", fontWeight: "600", cursor: "pointer", border: "2px solid", borderColor: shopType === "Jumla" ? "#f59e0b" : "#e2e8f0", background: shopType === "Jumla" ? "linear-gradient(135deg, #fffbeb, #fef3c7)" : "#ffffff", color: shopType === "Jumla" ? "#f59e0b" : "#64748b", boxShadow: shopType === "Jumla" ? "0 4px 12px rgba(245,158,11,0.2)" : "none" }}>🏭 Maduka ya Jumla</button>
            <button onClick={() => setShopType("Rejareja")} style={{ padding: "12px 24px", borderRadius: "14px", fontSize: "14px", fontWeight: "600", cursor: "pointer", border: "2px solid", borderColor: shopType === "Rejareja" ? "#10b981" : "#e2e8f0", background: shopType === "Rejareja" ? "linear-gradient(135deg, #ecfdf5, #d1fae5)" : "#ffffff", color: shopType === "Rejareja" ? "#10b981" : "#64748b", boxShadow: shopType === "Rejareja" ? "0 4px 12px rgba(16,185,129,0.2)" : "none" }}>🏪 Maduka ya Rejareja</button>
          </div>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", marginBottom: "14px" }}>{categories.filter(c=>c!=="Zote").map(cat => (<button key={cat} onClick={() => setSelectedCategory(cat)} style={{ padding: "8px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", cursor: "pointer", border: "2px solid", borderColor: selectedCategory === cat ? "#6366f1" : "#e2e8f0", background: selectedCategory === cat ? "linear-gradient(135deg, #eef2ff, #e0e7ff)" : "#ffffff", color: selectedCategory === cat ? "#6366f1" : "#64748b", whiteSpace: "nowrap", flexShrink: 0, boxShadow: selectedCategory === cat ? "0 4px 10px rgba(99,102,241,0.2)" : "none" }}>{cat}</button>))}</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(auto-fill, minmax(250px, 1fr))", gap: "14px" }}>{filteredShops.map((shop, i) => (
            <div key={i} onClick={() => { setSelectedShop(shop); navigateTo("shopProfile") }} style={{ background: "#ffffff", borderRadius: "16px", padding: "18px", cursor: "pointer", textAlign: "center", border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(0,0,0,0.04)", transition: "all 0.2s" }}>
              {shop.logo && shop.logo.startsWith("http") ? <img src={shop.logo} style={{ width: "70px", height: "70px", borderRadius: "16px", objectFit: "cover", marginBottom: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }} alt={shop.name} /> : <div style={{ width: "70px", height: "70px", borderRadius: "16px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "35px", color: "white", boxShadow: "0 4px 15px rgba(99,102,241,0.3)", marginBottom: "10px" }}>{shop.logo || "🏪"}</div>}
              <h3 style={{ fontSize: "15px", margin: "8px 0", color: "#1e293b", fontWeight: "bold" }}>{shop.name}</h3>
              <span style={{ fontSize: "11px", background: "#eef2ff", color: "#6366f1", padding: "4px 12px", borderRadius: "10px", fontWeight: "600" }}>{shop.category}</span>
              <div style={{ fontSize: "11px", marginTop: "8px", background: (shop.shop_type || shop.shopType) === "Jumla" ? "linear-gradient(135deg, #fffbeb, #fef3c7)" : "linear-gradient(135deg, #ecfdf5, #d1fae5)", padding: "4px 12px", borderRadius: "10px", display: "inline-block", fontWeight: "600", color: (shop.shop_type || shop.shopType) === "Jumla" ? "#f59e0b" : "#10b981" }}>
                {(shop.shop_type || shop.shopType) === "Jumla" ? "🏭 Jumla" : "🏪 Rejareja"}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px" }}>⭐ {shop.rating} • 📦 {dbProducts.filter(p => p.shop === shop.name).length} bidhaa</div>
            </div>
          ))}</div>
        </div>
      )}

      {/* SHOP PROFILE */}
      {page === "shopProfile" && selectedShop && (
        <div style={{ padding: isMobile ? "14px" : "22px", maxWidth: "1100px", margin: "0 auto", background: "#ffffff" }}>
          <button onClick={() => goBack()} style={{ ...btn("#f1f5f9", "#1e293b"), width: "auto", marginBottom: "14px", padding: "10px 18px", fontSize: "13px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>⬅ Rudi</button>
          <div style={{ background: "linear-gradient(135deg, #eef2ff, #f8fafc)", borderRadius: "18px", padding: isMobile ? "16px" : "22px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "14px", border: "1px solid #e2e8f0" }}>
            {selectedShop.logo && selectedShop.logo.startsWith("http") ? <img src={selectedShop.logo} alt={selectedShop.name} style={{ width: "70px", height: "70px", borderRadius: "16px", objectFit: "cover", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }} /> : <div style={{ width: "70px", height: "70px", borderRadius: "16px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "35px", color: "white", boxShadow: "0 4px 15px rgba(99,102,241,0.3)" }}>{selectedShop.logo || "🏪"}</div>}
            <div>
              <h1 style={{ fontSize: isMobile ? "18px" : "24px", margin: "0", color: "#1e293b", fontWeight: "bold" }}>{selectedShop.name}</h1>
              <span style={{ fontSize: "11px", background: "#eef2ff", color: "#6366f1", padding: "3px 10px", borderRadius: "8px", fontWeight: "600" }}>{selectedShop.category}</span>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                {(selectedShop.shop_type || selectedShop.shopType) === "Jumla" ? "🏭 Duka la Jumla" : "🏪 Duka la Rejareja"} • ⭐ {selectedShop.rating}
              </div>
            </div>
          </div>
          <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "14px", marginBottom: "16px", fontSize: "13px", color: "#475569", border: "1px solid #e2e8f0" }}>
            {isCustomer || isAdmin || loggedInShop ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", padding: "12px", borderRadius: "10px", textAlign: "center" }}><p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>📞 Simu</p><p style={{ margin: "6px 0 0", fontWeight: "bold", color: "#10b981", fontSize: "16px" }}>{selectedShop.phone}</p></div>
                  <div style={{ background: "linear-gradient(135deg, #eef2ff, #e0e7ff)", padding: "12px", borderRadius: "10px", textAlign: "center" }}><p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>📧 Barua Pepe</p><p style={{ margin: "6px 0 0", fontWeight: "bold", color: "#6366f1", fontSize: "13px" }}>{selectedShop.email || "Hakuna"}</p></div>
                </div>
                <p style={{ margin: "6px 0" }}>📍 {selectedShop.location}</p>
                <p style={{ margin: "0" }}>🕐 {selectedShop.working_hours}</p>
                <button onClick={() => { trackWhatsAppClick(selectedShop.name); window.open(`https://wa.me/${getShopWhatsApp(selectedShop.name)}?text=Habari ${selectedShop.name}`, "_blank") }} style={{ ...btn("linear-gradient(135deg, #10b981, #059669, #34d399)"), marginTop: "12px", padding: "12px", fontSize: "13px", boxShadow: "0 4px 15px rgba(16,185,129,0.3)" }}>💬 Piga Gumzo WhatsApp</button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 14px" }}>
                <div style={{ fontSize: "50px", marginBottom: "12px" }}>🔒</div>
                <h3 style={{ fontSize: "16px", color: "#6366f1", margin: "0 0 8px", fontWeight: "bold" }}>Ingia Kuona Maelezo ya Duka</h3>
                <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "14px" }}>Jisajili au ingia ili uweze kuona namba ya simu, barua pepe, mahali na kupiga gumzo na duka hili.</p>
                <button onClick={() => { setShowCustomerAuth(true); setCustomerAuthMode("login") }} style={{ ...btn("linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)"), padding: "14px", fontSize: "14px", boxShadow: "0 6px 20px rgba(99,102,241,0.4)" }}>👤 Ingia / Jisajili Kuona</button>
              </div>
            )}
          </div>
          <h2 style={{ fontSize: isMobile ? "14px" : "17px", marginBottom: "10px", color: "#1e293b", fontWeight: "bold" }}>📦 Bidhaa ({dbProducts.filter(p => p.shop === selectedShop.name).length})</h2>
          <div style={compactGrid}>{dbProducts.filter(p => p.shop === selectedShop.name).map(product => (
            <div key={product.id} style={{ background: "#ffffff", borderRadius: "14px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ height: isMobile ? "180px" : "200px", overflow: "hidden", cursor: "pointer" }} onClick={() => { setSelectedProduct(product); trackProductView(product); navigateTo("productDetails") }}>
                <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: "14px" }}>
                <h3 style={{ fontSize: "13px", margin: "4px 0", color: "#1e293b", fontWeight: "bold" }}>{product.name.length > 20 ? product.name.substring(0,20)+'...' : product.name}</h3>
                <p style={{ color: "#6366f1", fontWeight: "bold", fontSize: "16px", margin: "4px 0" }}>{product.price}</p>
                <button onClick={() => addToCartDirect(product, selectedShop.name)} style={{ ...btn("linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)"), padding: "10px", fontSize: "12px", marginTop: "8px", boxShadow: "0 4px 12px rgba(99,102,241,0.2)" }}>🛒 Weka Kikapuni</button>
              </div>
            </div>
          ))}</div>
        </div>
      )}

      {/* PRODUCT DETAILS */}
      {page === "productDetails" && selectedProduct && (
        <div style={{ padding: isMobile ? "14px" : "22px", maxWidth: "800px", margin: "0 auto", background: "#ffffff" }}>
          <button onClick={() => goBack()} style={{ ...btn("#f1f5f9", "#1e293b"), width: "auto", marginBottom: "14px", padding: "10px 18px", fontSize: "13px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>⬅ Rudi</button>
          <div style={{ background: "#ffffff", borderRadius: "18px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <img src={selectedProduct.image} alt={selectedProduct.name} style={{ width: "100%", height: isMobile ? "250px" : "400px", objectFit: "cover" }} />
            <div style={{ padding: isMobile ? "16px" : "24px" }}>
              <span style={{ color: "#6366f1", fontSize: "12px", background: "#eef2ff", padding: "6px 12px", borderRadius: "8px", fontWeight: "600" }}>🏪 {selectedShop?.name || selectedProduct.shop}</span>
              <h1 style={{ fontSize: isMobile ? "22px" : "28px", margin: "12px 0 8px", color: "#1e293b", fontWeight: "bold" }}>{selectedProduct.name}</h1>
              <h2 style={{ color: "#6366f1", fontSize: isMobile ? "24px" : "30px", margin: "6px 0", fontWeight: "bold" }}>{selectedProduct.price}</h2>
              <p style={{ color: "#475569", fontSize: "14px", marginTop: "12px", lineHeight: "1.7" }}>{selectedProduct.description}</p>
              <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px", marginTop: "18px" }}>
                <button onClick={addToCart} style={{ ...btn("#ffffff", "#6366f1"), border: "2px solid #6366f1", fontWeight: "bold" }}>🛒 Weka Kikapuni</button>
                <button onClick={() => handleWhatsAppOrder(selectedShop?.name || selectedProduct.shop, selectedProduct)} style={{ ...btn("linear-gradient(135deg, #10b981, #059669, #34d399)"), boxShadow: "0 6px 20px rgba(16,185,129,0.4)" }}>📱 Agiza Kupitia WhatsApp</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART PAGE */}
      {page === "cart" && (
        <div style={{ padding: isMobile ? "14px" : "22px", maxWidth: "800px", margin: "0 auto", background: "#ffffff" }}>
          <h1 style={{ fontSize: isMobile ? "22px" : "28px", color: "#1e293b", marginBottom: "6px", fontWeight: "bold" }}>Kikapu Changu 🛒</h1>
          {cart.length === 0 ? (
            <div style={{ background: "#f8fafc", padding: "50px", borderRadius: "16px", marginTop: "14px", textAlign: "center", fontSize: "14px", color: "#64748b", border: "1px solid #e2e8f0" }}>Kikapu ni tupu. Tembelea maduka kuweka bidhaa!</div>
          ) : (
            <>
              {Object.keys(cartGroupedByShop).map((sn) => { const items = cartGroupedByShop[sn]; const total = items.reduce((s, i) => s + (i.price * i.quantity), 0); return (
                <div key={sn} style={{ background: "#ffffff", padding: "16px", borderRadius: "16px", marginBottom: "14px", marginTop: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                  <h3 style={{ fontSize: "14px", color: "#6366f1", marginBottom: "10px", fontWeight: "bold" }}>🏪 {sn}</h3>
                  {items.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <img src={item.image} style={{ width: "45px", height: "45px", borderRadius: "8px", objectFit: "cover" }} alt={item.name} />
                        <span style={{ color: "#1e293b", fontWeight: "500" }}>{item.name} <span style={{ color: "#6366f1" }}>x{item.quantity}</span></span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ color: "#1e293b", fontWeight: "bold", fontSize: "13px" }}>Tsh {(item.price * item.quantity).toLocaleString()}</span>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid #e2e8f0", background: "#fef2f2", color: "#ef4444", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>-</button>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid #e2e8f0", background: "#ecfdf5", color: "#10b981", fontWeight: "bold", cursor: "pointer", fontSize: "14px" }}>+</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", flexWrap: "wrap", gap: "10px" }}>
                    <div><span style={{ color: "#64748b", fontSize: "12px" }}>Jumla ya {sn}: </span><strong style={{ fontSize: "16px", color: "#6366f1" }}>Tsh {total.toLocaleString()}</strong></div>
                    <button onClick={() => handleShopCheckoutWhatsApp(sn, items)} style={{ ...btn("linear-gradient(135deg, #10b981, #059669)"), width: "auto", padding: "8px 16px", fontSize: "12px" }}>📱 Agiza Duka Hili</button>
                  </div>
                </div>
              )})}
              <div style={{ background: "linear-gradient(135deg, #eef2ff, #f3e8ff)", padding: "20px", borderRadius: "16px", marginTop: "10px", border: "2px solid #6366f1", textAlign: "center", boxShadow: "0 4px 20px rgba(99,102,241,0.15)" }}>
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>🚚</div>
                <h3 style={{ fontSize: "18px", color: "#6366f1", marginBottom: "6px", fontWeight: "bold" }}>Baizona Delivery</h3>
                <p style={{ color: "#475569", fontSize: "13px", marginBottom: "6px", lineHeight: "1.6" }}>
                  Una bidhaa kutoka maduka tofauti? Baizona itakusanyia bidhaa zako zote na kukuletea moja kwa moja!
                </p>
                <div style={{ background: "#ffffff", padding: "12px", borderRadius: "12px", marginBottom: "12px", border: "1px solid #e2e8f0" }}>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                    📦 <strong>Jumla ya Bidhaa:</strong> {cart.reduce((a,b) => a + b.quantity, 0)} | 💰 <strong>Jumla ya Malipo:</strong> Tsh {cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => handleBaizonaDelivery(Object.keys(cartGroupedByShop)[0], Object.values(cartGroupedByShop).flat())} style={{ ...btn("linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)"), padding: "14px", fontSize: "15px", boxShadow: "0 6px 25px rgba(99,102,241,0.4)", fontWeight: "bold" }}>
                  🚚 Agiza Kupitia Baizona Delivery
                </button>
                <p style={{ color: "#94a3b8", fontSize: "11px", marginTop: "8px" }}>📍 Gharama za usafiri zitaongezwa kulingana na umbali</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* DASHBOARD */}
      {page === "dashboard" && (
        <div style={{ padding: isMobile ? "14px" : "22px", maxWidth: "1100px", margin: "0 auto", background: "#ffffff" }}>
          {!isLoggedIn ? (
            <div style={{ maxWidth: "440px", margin: "40px auto" }}>
              <div style={{ background: "#ffffff", padding: "28px", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}>
                <div style={{ textAlign: "center", marginBottom: "18px" }}><div style={{ fontSize: "40px" }}>🔐</div><h2 style={{ fontSize: "22px", margin: "8px 0", color: "#1e293b", fontWeight: "bold" }}>{isAdminMode ? "Admin Access" : "Ingia Dukani"}</h2></div>
                {isAdminMode ? (<form onSubmit={handleAdminLogin}>{loginError && <div style={{ background: "#fef2f2", color: "#ef4444", padding: "10px", borderRadius: "10px", marginBottom: "10px", fontSize: "13px", textAlign: "center" }}>{loginError}</div>}<input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{...inputStyle, marginBottom: "8px", borderColor: "#fecaca"}} /><input type="password" placeholder="Password" value={loginAdminPassword} onChange={(e) => setLoginAdminPassword(e.target.value)} style={{...inputStyle, marginBottom: "14px", borderColor: "#fecaca"}} /><button type="submit" style={btn("linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)")}>Ingia 🔑</button></form>) : (<form onSubmit={handleLogin}>{loginError && <div style={{ background: "#fef2f2", color: "#ef4444", padding: "10px", borderRadius: "10px", marginBottom: "10px", fontSize: "13px" }}>{loginError}</div>}<div style={{ marginBottom: "8px" }}><label style={{ color: "#64748b", fontSize: "13px", fontWeight: "600" }}>Jina la Duka</label><input type="text" placeholder="Andika jina la duka..." value={loginShopName} onChange={(e) => setLoginShopName(e.target.value)} style={{...inputStyle, borderColor: "#c7d2fe"}} /></div><div style={{ marginBottom: "14px" }}><label style={{ color: "#64748b", fontSize: "13px", fontWeight: "600" }}>Password</label><input type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{...inputStyle, borderColor: "#c7d2fe"}} /></div><button type="submit" style={btn("linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)")}>Ingia 📊</button></form>)}
                <div style={{ textAlign: "center", marginTop: "18px", borderTop: "1px solid #e2e8f0", paddingTop: "18px" }}><p style={{ color: "#64748b", fontSize: "13px", marginBottom: "10px" }}>Hujasajili duka bado?</p><button onClick={() => { setShowShopRegister(true) }} style={{ ...btn("linear-gradient(135deg, #10b981, #059669, #34d399)"), padding: "14px", fontSize: "14px", boxShadow: "0 6px 20px rgba(16,185,129,0.4)", fontWeight: "bold" }}>🏪 Sajili Duka Lako</button></div>
              </div>
            </div>
          ) : isAdmin ? (
            // ============ ADMIN DASHBOARD ============
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              {/* Admin Header */}
              <div style={{ background: "linear-gradient(135deg, #fef2f2, #fff7ed)", borderRadius: "16px", padding: "18px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", border: "1px solid #fecaca" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: "linear-gradient(135deg, #ef4444, #dc2626)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "24px", color: "white", boxShadow: "0 4px 15px rgba(239,68,68,0.4)" }}>🛡️</div>
                  <div>
                    <strong style={{ fontSize: "17px", color: "#dc2626" }}>Baizona Admin</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                      {adminStats.totalShops} maduka yaliyoidhinishwa • 
                      <span style={{ color: "#f59e0b", fontWeight: "bold" }}> {adminStats.pendingShops} yanasubiri kuidhinishwa</span> • 
                      {dbProducts.length} bidhaa • {dbCustomers.length} wateja
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => navigateTo("home")} style={{ padding: "8px 16px", borderRadius: "10px", background: "#f1f5f9", color: "#1e293b", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>🏪 Tazama Site</button>
                  <button onClick={handleLogout} style={{ padding: "8px 16px", borderRadius: "10px", background: "#fef2f2", color: "#ef4444", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>🚪 Ondoka</button>
                </div>
              </div>

              {/* Admin Tabs */}
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                {[{ id: "overview", icon: "📈", label: "Muhtasari" },{ id: "addProduct", icon: "➕", label: "Weka Bidhaa" },{ id: "manageShops", icon: "🏪", label: "Maduka" },{ id: "allProducts", icon: "📦", label: "Bidhaa" },{ id: "leads", icon: "📨", label: "Maagizo" },{ id: "customers", icon: "👥", label: "Wateja" }].map(tab => (
                  <button key={tab.id} onClick={() => { setAdminTab(tab.id); setAdminMessage(""); setEditingShop(null) }} style={{ padding: "10px 18px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", cursor: "pointer", border: "2px solid", borderColor: adminTab === tab.id ? "#6366f1" : "#e2e8f0", background: adminTab === tab.id ? "linear-gradient(135deg, #eef2ff, #e0e7ff)" : "#ffffff", color: adminTab === tab.id ? "#6366f1" : "#64748b", whiteSpace: "nowrap", boxShadow: adminTab === tab.id ? "0 4px 12px rgba(99,102,241,0.2)" : "none" }}>{tab.icon} {tab.label}</button>
                ))}
              </div>

              {adminMessage && <div style={{ background: adminMessage.startsWith("✅")?"#ecfdf5":"#fef2f2", color: adminMessage.startsWith("✅")?"#10b981":"#ef4444", padding: "14px", borderRadius: "12px", marginBottom: "14px", fontSize: "14px", textAlign: "center", border: `2px solid ${adminMessage.startsWith("✅")?"#a7f3d0":"#fecaca"}` }}>{adminMessage}</div>}

              {/* Overview */}
              {adminTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: isMobile?"repeat(2,1fr)":"repeat(4,1fr)", gap: "12px" }}>
                  {[{ icon: "🏪", label: "Maduka", sub: "Yaliyoidhinishwa", v: adminStats.totalShops, c: "#6366f1", bg: "#eef2ff" },{ icon: "⏳", label: "Wanasubiri", sub: "Kuidhinishwa", v: adminStats.pendingShops, c: "#f59e0b", bg: "#fffbeb" },{ icon: "📦", label: "Bidhaa", sub: "Zote", v: adminStats.totalProducts, c: "#10b981", bg: "#ecfdf5" },{ icon: "👥", label: "Wateja", sub: "Waliojisajili", v: adminStats.totalCustomers, c: "#8b5cf6", bg: "#f3e8ff" }].map((s,i)=>(<div key={i} style={{ background: s.bg, padding: "16px", borderRadius: "14px", textAlign: "center", border: "1px solid #e2e8f0" }}><div style={{ fontSize: "28px", marginBottom: "4px" }}>{s.icon}</div><div style={{ fontSize: "22px", fontWeight: "bold", color: s.c }}>{s.v}</div><div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{s.label}</div><div style={{ fontSize: "10px", color: "#94a3b8" }}>{s.sub}</div></div>))}
                </div>
              )}

              {/* Add Product */}
              {adminTab === "addProduct" && (
                <div style={{ background: "#ffffff", padding: "18px", borderRadius: "16px", border: "2px solid #6366f1", boxShadow: "0 4px 20px rgba(99,102,241,0.1)" }}>
                  <h3 style={{ fontSize: "18px", marginBottom: "16px", color: "#6366f1", fontWeight: "bold" }}>➕ Weka Bidhaa Dukani</h3>
                  <div style={{ marginBottom: "14px", background: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <label style={{ fontSize: "13px", color: "#6366f1", display: "block", marginBottom: "6px", fontWeight: "600" }}>Chagua Duka *</label>
                    <select value={adminNewProduct.shop} onChange={(e) => setAdminNewProduct({...adminNewProduct, shop: e.target.value})} style={{...inputStyle, background: "#ffffff"}}>
                      <option value="">-- Chagua duka --</option>
                      {dbShops.filter(s=>s.status==='approved').map((s,i)=>(<option key={i} value={s.name}>{s.logo||"🏪"} {s.name}</option>))}
                    </select>
                  </div>
                  {adminNewProduct.shop && (
                    <form onSubmit={async (e) => { e.preventDefault(); if(!adminNewProduct.name||!adminNewProduct.price){setAdminMessage("❌ Jaza: Jina na Bei!");return}; let img="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500"; if(adminNewProduct.imageFile){const u=await uploadImage(adminNewProduct.imageFile);if(u)img=u}; const{error}=await supabase.from('products').insert([{name:adminNewProduct.name,price:adminNewProduct.price,description:adminNewProduct.description||"",image:img,shop:adminNewProduct.shop}]); if(error){setAdminMessage("❌ Imefeli: "+error.message)}else{setAdminMessage(`✅ Bidhaa imeongezwa kwenye ${adminNewProduct.shop}!`);setAdminNewProduct({name:"",price:"",description:"",image:"",imageFile:null,shop:adminNewProduct.shop});fetchProducts();calculateAdminStats().then(s=>setAdminStats(s))} }} style={{ display: "grid", gap: "12px" }}>
                      <input type="text" placeholder="Jina la Bidhaa *" value={adminNewProduct.name} onChange={(e) => setAdminNewProduct({...adminNewProduct, name: e.target.value})} style={inputStyle} />
                      <input type="text" placeholder="Bei (Tsh) *" value={adminNewProduct.price} onChange={(e) => setAdminNewProduct({...adminNewProduct, price: e.target.value})} style={inputStyle} />
                      <textarea placeholder="Maelezo (si lazima)" value={adminNewProduct.description} onChange={(e) => setAdminNewProduct({...adminNewProduct, description: e.target.value})} style={{...inputStyle, minHeight: "70px"}} />
                      <div><label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px", fontWeight: "600" }}>📸 Picha ya Bidhaa</label><input type="file" accept="image/*" onChange={(e) => setAdminNewProduct({...adminNewProduct, imageFile: e.target.files[0]})} style={inputStyle} /></div>
                      {adminNewProduct.image && <img src={adminNewProduct.image} alt="Preview" style={{ width: "100%", maxHeight: "180px", borderRadius: "12px", objectFit: "cover" }} />}
                      <button type="submit" style={{ ...btn("linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)"), boxShadow: "0 6px 20px rgba(99,102,241,0.4)", fontWeight: "bold" }}>🚀 Weka Bidhaa</button>
                    </form>
                  )}
                </div>
              )}

              {/* ============ MANAGE SHOPS (WITH PENDING APPROVAL) ============ */}
              {adminTab === "manageShops" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                    <h3 style={{ fontSize: "17px", color: "#1e293b", fontWeight: "bold" }}>🏪 Maduka Yote ({dbShops.length})</h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => { setShowShopRegister(true) }} style={{ ...btn("linear-gradient(135deg, #10b981, #059669, #34d399)"), width: "auto", padding: "10px 16px", fontSize: "12px", boxShadow: "0 4px 12px rgba(16,185,129,0.3)", fontWeight: "bold" }}>➕ Sajili Duka</button>
                      <button onClick={() => { setNewShopData({ name: "", logo: "", logoFile: null, category: "Electronics", shopType: "Rejareja", description: "", location: "", phone: "", email: "", working_hours: "Jumatatu - Jumamosi: 8AM - 6PM", rating: "4.0", password: "", status: "approved" }); setAdminTab("addShopDirect") }} style={{ ...btn("linear-gradient(135deg, #6366f1, #8b5cf6)"), width: "auto", padding: "10px 16px", fontSize: "12px" }}>⚡ Weka Haraka</button>
                    </div>
                  </div>

                  {/* ============ PENDING APPROVAL SECTION ============ */}
                  {dbShops.filter(s => s.status === 'pending').length > 0 && (
                    <div style={{ marginBottom: "16px", background: "#fffbeb", padding: "16px", borderRadius: "14px", border: "2px solid #f59e0b" }}>
                      <h4 style={{ fontSize: "15px", color: "#f59e0b", marginBottom: "6px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                        ⏳ YANASUBIRI KUIDHINISHWA ({dbShops.filter(s=>s.status==='pending').length})
                      </h4>
                      <p style={{ fontSize: "11px", color: "#92400e", marginBottom: "12px" }}>
                        Maduka haya yamejisajili na yanasubiri wewe kuyakubali kabla ya kuonekana kwa wateja.
                      </p>
                      {dbShops.filter(s=>s.status==='pending').map((shop,i)=>(
                        <div key={i} style={{ background: "#ffffff", padding: "14px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "8px", border: "1px solid #fde68a" }}>
                          <div style={{ flex: 1 }}>
                            <strong style={{ color: "#1e293b", fontSize: "14px" }}>{shop.logo||"🏪"} {shop.name}</strong>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>{shop.category} | 📞 {shop.phone} | 📍 {shop.location}</div>
                            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>🔑 Pass: {shop.password} | 📧 {shop.email} | 🕐 {shop.working_hours}</div>
                            {shop.description && <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px", fontStyle: "italic" }}>"{shop.description}"</div>}
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                            <button onClick={()=>handleApproveShop(shop)} style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", whiteSpace: "nowrap" }}>
                              ✅ Kubali
                            </button>
                            <button onClick={()=>handleRejectShop(shop)} style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none", padding: "10px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "12px", whiteSpace: "nowrap" }}>
                              ❌ Kataa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Edit Shop Modal */}
                  {editingShop && (
                    <div style={{ background: "#fffbeb", padding: "16px", borderRadius: "14px", marginBottom: "14px", border: "2px solid #fde68a" }}>
                      <h4 style={{ fontSize: "15px", color: "#f59e0b", marginBottom: "12px", fontWeight: "bold" }}>✏️ Hariri: {editingShop.name}</h4>
                      <form onSubmit={handleUpdateShop} style={{ display: "grid", gridTemplateColumns: isMobile?"1fr":"repeat(2,1fr)", gap: "10px" }}>
                        <input type="text" placeholder="Jina la Duka" value={editingShop.name} onChange={(e)=>setEditingShop({...editingShop,name:e.target.value})} style={inputStyle} />
                        <select value={editingShop.category} onChange={(e)=>setEditingShop({...editingShop,category:e.target.value})} style={{...inputStyle}}>{categories.filter(c=>c!=="Zote").map(c=><option key={c} value={c}>{c}</option>)}</select>
                        <select value={editingShop.shopType||editingShop.shop_type} onChange={(e)=>setEditingShop({...editingShop,shopType:e.target.value})} style={{...inputStyle}}><option value="Rejareja">Rejareja</option><option value="Jumla">Jumla</option></select>
                        <input type="text" placeholder="Password" value={editingShop.password} onChange={(e)=>setEditingShop({...editingShop,password:e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Simu" value={editingShop.phone} onChange={(e)=>setEditingShop({...editingShop,phone:e.target.value})} style={inputStyle} />
                        <input type="text" placeholder="Mahali" value={editingShop.location} onChange={(e)=>setEditingShop({...editingShop,location:e.target.value})} style={inputStyle} />
                        <select value={editingShop.status} onChange={(e)=>setEditingShop({...editingShop,status:e.target.value})} style={{...inputStyle}}><option value="approved">Imeshakubaliwa</option><option value="pending">Inasubiri</option></select>
                        <textarea placeholder="Maelezo" value={editingShop.description} onChange={(e)=>setEditingShop({...editingShop,description:e.target.value})} style={{...inputStyle, gridColumn: isMobile?"span 1":"span 2", minHeight: "60px"}} />
                        <div style={{ gridColumn: isMobile?"span 1":"span 2", display: "flex", gap: "10px" }}>
                          <button type="submit" style={btn("linear-gradient(135deg, #f59e0b, #d97706)", "#1e293b")}>💾 Hifadhi</button>
                          <button type="button" onClick={()=>setEditingShop(null)} style={btn("#f1f5f9", "#1e293b")}>Ghairi</button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* All Shops List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {dbShops.map((shop, i) => (
                      <div key={i} style={{ background: shop.status==='approved'?"#ecfdf5":"#fffbeb", padding: "14px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", border: `1px solid ${shop.status==='approved'?'#a7f3d0':'#fde68a'}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {shop.logo && shop.logo.startsWith("http") ? <img src={shop.logo} style={{ width: "45px", height: "45px", borderRadius: "10px", objectFit: "cover" }} alt="" /> : <div style={{ width: "45px", height: "45px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "20px", color: "white" }}>{shop.logo || "🏪"}</div>}
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><strong style={{ color: "#1e293b", fontSize: "13px" }}>{shop.name}</strong><span style={{ fontSize: "10px", padding: "3px 10px", borderRadius: "8px", background: shop.status==='approved'?"#a7f3d0":"#fde68a", color: shop.status==='approved'?"#065f46":"#92400e", fontWeight: "600" }}>{shop.status==='approved'?"Imeidhinishwa":"Inasubiri"}</span></div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{shop.category} | 📦 {dbProducts.filter(p=>p.shop===shop.name).length} bidhaa | 📞 {shop.phone}</div>
                            <div style={{ fontSize: "10px", color: "#94a3b8" }}>🔑: {shop.password} | 📍 {shop.location} | 📧 {shop.email}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={()=>setEditingShop({...shop})} style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#1e293b", border: "none", padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>✏️ Hariri</button>
                          <button onClick={()=>handleDeleteShop(shop.id, shop.name)} style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none", padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "11px" }}>🗑️ Futa</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Products, Leads, Customers tabs */}
              {adminTab === "allProducts" && (
                <div><h3 style={{ fontSize: "16px", color: "#1e293b", marginBottom: "12px", fontWeight: "bold" }}>📦 Bidhaa Zote ({dbProducts.length})</h3>
                  <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}><thead><tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b" }}><th style={{ padding: "10px", textAlign: "left" }}>Bidhaa</th><th style={{ padding: "10px" }}>Duka</th><th style={{ padding: "10px" }}>Bei</th><th style={{ padding: "10px" }}>Futa</th></tr></thead><tbody>{dbProducts.map(p=>(<tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}><td style={{ padding: "10px", display: "flex", alignItems: "center", gap: "10px" }}><img src={p.image} style={{ width: "35px", height: "35px", borderRadius: "6px", objectFit: "cover" }} alt="" />{p.name}</td><td style={{ padding: "10px", color: "#6366f1" }}>{p.shop}</td><td style={{ padding: "10px", color: "#10b981", fontWeight: "bold" }}>{p.price}</td><td style={{ padding: "10px", textAlign: "center" }}><button onClick={()=>handleDeleteProduct(p.id)} style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white", border: "none", padding: "5px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "11px" }}>🗑️</button></td></tr>))}</tbody></table></div></div>
              )}
              {adminTab === "leads" && (
                <div><h3 style={{ fontSize: "16px", color: "#1e293b", marginBottom: "12px", fontWeight: "bold" }}>📨 Maagizo Yote ({dbLeads.length})</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>{dbLeads.length===0?<p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>Hakuna maagizo bado</p>:dbLeads.map(lead=>(<div key={lead.id} style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", flexWrap: "wrap", gap: "8px", border: "1px solid #e2e8f0" }}><div><strong>{lead.product_name}</strong><div style={{ color: "#64748b", fontSize: "11px" }}>🏪 {lead.shop_name} • {lead.customer_action}</div></div><span style={{ fontSize: "10px", padding: "4px 12px", borderRadius: "10px", background: lead.status==="New"?"#eef2ff":"#ecfdf5", color: lead.status==="New"?"#6366f1":"#10b981", fontWeight: "600" }}>{lead.status}</span></div>))}</div></div>
              )}
              {adminTab === "customers" && (
                <div><h3 style={{ fontSize: "16px", color: "#1e293b", marginBottom: "12px", fontWeight: "bold" }}>👥 Wateja Wote ({dbCustomers.length})</h3>
                  <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}><thead><tr style={{ borderBottom: "2px solid #e2e8f0", color: "#64748b" }}><th style={{ padding: "10px", textAlign: "left" }}>Mteja</th><th style={{ padding: "10px" }}>Simu</th><th style={{ padding: "10px" }}>Password</th><th style={{ padding: "10px" }}>Tarehe</th></tr></thead><tbody>{dbCustomers.map(c=>(<tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}><td style={{ padding: "10px", color: "#1e293b", fontWeight: "500" }}>{c.name}</td><td style={{ padding: "10px", color: "#6366f1" }}>{c.phone}</td><td style={{ padding: "10px", color: "#ef4444" }}>{c.password}</td><td style={{ padding: "10px", color: "#94a3b8", fontSize: "11px" }}>{new Date(c.created_at).toLocaleDateString('sw-TZ')}</td></tr>))}</tbody></table></div></div>
              )}
            </div>
          ) : (
            // SHOP OWNER DASHBOARD
            <>
              <div style={{ background: "linear-gradient(135deg, #eef2ff, #f8fafc)", borderRadius: "14px", padding: "16px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", border: "1px solid #e2e8f0" }}>
                <strong style={{ fontSize: "16px", color: "#1e293b" }}>{loggedInShop?.logo&&loggedInShop.logo.startsWith("http")?<img src={loggedInShop.logo} style={{ width: "24px", height: "24px", borderRadius: "6px", verticalAlign: "middle", marginRight: "8px", objectFit: "cover" }} alt="" />:loggedInShop?.logo} {loggedInShop?.name}</strong>
                <div style={{ display: "flex", gap: "8px" }}><button onClick={()=>{setShowProfileSettings(true);setProfileForm({owner_name:loggedInShop?.owner_name||"",phone:loggedInShop?.phone||"",email:loggedInShop?.email||"",current_password:"",new_password:"",confirm_password:""})}} style={{ ...btn("#f1f5f9", "#1e293b"), width: "auto", padding: "8px 14px", fontSize: "12px", border: "1px solid #e2e8f0" }}>⚙️ Mipangilio</button><button onClick={handleLogout} style={{ ...btn("#fef2f2", "#ef4444"), width: "auto", padding: "8px 14px", fontSize: "12px" }}>Ondoka</button></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "10px", marginBottom: "12px" }}>{[{ l: "Waliotazama", v: shopStats.totalViews },{ l: "WhatsApp", v: shopStats.whatsappClicks },{ l: "Kikapuni", v: shopStats.cartAdditions },{ l: "Bidhaa", v: shopStats.totalProducts }].map((s,i)=>(<div key={i} style={{ background: "#ffffff", padding: "14px", borderRadius: "12px", textAlign: "center", fontSize: "12px", border: "1px solid #e2e8f0" }}><strong style={{ fontSize: "16px", color: "#6366f1" }}>{s.v}</strong><br/><span style={{ color: "#64748b" }}>{s.l}</span></div>))}</div>
              <form onSubmit={handleAddProduct} style={{ background: "#f8fafc", padding: "14px", borderRadius: "14px", marginBottom: "12px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ fontSize: "14px", marginBottom: "10px", color: "#1e293b", fontWeight: "bold" }}>➕ Weka Bidhaa Mpya</h4>
                <input type="text" placeholder="Jina la Bidhaa" value={newProduct.name} onChange={(e)=>setNewProduct({...newProduct,name:e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
                <input type="text" placeholder="Bei (Tsh)" value={newProduct.price} onChange={(e)=>setNewProduct({...newProduct,price:e.target.value})} style={{...inputStyle, marginBottom: "8px"}} />
                <input type="file" accept="image/*" onChange={(e)=>setNewProduct({...newProduct,imageFile:e.target.files[0]})} style={{...inputStyle, marginBottom: "10px"}} />
                <p style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "8px" }}>📸 Chagua picha au acha wazi kwa default</p>
                <button type="submit" style={{...btn("linear-gradient(135deg, #10b981, #059669, #34d399)"), fontWeight: "bold"}}>➕ Weka Bidhaa</button>
              </form>
            </>
          )}
        </div>
      )}

      {/* MOBILE BOTTOM NAV */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", borderTop: "2px solid #e2e8f0", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 5px 22px 5px", zIndex: 1000, boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
          {[{ id: "home", label: "Nyumbani", color: "#6366f1", icon: (active)=>(<svg width="24" height="24" viewBox="0 0 24 24" fill={active?"#6366f1":"none"} stroke={active?"#6366f1":"#94a3b8"} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>)},{ id: "shops", label: "Maduka", color: "#6366f1", icon: (active)=>(<svg width="24" height="24" viewBox="0 0 24 24" fill={active?"#6366f1":"none"} stroke={active?"#6366f1":"#94a3b8"} strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>)},{ id: "cart", label: "Kikapu", color: "#f59e0b", badge: cart.reduce((a,b)=>a+b.quantity,0), icon: (active)=>(<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active?"#f59e0b":"#94a3b8"} strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>)},{ id: "dashboard", label: "Dashibodi", color: "#8b5cf6", icon: (active)=>(<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active?"#8b5cf6":"#94a3b8"} strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>)}].map(tab=>(<div key={tab.id} onClick={()=>navigateTo(tab.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "4px", position: "relative", padding: "4px 14px" }}>{tab.icon(page===tab.id)}{tab.badge>0&&<span style={{ position: "absolute", top: "-2px", right: "calc(50% - 18px)", background: "#ef4444", color: "white", fontSize: "10px", fontWeight: "bold", minWidth: "18px", height: "18px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 2px 8px rgba(239,68,68,0.3)" }}>{tab.badge}</span>}<span style={{ fontSize: "10px", fontWeight: page===tab.id?"bold":"normal", color: page===tab.id?tab.color:"#94a3b8" }}>{tab.label}</span></div>))}
        </div>
      )}

    </div>
  )
}