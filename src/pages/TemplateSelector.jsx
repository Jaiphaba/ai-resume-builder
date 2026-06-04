import React from "react";

const MOCK_TEMPLATES = [
  {
    id: "tpl-1",
    name: "ATS Professional",
    image: "/templates/ats-professional.png",
    badge: "ATS Friendly",
    description:
      "Clean single-column resume optimized for recruiters and ATS systems.",
  },
  {
    id: "tpl-2",
    name: "Modern Blue",
    image: "/templates/modern-blue.png",
    badge: "Popular",
    description:
      "Modern professional design with elegant spacing and accents.",
  },
  {
    id: "tpl-3",
    name: "Executive",
    image: "/templates/executive.png",
    badge: "Premium",
    description:
      "Sophisticated layout designed for managers and senior professionals.",
  },
  {
    id: "tpl-4",
    name: "Sidebar Resume",
    image: "/templates/sidebar.png",
    badge: "Creative",
    description:
      "Profile-focused design with a skills sidebar and modern structure.",
  },
  {
    id: "tpl-5",
    name: "Tech Resume",
    image: "/templates/tech.png",
    badge: "Developer",
    description:
      "Project-centric layout perfect for software engineers and IT roles.",
  },
  {
    id: "tpl-6",
    name: "Minimal CV",
    image: "/templates/minimal-cv.png",
    badge: "Academic",
    description:
      "Simple academic CV format for research and educational profiles.",
  },
];

export default function TemplateSelector({
  theme,
  activeTheme,
  onSelectTemplate,
}) {
  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h2
          className={`text-2xl font-bold transition-colors duration-300 ${
            theme === "dark" ? "text-white" : "text-neutral-900"
          }`}
        >
          Choose Your Resume Template
        </h2>

        <p
          className={`mt-2 text-sm transition-colors duration-300 ${activeTheme.textMuted}`}
        >
          Select a template and customize it later with colors, fonts,
          layouts, and AI-generated content.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

        {MOCK_TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className={`group overflow-hidden rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
              theme === "dark"
                ? "bg-zinc-900 border-zinc-800"
                : "bg-white border-neutral-200 shadow-sm"
            }`}
          >
            {/* Preview */}
            <div className="relative">

              <img
                src={tpl.image}
                alt={tpl.name}
                className="w-full h-[380px] object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Badge */}
              <div className="absolute top-3 left-3">
                <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  {tpl.badge}
                </span>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <button
                  className="bg-white text-black px-5 py-2 rounded-xl font-semibold"
                >
                  Preview Template
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5">

              <h3
                className={`font-bold text-lg ${
                  theme === "dark"
                    ? "text-white"
                    : "text-neutral-900"
                }`}
              >
                {tpl.name}
              </h3>

              <p
                className={`text-sm mt-2 leading-relaxed ${activeTheme.textMuted}`}
              >
                {tpl.description}
              </p>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-5">

                <button
                  onClick={() =>
                    onSelectTemplate(tpl, "resume")
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition"
                >
                  Resume
                </button>

                <button
                  onClick={() =>
                    onSelectTemplate(tpl, "cv")
                  }
                  className={`py-2.5 rounded-xl border font-medium transition ${
                    theme === "dark"
                      ? "border-zinc-700 text-zinc-100 hover:bg-zinc-800"
                      : "border-neutral-300 text-neutral-800 hover:bg-neutral-100"
                  }`}
                >
                  CV
                </button>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}