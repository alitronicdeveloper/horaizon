// src/pushNotifications.js
const VAPID_PUBLIC_KEY = 'BPX6RyIoHc4w5-95eQefUJbWemp9TIADW5ZoNvkv55VX4TxA47fr_1eB1Ddym7qsvxJGkKV5DUFZva1n1AV1MBQ'

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

export const sendTestNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('🔔 Baizona', {
      body: '✅ Notifications zinafanya kazi! Utapokea arifa za bidhaa zako.',
      icon: '/logo-192.png'
    })
  }
}

export const sendCartNotification = (productName) => {
  if (Notification.permission === 'granted') {
    new Notification('🛒 Baizona', {
      body: `${productName} imeongezwa kwenye kikapu chako!`,
      icon: '/logo-192.png'
    })
  }
}