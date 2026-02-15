"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Upload, FileText, Menu, X, Sun, Moon, Briefcase } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const toggleTheme = () => {
        document.documentElement.classList.add("transitioning");
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        setTimeout(() => document.documentElement.classList.remove("transitioning"), 400);
    };

    const navigation = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Upload Resume", href: "/upload", icon: Upload },
        { name: "Matches", href: "/matches", icon: Briefcase },
        { name: "Resumes", href: "/resumes", icon: FileText },
    ];

    const isDark = resolvedTheme === "dark";

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <button
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden w-full h-full cursor-default"
                    onClick={() => setIsSidebarOpen(false)}
                    aria-label="Close sidebar"
                    type="button"
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 glass-strong transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:flex-col border-r border-border/50",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Gradient accent line */}
                <div className="h-[2px] gradient-bg" />

                <div className="flex h-16 items-center justify-between px-6 border-b border-border/50">
                    <Link href="/" className="flex items-center gap-2.5 font-bold text-xl group">
                        <div className="p-1.5 rounded-lg gradient-bg text-white group-hover:scale-110 transition-transform duration-200">
                            <Briefcase className="h-4 w-4" />
                        </div>
                        <span className="gradient-text">ResumeAI</span>
                    </Link>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full gradient-bg" />
                                )}
                                <item.icon className={cn(
                                    "h-5 w-5 transition-transform duration-200",
                                    isActive ? "" : "group-hover:scale-110"
                                )} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Theme Toggle */}
                <div className="p-4 border-t border-border/50">
                    {mounted && (
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200 group"
                            aria-label="Toggle theme"
                        >
                            <div className="relative w-12 h-6 rounded-full bg-muted border border-border/50 transition-colors duration-300 flex-shrink-0">
                                {/* Sliding pill */}
                                <div
                                    className={cn(
                                        "absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center shadow-sm",
                                        isDark
                                            ? "left-[calc(100%-22px)] bg-indigo-500"
                                            : "left-0.5 bg-amber-400"
                                    )}
                                >
                                    {isDark ? (
                                        <Moon className="h-3 w-3 text-white" />
                                    ) : (
                                        <Sun className="h-3 w-3 text-white" />
                                    )}
                                </div>
                            </div>
                            <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Header (Mobile) */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 glass px-6 lg:hidden">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <span className="font-semibold gradient-text">ResumeAI</span>
                    </div>
                    {mounted && (
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-muted/80 transition-colors text-muted-foreground"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </button>
                    )}
                </header>

                <main className="flex-1 p-6 lg:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
