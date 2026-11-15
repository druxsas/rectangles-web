import { create } from "zustand";

type CheckoutState = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

/**
 * iMac G3 checkout overlay — opens when the user clicks the iMac at the
 * counter (see Store.tsx CounterZone). Keeps the store scene static and
 * never forces the overlay onto the scroll path.
 */
export const useCheckout = create<CheckoutState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
