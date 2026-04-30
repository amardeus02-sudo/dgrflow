export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-32 relative z-10">
        
        <div className="max-w-4xl">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400 text-sm mb-8">
            The standard for dangerous goods compliance
          </div>

          <h1 className="text-7xl font-black text-white leading-tight">
            Ship dangerous goods
            <span className="text-orange-500"> without the danger.</span>
          </h1>

          <p className="mt-8 text-2xl text-zinc-400 leading-relaxed max-w-3xl">
            Automate SDS extraction, UN classification, DG validation and IMO document generation with AI.
          </p>

          <div className="flex items-center gap-4 mt-10">
            
            <button className="bg-orange-500 hover:bg-orange-600 transition text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-2xl shadow-orange-500/20">
              Open Dashboard
            </button>

            <button className="border border-zinc-700 hover:border-zinc-500 transition text-white px-8 py-4 rounded-2xl text-lg">
              Learn More
            </button>

          </div>
        </div>
      </div>
    </section>
  );
}
