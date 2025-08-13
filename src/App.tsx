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
      // Preload all images and components
      const imageUrls = [
        '/public/assets/Focus_bg.gif',
        '/assets/garden/Bamboo_Fence.png',
        '/assets/garden/Bamboo_pavilion.png',
        '/assets/garden/Cherry_blossom_tree.png',
        '/assets/garden/Dragon_Fountain.gif',
        '/assets/garden/Eternal_Bloom_Sakura.png',
        '/assets/garden/Fox_spirit_shrine.png',
        '/assets/garden/Garden_Gate_(Torii).png',
        '/assets/garden/Giant_Lucky_Carp_Statue.png',
        '/assets/garden/Golden_Koi_Pond.gif',
        '/assets/garden/Gravel_Patch_Raked_Sand.png',
        '/assets/garden/Lotus_pond.png',
        '/assets/garden/Miniature_Mount_Fuji.png',
        '/assets/garden/Moss_Rock_Cluster.png',
        '/assets/garden/Northern_light_lantern.png',
        '/assets/garden/Paper_Lamp_Post.png',
        '/assets/garden/Phoenix_Perch.gif',
        '/assets/garden/Small_Pond.png',
        '/assets/garden/Sun_spirit_fountain.gif',
        '/assets/garden/Water_Ladle_Stand_(Tsukubai).png',
        '/assets/garden/bamboo_water_sprout_shishi_odoshi.png',
        '/assets/garden/bonsai_tree.png',
        '/assets/garden/eternal_sand_garden.png',
        '/assets/garden/golden_leaf_whirlpool.png',
        '/assets/garden/harvest_rice_stack.png',
        '/assets/garden/ice_bridge.png',
        '/assets/garden/lazy_panda_hammock.gif',
        '/assets/garden/low_shrub.png',
        '/assets/garden/maple_tree.png',
        '/assets/garden/meditation_mat.png',
        '/assets/garden/snow_stone.png',
        '/assets/garden/spirit_wind_chimes.png',
        '/assets/garden/spring_waterfall.png',
        '/assets/garden/stone_pagoda_small.png',
        '/assets/garden/stone_path.png',
        '/assets/garden/stone_step.png',
        '/assets/garden/wooden_bench.png',
        '/assets/garden/zen_arch_gate.png',
        '/assets/garden/zen_lantern.png',
        '/assets/relics/Ancient_Tea_Bowl.png',
        '/assets/relics/Monk\'s_wooden_fish_drum_mokugyo.png',
        '/assets/relics/Timekeeper\'s_sandglass.png',
        '/assets/relics/Zen_Fan.png',
        '/assets/relics/Zenmodoro_Shukan.png',
        '/assets/relics/celestial_compass.png',
        '/assets/relics/crane_feather_amulet.png',
        '/assets/relics/hand_bell.png',
        '/assets/relics/jade_meditation_beads.png',
        '/assets/relics/koan_scroll.png',
        '/lovable-uploads/c50dd7cf-237e-4338-9eeb-fce7866e2d36.png',
        '/lovable-uploads/20a958db-a342-42f8-a711-30e17af81a0e.png'
      ];

      const imagePromises = imageUrls.map(url => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve; // Don't fail the whole preload if one image fails
          img.src = url;
        });
      });

      await Promise.all([
        ...imagePromises,
        import("./pages/NotFound"),
        import("./pages/Tasks"),
        import("./pages/Store"),
        import("./pages/FocusClub"),
        import("./pages/Settings"),
        import("./pages/ZenPath"),
        import("./pages/TreasureHall"),
        import("./pages/WorldMap"),
      ]);
      
      // Show splash for at least 2 seconds to ensure all images load
      setTimeout(() => setLoading(false), 2000);
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
        {/* Splash overlay on initial load */}
        <Splash loading={loading} />
        <DevPanel />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default AppRoot;
