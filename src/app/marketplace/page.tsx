"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingBag, Check, Sparkles } from "lucide-react";
import {
  marketplaceProducts,
  MARKETPLACE_CATEGORIES,
} from "@/lib/marketplace-data";
import type { MarketplaceProduct } from "@/lib/marketplace-data";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const cardVariant = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: "easeOut" as const,
    },
  }),
};

/* ------------------------------------------------------------------ */
/*  Type badge colors                                                  */
/* ------------------------------------------------------------------ */

const typeBadgeClasses: Record<string, string> = {
  toolkit: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  template: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  framework: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  course: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  bundle: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

/* ------------------------------------------------------------------ */
/*  Product Card                                                       */
/* ------------------------------------------------------------------ */

const productBgImages = [
  "/images/keith/a.jpg",
  "/images/keith/b.jpg",
  "/images/keith/c.jpg",
  "/images/keith/d.jpg",
];

function ProductCard({ product, index }: { product: MarketplaceProduct; index: number }) {
  const bgImage = productBgImages[index % productBgImages.length];
  return (
    <motion.div
      custom={index}
      variants={cardVariant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="relative group bg-[#161B22] border border-[#21262D] rounded-xl p-6 flex flex-col hover:border-[#2764FF]/30 hover:shadow-[0_0_30px_rgba(39,100,255,0.1)] transition-all duration-300 overflow-hidden"
    >
      {/* Subtle background watermark image */}
      <div className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500">
        <Image src={bgImage} alt="" fill className="object-cover" />
      </div>
      {/* Left accent bar */}
      <div className="absolute left-0 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#2764FF] to-[#21B8CD] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
      {/* Popular badge */}
      {product.popular && (
        <div className="absolute -top-3 right-5 flex items-center gap-1.5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          <Sparkles size={12} />
          Popular
        </div>
      )}

      {/* Header: emoji + badges */}
      <div className="relative z-10 flex items-start justify-between mb-4">
        <span className="text-4xl leading-none" aria-hidden="true">
          {product.imageTag}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#2764FF]/10 text-[#2764FF] border border-[#2764FF]/20">
            {product.category}
          </span>
          <span
            className={`text-[11px] font-medium px-2.5 py-1 rounded-full border capitalize ${
              typeBadgeClasses[product.type] ?? "bg-white/10 text-klo-text border-klo-slate"
            }`}
          >
            {product.type}
          </span>
        </div>
      </div>

      {/* Title & description */}
      <h3 className="relative z-10 font-display text-lg font-bold text-klo-text mb-2 group-hover:text-[#2764FF] transition-colors duration-200">
        {product.title}
      </h3>
      <p className="relative z-10 text-sm text-klo-muted leading-relaxed mb-5 line-clamp-3">
        {product.description}
      </p>

      {/* Features */}
      <ul className="relative z-10 flex-1 space-y-2 mb-6">
        {product.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-klo-text">
            <Check size={14} className="text-[#2764FF] mt-0.5 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Price + CTA */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-klo-slate/50">
        <span className="font-display text-2xl font-bold text-klo-text">
          ${product.price.toFixed(2)}
        </span>
        <button className="px-5 py-2.5 bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white text-sm font-bold rounded-full hover:brightness-110 active:scale-[0.97] transition-all duration-200 cursor-pointer">
          Purchase
        </button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

const allCategories = ["All", ...MARKETPLACE_CATEGORIES] as const;

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return marketplaceProducts;
    return marketplaceProducts.filter(
      (p) => p.category === activeCategory
    );
  }, [activeCategory]);

  return (
    <div className="min-h-screen px-6 py-24">
      <div className="max-w-6xl mx-auto">
        {/* -------------------------------------------------------- */}
        {/*  Hero                                                     */}
        {/* -------------------------------------------------------- */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-12"
        >
          <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#2764FF]/10 flex items-center justify-center">
              <ShoppingBag size={24} className="text-[#2764FF]" />
            </div>
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-klo-text">
                Digital Resource{" "}
                <span className="text-[#2764FF]">Marketplace</span>
              </h1>
            </div>
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={1}
            className="text-klo-muted text-base leading-relaxed max-w-2xl"
          >
            Premium individual resources, toolkits, and frameworks crafted by
            Keith L. Odom. Purchase exactly what you need -- no subscription
            required.
          </motion.p>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  Category Filter Tabs                                     */}
        {/* -------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" as const }}
          className="mb-10"
        >
          <div className="flex flex-wrap gap-2">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 cursor-pointer ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white border-[#2764FF]"
                    : "bg-[#161B22] text-[#8B949E] border-[#21262D] hover:text-klo-text hover:border-[#2764FF]/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* -------------------------------------------------------- */}
        {/*  Results count                                            */}
        {/* -------------------------------------------------------- */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3, ease: "easeOut" as const }}
          className="text-sm text-klo-muted mb-8"
        >
          Showing{" "}
          <span className="text-klo-text font-medium">
            {filteredProducts.length}
          </span>{" "}
          {filteredProducts.length === 1 ? "resource" : "resources"}
        </motion.p>

        {/* -------------------------------------------------------- */}
        {/*  Product Grid                                             */}
        {/* -------------------------------------------------------- */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" as const }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={28} className="text-klo-muted" />
            </div>
            <h3 className="font-display text-lg font-semibold text-klo-text mb-2">
              No resources in this category
            </h3>
            <p className="text-sm text-klo-muted mb-6 max-w-md mx-auto">
              Try selecting a different category to find what you are looking for.
            </p>
            <button
              onClick={() => setActiveCategory("All")}
              className="text-sm text-[#2764FF] hover:text-[#2764FF]/80 transition-colors cursor-pointer font-medium"
            >
              View all resources
            </button>
          </motion.div>
        )}

        {/* -------------------------------------------------------- */}
        {/*  Stripe note                                              */}
        {/* -------------------------------------------------------- */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" as const }}
          className="mt-16 text-center"
        >
          <p className="text-xs text-klo-muted/60">
            All transactions are securely processed.{" "}
            <span className="font-medium text-klo-muted/80">Powered by Stripe</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
