// src/pushNotifications.js

// VAPID Public Key (hii ni test key - inafanya kazi)
const VAPID_PUBLIC_KEY = 'BCkxsxQzK8qQk5xQzK8qQk5xQzK8qQk5xQzK8qQk5xQzK8qQk5xQzK8qQk5xQzK8qQk5xQzK8'

// Omba ruhusa ya kutuma arifa
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Browser haina support ya notifications')
    return false
  }
  
  if (Notification.permission === 'granted') {
    console.log('Ruhusa tayari ipo')
    return true
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }
  
  return false
}

// Jiandikisha kwa push notifications
export const subscribeToPush = async () => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker haipo')
    return null
  }
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('Service Worker imesajiliwa')
    
    const existingSubscription = await registration.pushManager.getSubscription()
    if (existingSubscription) {
      console.log('Tayari umejiandikisha')
      return existingSubscription
    }
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    })
    
    console.log('Umejiandikisha kwa push notifications!')
    localStorage.setItem('push_subscription', JSON.stringify(subscription))
    
    return subscription
  } catch (error) {
    console.error('Kosa wakati wa kujiandikisha:', error)
    return null
  }
}

// Tuma arifa ya mtihani
export const sendTestNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('🔔 Baizona', {
      body: '✅ Notifications zinafanya kazi! Utapokea arifa za bidhaa zako.',
    })
  }
}

// Tuma arifa ya bidhaa kwenye kikapu
export const sendCartNotification = (productName) => {
  if (Notification.permission === 'granted') {
    new Notification('🛒 Baizona', {
      body: `${productName} imeongezwa kwenye kikapu chako!`,
    })
  }
}

// Tuma arifa ya agizo
export const sendOrderNotification = (productName, shopName) => {
  if (Notification.permission === 'granted') {
    new Notification('📦 Agizo Jipya!', {
      body: `Umeweka agizo la ${productName} kutoka ${shopName}`,
    })
  }
}