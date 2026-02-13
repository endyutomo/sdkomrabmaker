import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  FileText, 
  Calculator, 
  ShieldCheck, 
  ArrowRight, 
  Download, 
  LayoutTemplate,
  CheckCircle2
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">BOQ Builder</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#workflow" className="hover:text-primary transition-colors">Workflow</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </div>
          <Link href="/builder">
            <Button className="boq-accent-gradient h-9">Get Started Free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-accent text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> New AI-Powered Workflow
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-primary leading-tight">
              Create Accurate BOQs <span className="text-accent">in Minutes</span>, Not Days.
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
              The professional construction Estimating & Bill of Quantities tool powered by Generative AI. 
              Built for quantity surveyors, contractors, and project managers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/builder">
                <Button size="lg" className="boq-accent-gradient text-white h-14 px-8 text-lg font-semibold rounded-xl w-full sm:w-auto">
                  Start Building Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold rounded-xl border-2 w-full sm:w-auto">
                Watch Demo
              </Button>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> No credit card
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Unlimited items
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Export to Excel
              </div>
            </div>
          </div>
          
          <div className="relative animate-fade-in-up">
            <div className="absolute -inset-4 bg-accent/20 blur-3xl rounded-full -z-10" />
            <div className="bg-white rounded-2xl shadow-2xl border p-2 transform rotate-2">
               <div className="bg-slate-50 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center">
                  <img 
                    src="https://picsum.photos/seed/boq/800/600" 
                    alt="BOQ Builder Interface" 
                    className="w-full h-full object-cover opacity-80"
                    data-ai-hint="construction dashboard"
                  />
               </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border flex items-center gap-4 animate-bounce">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <Calculator className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Estimate</p>
                <p className="font-bold text-primary">$1,240,500.00</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl font-bold text-primary">Everything You Need for Precise Estimation</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional features designed to streamline the BOQ creation process while maintaining maximum accuracy.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Sparkles className="h-6 w-6" />}
              title="AI Item Suggestions"
              description="Simply type your project name and specifications, and our AI will suggest relevant items and categories automatically."
            />
            <FeatureCard 
              icon={<LayoutTemplate className="h-6 w-6" />}
              title="Template Library"
              description="Import common BOQ structures from our library or upload your own Excel/CSV templates to start fast."
            />
            <FeatureCard 
              icon={<Calculator className="h-6 w-6" />}
              title="Auto-Calculations"
              description="Smart formulas handle quantity/rate multiplications and section summaries in real-time as you type."
            />
            <FeatureCard 
              icon={<Download className="h-6 w-6" />}
              title="One-Click Export"
              description="Generate professional PDF reports or structured Excel files ready for client presentation or tender submission."
            />
            <FeatureCard 
              icon={<ShieldCheck className="h-6 w-6" />}
              title="Audit Trails"
              description="Keep track of every change with automatic version history and collaborative editing logs."
            />
            <FeatureCard 
              icon={<FileText className="h-6 w-6" />}
              title="Document Control"
              description="Manage project specifics, cover pages, and terms directly within the builder interface."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-accent opacity-10 blur-[120px] rounded-full translate-x-1/2" />
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          <h2 className="text-4xl font-bold">Ready to streamline your workflow?</h2>
          <p className="text-primary-foreground/80 text-lg">
            Join thousands of professionals who have ditched manual spreadsheets for the efficiency of BOQ Builder.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/builder">
              <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-bold">
                Build My First BOQ
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold border-white text-white hover:bg-white/10">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-primary rounded flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-primary">BOQ Builder</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary">Terms</a>
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Support</a>
            <a href="#" className="hover:text-primary">Contact</a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 BOQ Builder. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-shadow group">
      <div className="h-12 w-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:boq-accent-gradient group-hover:text-white transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-primary">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}