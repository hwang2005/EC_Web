import { useShop } from "../context/ShopContext";
import { CUSTOMER_TIERS, CustomerTier } from "../data/products";
import { Crown } from "lucide-react";

export function CustomerTierSelector() {
  const { customerTier, setCustomerTier } = useShop();

  return (
    <div className="bg-white border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Hạng Khách Hàng</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Chọn hạng khách hàng để xem giá ưu đãi dành riêng cho bạn
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.keys(CUSTOMER_TIERS) as CustomerTier[]).map((tier) => {
          const tierInfo = CUSTOMER_TIERS[tier];
          const isActive = customerTier === tier;

          return (
            <button
              key={tier}
              onClick={() => setCustomerTier(tier)}
              className={`p-3 rounded-lg border-2 transition-all ${
                isActive
                  ? `border-${tierInfo.color}-500 bg-${tierInfo.color}-50`
                  : "border-border hover:border-primary/30"
              }`}
              style={
                isActive
                  ? {
                      borderColor: tierInfo.color === "gray" ? "#9ca3af" :
                                   tierInfo.color === "slate" ? "#64748b" :
                                   tierInfo.color === "yellow" ? "#eab308" :
                                   "#a855f7",
                      backgroundColor: tierInfo.color === "gray" ? "#f3f4f6" :
                                      tierInfo.color === "slate" ? "#f1f5f9" :
                                      tierInfo.color === "yellow" ? "#fef9c3" :
                                      "#faf5ff",
                    }
                  : {}
              }
            >
              <div className="text-center">
                <p className="font-semibold text-sm">{tierInfo.name}</p>
                {tierInfo.discount > 0 && (
                  <p className="text-xs text-primary font-bold mt-1">
                    Giảm {tierInfo.discount}%
                  </p>
                )}
                {tierInfo.discount === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Giá gốc</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 p-3 bg-accent rounded-lg">
        <p className="text-xs text-foreground">
          <strong>Giảm giá hiện tại:</strong> {CUSTOMER_TIERS[customerTier].discount}% cho
          tất cả sản phẩm
        </p>
      </div>
    </div>
  );
}
