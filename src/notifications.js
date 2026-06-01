// src/notifications.js

export const showToast = (message, type = 'success') => {
  // Ondoa toast iliyopo ikiwepo
  const existingToast = document.querySelector('.baizona-toast')
  if (existingToast) existingToast.remove()
  
  // Chagua emoji kulingana na aina
  let emoji = '✅'
  if (type === 'cart') emoji = '🛒'
  if (type === 'error') emoji = '❌'
  if (type === 'info') emoji = 'ℹ️'
  
  // Rangi ya border kulingana na aina
  let borderColor = '#10b981'
  if (type === 'error') borderColor = '#ef4444'
  if (type === 'cart') borderColor = '#6366f1'
  
  // Unda toast
  const toast = document.createElement('div')
  toast.className = 'baizona-toast'
  toast.innerHTML = `
    <div style="
      position: fixed;
      top: 80px;
      right: 20px;
      background: white;
      border-radius: 12px;
      padding: 12px 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 9999;
      border-left: 4px solid ${borderColor};
      animation: slideIn 0.3s ease;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: #1e293b;
    ">
      <span style="font-size: 20px;">${emoji}</span>
      <span>${message}</span>
    </div>
  `
  
  // Ongeza style za animation ikiwa hazipo
  if (!document.querySelector('#toast-styles')) {
    const style = document.createElement('style')
    style.id = 'toast-styles'
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
  
  document.body.appendChild(toast)
  
  // Ondoa baada ya sekunde 3
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease'
    setTimeout(() => {
      if (toast.parentNode) toast.remove()
    }, 300)
  }, 3000)
}