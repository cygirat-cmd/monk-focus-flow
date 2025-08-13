import React, { useEffect, useState } from "react";
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
const WorldMap = React.lazy(() => import("./pages/WorldMap"));
import Splash from "./components/Splash";
import ThemeAuto from "./components/ThemeAuto";
import { ThemeProvider } from "next-themes";
import DevPanel from "./components/dev/DevPanel";

const queryClient = new QueryClient();

const AppRoot = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const preload = async () => {
      await Promise.all([
        import("./pages/NotFound"),
        import("./pages/Tasks"),
        import("./pages/Store"),
        import("./pages/FocusClub"),
        import("./pages/Settings"),
        import("./pages/ZenPath"),
        import("./pages/TreasureHall"),
        import("./pages/WorldMap"),
      ]);
      setLoading(false);
    };
    preload();
  }, []);

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
              <Route path="/world" element={<WorldMap />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </div>
          </React.Suspense>
        </BrowserRouter>
        {/* Splash overlay on initial load - HIDDEN */}
        {/* <Splash loading={loading} /> */}
        <DevPanel />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default AppRoot;
