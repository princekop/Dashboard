import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";

export const metadata: Metadata = {
  title: "DarkByte Premium - Best Minecraft Server Hosting in India | Free & Paid Plans",
  description: "India's #1 Minecraft server hosting platform. Free hosting, premium Paper/Spigot servers, 24/7 support, instant setup. Best cloud hosting for Minecraft, Discord bots & game servers. Affordable plans starting ₹99/month.",
  keywords: [
    // Indian hosting keywords
    "minecraft hosting india", "best minecraft server hosting india", "minecraft server india",
    "cheap minecraft hosting india", "free minecraft hosting india", "minecraft hosting mumbai",
    "minecraft hosting delhi", "indian minecraft hosting", "minecraft server hosting indian rupees",
    
    // Server types
    "paper server hosting", "spigot server hosting", "bukkit server hosting", 
    "forge server hosting", "fabric server hosting", "modded minecraft hosting",
    "minecraft bedrock hosting", "minecraft java hosting", "purpur server hosting",
    
    // Server features
    "lifesteal server hosting", "pvp server hosting", "survival server hosting",
    "skyblock server hosting", "prison server hosting", "factions server hosting",
    "creative server hosting", "minigames server hosting", "roleplay server hosting",
    
    // General hosting
    "game server hosting", "discord bot hosting", "vps hosting india",
    "cheap game server hosting", "premium server hosting", "cloud hosting india",
    "dedicated server india", "best vps india", "managed hosting india",
    
    // Free keywords
    "free minecraft server hosting", "free server hosting india", "free vps hosting",
    "free minecraft hosting 24/7", "free game server", "free cloud hosting",
    
    // Premium keywords
    "premium minecraft hosting", "premium server hosting india", "best paid hosting",
    "professional minecraft hosting", "enterprise server hosting", "business hosting india",
    
    // Technical
    "pterodactyl panel hosting", "high performance minecraft", "ddos protected hosting",
    "low latency minecraft server", "fast minecraft hosting", "ssd minecraft hosting",
    "nvme minecraft hosting", "unlimited bandwidth hosting", "automatic backups hosting",
    
    // Brand variations
    "darkbyte hosting", "darkbyte premium", "darkbyte minecraft", "darkbyte servers",
    "darkbyte cloud", "darkbyte india", "dark byte hosting"
  ].join(", "),
  authors: [{ name: "DarkByte Premium", url: "https://darkbyte.in" }],
  creator: "DarkByte Premium Pvt. Ltd.",
  publisher: "DarkByte Premium",
  applicationName: "DarkByte Premium Cloud Platform",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://darkbyte.in",
    siteName: "DarkByte Premium",
    title: "Best Minecraft Server Hosting India | Free & Premium Plans",
    description: "India's leading Minecraft server hosting. Free plans available. Paper, Spigot, Forge supported. 24/7 uptime. Starting ₹99/month. Instant setup.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DarkByte Premium - Best Minecraft Hosting India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@darkbytein",
    creator: "@darkbytein",
    title: "DarkByte Premium - Best Minecraft Hosting in India",
    description: "Free & Premium Minecraft server hosting. Paper, Spigot, Forge. 24/7 support. Starting ₹99/month.",
    images: ["/twitter-image.png"],
  },
  alternates: {
    canonical: "https://darkbyte.in",
    languages: {
      'en-IN': 'https://darkbyte.in',
      'en-US': 'https://darkbyte.in/en',
    },
  },
  category: "technology",
  classification: "Hosting Services, Game Servers, Cloud Computing",
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning={true}>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
