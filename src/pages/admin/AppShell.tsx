import { useEffect, useRef } from "react";
import { notification } from "antd";
import { Outlet } from "react-router-dom";
import { apiProductService } from "@/services/api";
import { Sidebar } from "./Sidebar.tsx";
import { Topbar } from "./Topbar.tsx";

export default function AppShell() {
  const alertedProductIds = useRef(new Set<string>());

  useEffect(() => {
    let checking = false;
    let hasReportedError = false;
    let active = true;

    const checkLowStock = async () => {
      if (checking) return;
      checking = true;
      try {
        const products = await apiProductService.getAll();
        if (!active) return;

        const lowStockProducts = products.filter((product) => product.stock < 5);
        const lowStockIds = new Set(lowStockProducts.map((product) => product.id));
        alertedProductIds.current.forEach((id) => {
          if (!lowStockIds.has(id)) alertedProductIds.current.delete(id);
        });

        const newlyLowStock = lowStockProducts.filter((product) => !alertedProductIds.current.has(product.id));
        newlyLowStock.forEach((product) => alertedProductIds.current.add(product.id));

        if (newlyLowStock.length) {
          const visibleProducts = newlyLowStock.slice(0, 5);
          notification.warning({
            message: "Low Stock Alert",
            description: (
              <div>
                {visibleProducts.map((product) => (
                  <div key={product.id}>{product.name}: {product.stock} {product.unit} left</div>
                ))}
                {newlyLowStock.length > visibleProducts.length && (
                  <div>And {newlyLowStock.length - visibleProducts.length} more product(s)</div>
                )}
              </div>
            ),
            placement: "topRight",
            duration: 8,
          });
        }
        hasReportedError = false;
      } catch (error) {
        if (!hasReportedError) {
          console.error("Failed to check product stock levels:", error);
          hasReportedError = true;
        }
      } finally {
        checking = false;
      }
    };

    void checkLowStock();
    const intervalId = window.setInterval(() => void checkLowStock(), 30_000);
    window.addEventListener("focus", checkLowStock);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", checkLowStock);
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <div className="px-7 pt-6 pb-14 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
