import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Zap, Film, Image, Layers, Sparkles, Shield, Download, ChevronRight, Play, Star, Clock, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BUNKER_IDEAS } from '@/types/project';
import { useRef } from 'react';

import heroBunker from '@/assets/hero-bunker.jpg';
import beforeAfter from '@/assets/before-after.jpg';
import interiorReveal from '@/assets/interior-reveal.jpg';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const FEATURES = [
  { icon: Image, title: 'AI Scene Generation', desc: 'Imagen 4 creates photorealistic 9:16 vertical scenes with structural consistency across all 9 frames.', highlight: true },
  { icon: Film, title: 'Video Transitions', desc: 'Veo 3.1 generates cinematic transitions between scenes with controlled motion and zero morphing artifacts.' },
  { icon: Sparkles, title: 'Smart Planning', desc: 'Gemini 2.5 Pro builds detailed scene plans with worker logic, camera angles, and continuity enforcement.' },
  { icon: Shield, title: 'Quality Guardrails', desc: 'Built-in validation prevents magical repairs, enforces structural identity, and maintains visual coherence.' },
  { icon: Layers, title: 'Full Pipeline', desc: '5-step workflow from concept selection through final export — organized and sequential.' },
  { icon: Download, title: 'Production Export', desc: 'Download ZIP bundles with assets, prompts, metadata, and CapCut assembly guides.', highlight: true },
];

const STEPS = [
  { num: '01', title: 'Select Bunker Concept', desc: 'Choose from 10 curated environments — mountain, desert, jungle, city ruins, and more.', icon: Layers },
  { num: '02', title: 'Configure & Generate Plan', desc: 'Set interior style, visual mood, and construction intensity. AI generates a full 9-scene plan.', icon: Sparkles },
  { num: '03', title: 'Generate Scene Images', desc: 'Create 9:16 photorealistic images for each scene with structural anchoring and continuity.', icon: Image },
  { num: '04', title: 'Create Video Transitions', desc: 'Generate cinematic video clips connecting each scene pair with motion presets.', icon: Film },
  { num: '05', title: 'Export Everything', desc: 'Download organized ZIP with all assets ready for CapCut, Premiere, or After Effects.', icon: Download },
];

const STATS = [
  { value: '10', label: 'Bunker Environments', icon: Layers },
  { value: '9', label: 'Scene Frames', icon: Image },
  { value: '8', label: 'Video Transitions', icon: Film },
  { value: '5', label: 'Workflow Steps', icon: CheckCircle2 },
];

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* === NAVBAR === */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-black text-lg tracking-tight">BUNKER AI</span>
          </div>
          <div className="hidden sm:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#showcase" className="hover:text-foreground transition-colors">Showcase</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
          </div>
          <Button onClick={onGetStarted} size="sm" className="font-bold gap-1.5 rounded-full px-6 glow-primary-sm">
            Launch Studio <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </nav>

      {/* === HERO === */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax */}
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          <img src={heroBunker} alt="Cinematic bunker entrance" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/80" />
        </motion.div>

        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-grid opacity-20" />

        {/* Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/8 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8 backdrop-blur-sm"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Powered by Gemini · Imagen 4 · Veo 3.1
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.95]"
          >
            Transform
            <br />
            <span className="text-gradient-primary">Abandoned Bunkers</span>
            <br />
            Into Cinema
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            AI-powered studio that generates photorealistic scenes, cinematic video transitions, and complete production assets for viral bunker transformation content.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button onClick={onGetStarted} size="lg" className="rounded-full px-10 font-black text-base glow-primary gap-2.5 h-14 text-lg">
              Start Creating Free <ArrowRight className="w-5 h-5" />
            </Button>
            <a href="#showcase" className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all">
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                <Play className="w-4 h-4 ml-0.5" />
              </div>
              See Examples
            </a>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto"
          >
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-gradient-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-1.5"
          >
            <div className="w-1 h-2 rounded-full bg-primary" />
          </motion.div>
        </motion.div>
      </section>

      {/* === SHOWCASE / Before-After === */}
      <section id="showcase" className="py-24 sm:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">The Transformation</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-5xl font-black tracking-tight">
              From Ruins to <span className="text-gradient-primary">Masterpiece</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mt-5 text-muted-foreground max-w-xl mx-auto text-lg">
              Watch abandoned structures transform into cinematic environments through AI-generated visual storytelling.
            </motion.p>
          </motion.div>

          {/* Before/After Hero Image */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="relative rounded-3xl overflow-hidden border border-border/50 shadow-2xl shadow-primary/5"
          >
            <img src={beforeAfter} alt="Before and after bunker transformation" className="w-full h-auto" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">AI-Generated</span>
                <h3 className="text-2xl font-black mt-1">Complete Visual Pipeline</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">9 photorealistic scenes with cinematic transitions between each frame</p>
              </div>
              <Button onClick={onGetStarted} variant="outline" className="rounded-full font-bold gap-2 border-primary/30 hover:bg-primary/10">
                Try It Now <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Interior Preview */}
          <div className="mt-8 grid sm:grid-cols-2 gap-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="relative rounded-2xl overflow-hidden border border-border/50 group"
            >
              <img src={interiorReveal} alt="Luxury bunker interior" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="text-xs font-bold text-primary">Interior Reveal</span>
                <p className="text-sm font-bold mt-0.5">Luxury Command Center</p>
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="relative rounded-2xl overflow-hidden border border-border/50 bg-card/60 p-8 flex flex-col justify-center"
            >
              <div className="space-y-5">
                {['9:16 Vertical Format', 'Structural Continuity', 'Zero Morphing Artifacts', 'Production-Ready Assets'].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* === BUNKER CONCEPTS === */}
      <section className="py-20 border-y border-border/50 overflow-hidden bg-surface-sunken/30">
        <div className="max-w-7xl mx-auto px-4 mb-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.p variants={fadeUp} custom={0} className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">Environments</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl font-black tracking-tight">10 Curated Bunker Concepts</motion.h2>
          </motion.div>
        </div>

        {/* Scrolling Cards */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex gap-4 overflow-x-auto pb-4 px-8 scrollbar-thin"
          >
            {BUNKER_IDEAS.map((idea, i) => (
              <motion.div
                key={idea.id}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -8, scale: 1.03 }}
                className="shrink-0 w-64 rounded-2xl border border-border bg-card/60 p-6 cursor-default hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 group"
              >
                <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform">{idea.emoji}</span>
                <h3 className="font-bold text-sm mb-2">{idea.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{idea.description}</p>
                <div className="mt-4 pt-3 border-t border-border/50">
                  <span className="text-[10px] font-mono font-bold text-primary/70 uppercase">{idea.environmentType}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === FEATURES === */}
      <section id="features" className="py-24 sm:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Capabilities</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-5xl font-black tracking-tight">
              Everything You Need
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mt-5 text-muted-foreground max-w-xl mx-auto text-lg">
              A complete pipeline from concept to export — powered by Google's latest AI models.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FEATURES.map((feat) => (
              <motion.div
                key={feat.title}
                variants={fadeUp}
                custom={0}
                whileHover={{ y: -6 }}
                className={`group rounded-2xl border p-7 transition-all duration-300 ${
                  feat.highlight 
                    ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10' 
                    : 'border-border bg-card/40 hover:border-primary/30 hover:bg-card/70'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${
                  feat.highlight ? 'bg-primary/20 group-hover:bg-primary/30' : 'bg-primary/10 group-hover:bg-primary/20'
                }`}>
                  <feat.icon className="w-5.5 h-5.5 text-primary" />
                </div>
                <h3 className="font-bold text-base mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === WORKFLOW === */}
      <section id="workflow" className="py-24 sm:py-32 px-4 relative">
        <div className="absolute inset-0 bg-surface-sunken/50" />
        <div className="absolute inset-0 bg-grid opacity-10" />
        
        <div className="relative max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-20"
          >
            <motion.p variants={fadeUp} custom={0} className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Workflow</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-5xl font-black tracking-tight">
              Five Steps to <span className="text-gradient-primary">Production</span>
            </motion.h2>
          </motion.div>

          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-8 sm:left-10 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden sm:block" />

            <div className="space-y-8">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={i}
                  variants={fadeUp}
                  className="flex gap-6 sm:gap-8 items-start group"
                >
                  {/* Step Number */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-card border border-border group-hover:border-primary/40 flex items-center justify-center transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/10">
                      <span className="text-primary font-mono font-black text-xl sm:text-2xl">{step.num}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-px h-8 bg-border sm:hidden" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="pt-2 sm:pt-4 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className="w-4 h-4 text-primary/70" />
                      <h3 className="font-black text-lg sm:text-xl">{step.title}</h3>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* === MODELS / TECH === */}
      <section className="py-20 px-4 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <motion.p variants={fadeUp} custom={0} className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">Technology Stack</motion.p>
            <motion.h3 variants={fadeUp} custom={1} className="text-2xl font-black">Powered by Google's Best AI</motion.h3>
          </motion.div>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid sm:grid-cols-4 gap-4"
          >
            {[
              { name: 'Gemini 2.5 Pro', role: 'Scene Planning & Scripts', color: 'from-blue-500/10 to-blue-500/5' },
              { name: 'Imagen 4', role: 'Photorealistic Images', color: 'from-primary/10 to-primary/5' },
              { name: 'Veo 3.1', role: 'Video Transitions', color: 'from-emerald-500/10 to-emerald-500/5' },
              { name: 'Gemini TTS', role: 'Voiceover Generation', color: 'from-purple-500/10 to-purple-500/5' },
            ].map((model) => (
              <motion.div
                key={model.name}
                variants={fadeUp}
                custom={0}
                whileHover={{ y: -4 }}
                className={`rounded-2xl border border-border bg-gradient-to-br ${model.color} p-6 text-center hover:border-primary/30 transition-all duration-300`}
              >
                <p className="font-mono font-bold text-sm">{model.name}</p>
                <p className="text-xs text-muted-foreground mt-2">{model.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className="py-28 sm:py-40 px-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid opacity-15" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[200px] pointer-events-none" />
        
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-8">
            <Star className="w-3.5 h-3.5" />
            Free to Start
          </motion.div>
          
          <motion.h2 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05]">
            Ready to Build Your
            <br />
            <span className="text-gradient-primary">First Transformation?</span>
          </motion.h2>
          
          <motion.p variants={fadeUp} custom={2} className="mt-6 text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Pick any of our 10 curated environments. Generate scenes, transitions, and export production-ready assets in minutes.
          </motion.p>
          
          <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={onGetStarted} size="lg" className="rounded-full px-12 font-black text-lg glow-primary gap-2.5 h-14">
              Launch Studio <ArrowRight className="w-5 h-5" />
            </Button>
          </motion.div>
          
          <motion.p variants={fadeUp} custom={4} className="mt-6 text-xs text-muted-foreground">
            No credit card required • Generate your first project free
          </motion.p>
        </motion.div>
      </section>

      {/* === FOOTER === */}
      <footer className="border-t border-border/50 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-black text-sm">BUNKER AI</span>
          </div>
          <div className="flex items-center gap-8 text-xs text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#showcase" className="hover:text-foreground transition-colors">Showcase</a>
            <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
          </div>
          <p className="text-xs text-muted-foreground">AI-powered bunker transformation studio</p>
        </div>
      </footer>
    </div>
  );
}
