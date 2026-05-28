import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Script from "@/components/landing/Script";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main style={{ background: "var(--bg-deep)" }}>
      <Nav />
      <Hero />
      <HowItWorks />
      <Script />
      <Pricing />
      <Footer />
    </main>
  );
}
