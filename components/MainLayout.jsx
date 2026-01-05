"use client";

import { usePathname } from "next/navigation";

export default function MainLayout({ children }) {
    const pathname = usePathname();
    const isDashboard = pathname === "/dashboard";

    return (
        <main className={isDashboard ? "" : "pt-20"}>
            {children}
        </main>
    );
}
