// src/components/ProductSkeleton.jsx

export const ProductSkeleton = () => {
  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "16px",
      overflow: "hidden",
      border: "1px solid #e2e8f0",
      padding: "14px",
      animation: "pulse 1.5s ease-in-out infinite"
    }}>
      <div style={{
        width: "100%",
        height: "200px",
        background: "#e2e8f0",
        borderRadius: "12px",
        marginBottom: "12px"
      }}></div>
      <div style={{
        width: "80%",
        height: "16px",
        background: "#e2e8f0",
        borderRadius: "8px",
        marginBottom: "8px"
      }}></div>
      <div style={{
        width: "60%",
        height: "14px",
        background: "#e2e8f0",
        borderRadius: "8px",
        marginBottom: "12px"
      }}></div>
      <div style={{
        width: "40%",
        height: "20px",
        background: "#e2e8f0",
        borderRadius: "8px"
      }}></div>
    </div>
  )
}

export const ShopSkeleton = () => {
  return (
    <div style={{
      background: "#ffffff",
      borderRadius: "16px",
      padding: "18px",
      textAlign: "center",
      border: "1px solid #e2e8f0",
      animation: "pulse 1.5s ease-in-out infinite"
    }}>
      <div style={{
        width: "70px",
        height: "70px",
        background: "#e2e8f0",
        borderRadius: "16px",
        margin: "0 auto 10px"
      }}></div>
      <div style={{
        width: "80%",
        height: "15px",
        background: "#e2e8f0",
        borderRadius: "8px",
        margin: "8px auto"
      }}></div>
      <div style={{
        width: "60%",
        height: "11px",
        background: "#e2e8f0",
        borderRadius: "8px",
        margin: "8px auto"
      }}></div>
    </div>
  )
}