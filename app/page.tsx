import Masthead from "@/components/landing/Masthead";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import References from "@/components/landing/References";
import Audience from "@/components/landing/Audience";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Masthead />
      <main>
        <Hero />
        <HowItWorks />
        <References />
        <Audience />
      </main>
      <Footer />
    </>
  );
}
