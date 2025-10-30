import { GalleryVerticalEnd } from "lucide-react"

import { AuthForm } from "@/components/auth-form"
import { BrandingCard } from "@/components/branding-card"
import { Toaster } from "@/components/ui/sonner"
import GhostCursor from "@/components/ghost-cursor"

export default function LoginPage() {
  return (
    <>
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="#" className="flex items-center gap-2 font-medium">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <GalleryVerticalEnd className="size-4" />
              </div>
              Byte Pro
            </a>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <AuthForm />
            </div>
          </div>
        </div>
        <div className="relative hidden bg-muted lg:block overflow-hidden">
          {/* YouTube Video Background */}
          <div className="absolute inset-0 w-full h-full">
            <iframe
              src="https://www.youtube.com/embed/58YjsK8NYPE?autoplay=1&mute=1&loop=1&playlist=58YjsK8NYPE&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{
                border: 'none',
                transform: 'scale(1.5)',
                transformOrigin: 'center center'
              }}
              allow="autoplay; encrypted-media"
              allowFullScreen={false}
            />
          </div>
          
          {/* Glassy Blur Card Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
            <div className="backdrop-blur-xl bg-gradient-to-br from-black/40 to-black/20 rounded-3xl p-10 shadow-2xl border border-white/20 relative overflow-hidden">
              <GhostCursor 
                color="#C9A961"
                brightness={1.8}
                bloomStrength={0.25}
                trailLength={70}
                zIndex={1}
              />
              <div className="mb-10 relative z-10">
                <BrandingCard />
              </div>
              <div className="text-center text-white relative z-10">
                <h2 className="text-3xl font-bold mb-2 tracking-tight">Welcome to Byte Pro</h2>
                <p className="text-sm text-white/70 font-light">Your secure authentication solution</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  )
}
