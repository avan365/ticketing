import { createPortal } from "react-dom";
import { EventConfig } from "../config/eventConfig";

import type { CartItem } from "../App";

interface FloatingCartButtonProps {
  showCheckout: boolean;
  cart: CartItem[];
  getTotalItems: () => number;
  getTotalPrice: () => number;
  onClick: () => void;
}

export function FloatingCartButton({
  showCheckout,
  cart,
  getTotalItems,
  getTotalPrice,
  onClick,
}: FloatingCartButtonProps) {
  if (showCheckout) return null;

  if (typeof document === "undefined") return null;

  const floatingRoot = document.getElementById("floating-root");
  if (!floatingRoot) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 2147483647,
        pointerEvents: "none",
      }}
    >
      <button
        onClick={onClick}
        style={{
          pointerEvents: "auto",
          backgroundColor: EventConfig.colors.primary.base,
        }}
        className="text-white px-6 py-3 md:px-8 md:py-4 rounded-lg shadow-xl transition-colors duration-200 font-medium flex items-center gap-2 md:gap-3 font-sans"
      >
        <span className="text-lg">🎭</span>
        <span className="text-sm md:text-base">
          View Cart {cart.length > 0 && `(${getTotalItems()})`}
        </span>
        {cart.length > 0 && (
          <span className="text-base md:text-lg font-bold">
            ${getTotalPrice()}
          </span>
        )}
      </button>
    </div>,
    floatingRoot
  );
}




