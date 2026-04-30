export default function Features() {
  const items = [
    {
      title: "Automated SDS Extraction",
      text: "Extract Section 14 transport information instantly."
    },
    {
      title: "UN Classification",
      text: "AI powered dangerous goods classification."
    },
    {
      title: "DG Validation",
      text: "Validate packing group, labels and transport rules."
    },
    {
      title: "IMO / DGD PDF",
      text: "Generate compliant dangerous goods declarations automatically."
    }
  ];

  return (
    <section className="py-32 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 hover:border-orange-500/30 transition"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-6" />

              <h3 className="text-2xl font-bold text-white mb-4">
                {item.title}
              </h3>

              <p className="text-zinc-400 text-lg leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}
