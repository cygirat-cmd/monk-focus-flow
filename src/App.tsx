import React, { useState } from "react";
// import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Tasks = React.lazy(() => import("./pages/Tasks"));
const Store = React.lazy(() => import("./pages/Store"));
const FocusClub = React.lazy(() => import("./pages/FocusClub"));
const Settings = React.lazy(() => import("./pages/Settings"));
const ZenPath = React.lazy(() => import("./pages/ZenPath"));
const TreasureHall = React.lazy(() => import("./pages/TreasureHall"));
const Garden = React.lazy(() => import("./pages/Garden"));
import Splash from "./components/Splash";
import ThemeAuto from "./components/ThemeAuto";
import { ThemeProvider } from "next-themes";
import DevPanel from "./components/dev/DevPanel";

const queryClient = new QueryClient();

const AppRoot = () => {
  const [showSplash, setShowSplash] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemeAuto />
        {/* <Toaster /> */}
        <Sonner />
        <BrowserRouter>
          <React.Suspense fallback={<div className="p-6 text-center text-muted-foreground">Loading…</div>}>
            <div className="smooth-transition">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/store" element={<Store />} />
              <Route path="/focus-club" element={<FocusClub />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/zen-path" element={<ZenPath />} />
              <Route path="/treasure-hall" element={<TreasureHall />} />
              <Route path="/garden" element={<Garden />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </div>
          </React.Suspense>
        </BrowserRouter>
        {/* Splash overlay on initial load */}
        {showSplash && (
          <Splash onDone={() => setShowSplash(false)} />
        )}
        <DevPanel />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default AppRoot;
