// store/formStore.js
import { create } from "zustand";

export const useFormStore = create((set) => ({
  formData: {},
  setFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),
  resetFormData: () => set({ formData: {} })
}));
