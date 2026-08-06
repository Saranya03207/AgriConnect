import { Link } from 'react-router-dom';
import {
  Sprout, ArrowRight, CheckCircle2, Star, Users, Package,
  TrendingUp, Wheat, HardHat, Wrench, Truck, Warehouse,
  Factory, Building2, Zap, ShieldCheck, Globe2, ChevronRight,
} from 'lucide-react';
import { ROUTES } from '@/constants';

/* ── Data ──────────────────────────────────────────────────────── */
const stats = [
  { value: '12,000+', label: 'Registered Users',    icon: Users },
  { value: '45,000+', label: 'Listings Created',    icon: Package },
  { value: '₹2.4Cr+', label: 'Transactions Done',  icon: TrendingUp },
  { value: '18',      label: 'States Connected',    icon: Globe2 },
];

const roles = [
  { icon: Wheat,     color: 'bg-emerald-50 text-emerald-600 border-emerald-200', title: 'Farmer',            desc: 'List produce, connect with buyers & service providers.' },
  { icon: HardHat,   color: 'bg-amber-50  text-amber-600  border-amber-200',  title: 'Labour Provider',   desc: 'Offer seasonal labour services to farms near you.' },
  { icon: Wrench,    color: 'bg-blue-50   text-blue-600   border-blue-200',   title: 'Equipment Owner',   desc: 'Rent out tractors, harvesters, and farm machinery.' },
  { icon: Truck,     color: 'bg-violet-50 text-violet-600 border-violet-200', title: 'Transport Provider',desc: 'Move agricultural goods across regions efficiently.' },
  { icon: Warehouse, color: 'bg-cyan-50   text-cyan-600   border-cyan-200',   title: 'Storage Owner',     desc: 'Provide cold storage and warehousing facilities.' },
  { icon: Factory,   color: 'bg-orange-50 text-orange-600 border-orange-200', title: 'Processing Unit',   desc: 'Process raw produce into value-added products.' },
  { icon: Building2, color: 'bg-slate-50  text-slate-600  border-slate-200',  title: 'Industry / Buyer',  desc: 'Source quality agricultural outputs in bulk.' },
];

const features = [
  { icon: Zap,         title: 'AI-Powered Matching',    desc: 'Smart recommendations connect the right buyers with the right sellers instantly.' },
  { icon: ShieldCheck, title: 'Verified Profiles',      desc: 'Every user is KYC-verified so you trade with confidence and trust.' },
  { icon: Globe2,      title: 'Pan-India Network',      desc: 'Access a nationwide ecosystem of farmers, processors, and logistics partners.' },
  { icon: TrendingUp,  title: 'Real-time Price Insights',desc: 'Live market rates and AI-driven price forecasts help you make smarter decisions.' },
];

const testimonials = [
  { name: 'Rajan Patel',   role: 'Wheat Farmer, Punjab',        rating: 5, text: 'AgriConnect helped me find a bulk buyer within 24 hours. No middlemen, better price.' },
  { name: 'Sunita Reddy',  role: 'Cold Storage Owner, AP',      rating: 5, text: 'My storage capacity is now 90% booked every season thanks to this platform.' },
  { name: 'Arjun Mehta',   role: 'Equipment Owner, Maharashtra', rating: 5, text: 'I rent out my tractor 3x more than before. The booking process is seamless.' },
];

/* ── Component ─────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="bg-background overflow-x-hidden">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-emerald-50/60 dark:to-emerald-950/20" />
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-400/10 blur-[100px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: 'radial-gradient(circle, #16a34a 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full border border-primary/20">
              <Sprout className="w-4 h-4" />
              AI-Powered Agricultural Platform
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] text-balance text-foreground">
              Connecting India's{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                Agricultural
              </span>{' '}
              Ecosystem
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Farmers, equipment owners, labour providers, transporters, storage owners, processing units
              and industries — all on one powerful platform.
            </p>

            <div className="flex flex-wrap gap-3">
              {['No middlemen', 'AI price insights', 'Verified users', 'Pan-India reach'].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  {t}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link to={ROUTES.REGISTER}
                className="btn-primary py-3.5 px-8 text-base rounded-2xl">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to={ROUTES.MARKETPLACE}
                className="btn-secondary py-3.5 px-8 text-base rounded-2xl font-semibold">
                Browse Marketplace
              </Link>
            </div>
          </div>

          {/* Right — floating role cards */}
          <div className="relative hidden lg:block h-[520px] animate-fade-in" style={{ animationDelay: '200ms' }}>
            {[
              { title: 'Wheat Farmer',      sub: 'Punjab',         emoji: '🌾', top: '0%',   left: '5%',  delay: '0ms' },
              { title: 'Cold Storage',      sub: 'Available now',  emoji: '🏭', top: '8%',   left: '58%', delay: '120ms' },
              { title: 'Tractor Rental',    sub: '₹1,200/day',     emoji: '🚜', top: '38%',  left: '0%',  delay: '240ms' },
              { title: 'Transport Route',   sub: 'Punjab → Delhi', emoji: '🚛', top: '52%',  left: '52%', delay: '360ms' },
              { title: 'Rice Mill',         sub: 'Processing unit', emoji: '⚙️', top: '75%',  left: '18%', delay: '480ms' },
            ].map(card => (
              <div key={card.title}
                className="absolute bg-card border border-border rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 animate-fade-in-up hover:shadow-xl transition-shadow cursor-default"
                style={{ top: card.top, left: card.left, animationDelay: card.delay, minWidth: 190 }}>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">{card.emoji}</div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{card.title}</p>
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                </div>
              </div>
            ))}
            {/* Central badge */}
            <div className="absolute top-[34%] left-[30%] w-36 h-36 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex flex-col items-center justify-center text-white shadow-2xl shadow-primary/30 animate-float">
              <Sprout className="w-10 h-10 mb-1" />
              <span className="text-xs font-bold tracking-wide">AGRICONNECT</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ STATS BAR ═══════════════ */}
      <section className="border-y border-border bg-card/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-extrabold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ WHO IS IT FOR ═══════════════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest">Who it's for</p>
            <h2 className="text-4xl font-extrabold text-foreground">Built for every player<br />in the agri-chain</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Whether you grow, process, move, or buy — AgriConnect has a role designed for you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {roles.map(({ icon: Icon, color, title, desc }) => (
              <div key={title}
                className="group section-card p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-default">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border mb-4 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-foreground mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <div className="mt-3 flex items-center text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Join as {title} <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section className="py-24 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest">Platform features</p>
            <h2 className="text-4xl font-extrabold text-foreground">Everything you need<br />to grow your business</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="section-card p-6 space-y-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-3">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest">Testimonials</p>
            <h2 className="text-4xl font-extrabold text-foreground">Trusted by thousands<br />across India</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, rating, text }) => (
              <div key={name} className="section-card p-6 space-y-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground italic leading-relaxed">"{text}"</p>
                <div>
                  <p className="font-bold text-sm text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA ═══════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 auth-gradient -z-10" />
        <div className="absolute inset-0 opacity-10 -z-10"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '36px 36px' }} />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white space-y-8">
          <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight">
            Ready to transform your<br />agricultural business?
          </h2>
          <p className="text-white/80 text-lg">
            Join 12,000+ users already growing with AgriConnect. Sign up free — no credit card required.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to={ROUTES.REGISTER}
              className="inline-flex items-center gap-2 bg-white text-primary font-bold py-4 px-10 rounded-2xl hover:bg-white/90 transition-all shadow-2xl shadow-black/20 active:scale-[0.98] text-base">
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to={ROUTES.LOGIN}
              className="inline-flex items-center gap-2 bg-white/15 text-white font-semibold py-4 px-8 rounded-2xl hover:bg-white/25 transition-all backdrop-blur-sm border border-white/20 text-base">
              Sign In
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
