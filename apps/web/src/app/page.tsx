import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ExampleScriptSection from "@/components/landing/ExampleScriptSection";

function TopNav() {
  return (
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
                    <div className="text-lg font-semibold text-neutral-950">Sturdy</div>

                            <nav className="hidden items-center gap-8 text-sm text-neutral-600 md:flex">
                                      <a href="#how-it-works" className="transition hover:text-neutral-950">
                                                  How it works
                                                            </a>
                                                                      <a href="#example" className="transition hover:text-neutral-950">
                                                                                  Example
                                                                                            </a>
                                                                                                    </nav>

                                                                                                            <button className="rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800">
                                                                                                                      Get script
                                                                                                                              </button>
                                                                                                                                    </div>
                                                                                                                                        </header>
                                                                                                                                          );
                                                                                                                                          }

                                                                                                                                          export default function Home() {
                                                                                                                                            return (
                                                                                                                                                <main className="min-h-screen bg-[#FCFBF8] text-neutral-900">
                                                                                                                                                      <TopNav />
                                                                                                                                                            <HeroSection />
                                                                                                                                                                  <div id="how-it-works">
                                                                                                                                                                          <HowItWorksSection />
                                                                                                                                                                                </div>
                                                                                                                                                                                      <div id="example">
                                                                                                                                                                                              <ExampleScriptSection />
                                                                                                                                                                                                    </div>
                                                                                                                                                                                                        </main>
                                                                                                                                                                                                          );
                                                                                                                                                                                                          }