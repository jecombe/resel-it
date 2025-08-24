import Header from "../component/Header";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <Header />
      <div className="flex flex-col items-center text-center px-4 sm:px-20 py-16 bg-gradient-to-b from-[#1b1c26] to-[#111214] text-white min-h-screen gap-12">
        
        {/* Logo */}
        <div className="flex justify-center items-center mb-6">
          <Image
            src="/logo.png"
            alt="ReselIT Logo"
            width={150}
            height={150}
            className="object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
          ReselIT
        </h1>

        {/* Subtitle */}
        <p className="text-indigo-200 text-lg sm:text-xl max-w-3xl mb-12">
          Create events, buy and resell your tickets <b>decentrally</b> with dynamic pricing based on sales and purchases.
        </p>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
          {[
            {
              title: "Create",
              desc: "Create an ERC-721 NFT event with dynamic pricing according to sales and purchases.",
            },
            {
              title: "Events",
              desc: "Browse events and buy tickets in the primary market.",
            },
            {
              title: "Profile",
              desc: "Manage your tickets, approve them, and list them for resale easily.",
            },
            {
              title: "Resale",
              desc: "Buy tickets listed by other users through the decentralized marketplace.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-[#222330] p-6 rounded-xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-1"
            >
              <h3 className="text-indigo-500 text-2xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-indigo-200">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
