import { useState, useCallback } from "react";
import { Link } from "wouter";
import { Lock, Eye, EyeOff, Check, AlertTriangle, Copy, Lightbulb, Shield, Sparkles, ChevronDown, ChevronUp, RefreshCw, Loader2, Key, Zap, BarChart3, Search } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PasswordEvaluationResponse, PasswordFactor, PasswordSuggestion, StrengthLabel, RiskLevel } from "@shared/schema";
import { strengthConfig } from "@shared/schema";

function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Lock className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight" data-testid="text-app-title">
                Passwordr
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                AI-Powered Password Strength Estimator
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

interface StrengthMeterProps {
  score: number;
  label: StrengthLabel;
  isLoading?: boolean;
  entropy?: number;
}

function StrengthMeter({ score, label, isLoading, entropy }: StrengthMeterProps) {
  const config = strengthConfig[label];
  
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <motion.span 
            key={score}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-5xl md:text-6xl font-bold tabular-nums ${config.color}`}
            data-testid="text-strength-score"
          >
            {isLoading ? "--" : score}
          </motion.span>
          <span className="text-muted-foreground text-lg">/100</span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Badge 
              variant="outline" 
              className={`text-base md:text-lg font-semibold px-3 py-1 ${config.color} border-current`}
              data-testid="badge-strength-label"
            >
              {config.label}
            </Badge>
          </motion.div>
          {entropy !== undefined && (
            <span className="text-xs text-muted-foreground" data-testid="text-entropy">
              {entropy.toFixed(1)} bits entropy
            </span>
          )}
        </div>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${config.bgColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          data-testid="progress-strength-bar"
        />
      </div>
    </div>
  );
}

interface FactorItemProps {
  factor: PasswordFactor;
}

function FactorItem({ factor }: FactorItemProps) {
  const isPositive = factor.type === "positive";
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3"
    >
      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        isPositive ? "bg-strength-strong/20 text-strength-strong" : "bg-strength-very-weak/20 text-strength-very-weak"
      }`}>
        {isPositive ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      </div>
      <span className="text-sm text-muted-foreground">{factor.message}</span>
    </motion.div>
  );
}

interface FactorAnalysisPanelProps {
  factors: PasswordFactor[];
}

function FactorAnalysisPanel({ factors }: FactorAnalysisPanelProps) {
  const positiveFactors = factors.filter(f => f.type === "positive");
  const negativeFactors = factors.filter(f => f.type === "negative");
  
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {positiveFactors.length > 0 && (
        <div className="space-y-3 p-4 rounded-lg bg-strength-strong/5 border border-strength-strong/20">
          <h4 className="font-medium text-sm text-strength-strong flex items-center gap-2">
            <Check className="h-4 w-4" />
            Strengths
          </h4>
          <div className="space-y-2" data-testid="list-positive-factors">
            {positiveFactors.map((factor, idx) => (
              <FactorItem key={idx} factor={factor} />
            ))}
          </div>
        </div>
      )}
      {negativeFactors.length > 0 && (
        <div className="space-y-3 p-4 rounded-lg bg-strength-very-weak/5 border border-strength-very-weak/20">
          <h4 className="font-medium text-sm text-strength-very-weak flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Weaknesses
          </h4>
          <div className="space-y-2" data-testid="list-negative-factors">
            {negativeFactors.map((factor, idx) => (
              <FactorItem key={idx} factor={factor} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: PasswordSuggestion;
}

function SuggestionCard({ suggestion }: SuggestionCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button 
          className="w-full flex items-center justify-between gap-4 p-3 rounded-lg border hover-elevate text-left"
          data-testid={`suggestion-trigger-${suggestion.id}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lightbulb className="h-3.5 w-3.5" />
            </div>
            <span className="font-medium text-sm">{suggestion.title}</span>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-12 py-2 text-sm text-muted-foreground" data-testid={`suggestion-content-${suggestion.id}`}>
          {suggestion.description}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface SuggestionsPanelProps {
  suggestions: PasswordSuggestion[];
}

function SuggestionsPanel({ suggestions }: SuggestionsPanelProps) {
  if (suggestions.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-base flex items-center gap-2">
        <Lightbulb className="h-4 w-4" />
        Suggestions to Improve
      </h3>
      <div className="space-y-2" data-testid="list-suggestions">
        {suggestions.map(suggestion => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} />
        ))}
      </div>
    </div>
  );
}

interface ExamplePasswordProps {
  password: string;
  entropy?: number;
  index: number;
}

function ExamplePassword({ password, entropy, index }: ExamplePasswordProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast({ title: "Copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  }, [password, toast]);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center justify-between gap-4 rounded-md border p-3 bg-muted/30"
      data-testid={`example-password-${index}`}
    >
      <div className="flex-1 min-w-0">
        <code className="font-mono text-sm break-all">{password}</code>
        {entropy !== undefined && (
          <div className="text-xs text-muted-foreground mt-1">
            {entropy.toFixed(0)} bits entropy
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        data-testid={`button-copy-example-${index}`}
        aria-label="Copy password"
      >
        {copied ? <Check className="h-4 w-4 text-strength-strong" /> : <Copy className="h-4 w-4" />}
      </Button>
    </motion.div>
  );
}

type GenerationType = "password" | "passphrase";

interface ExampleGeneratorProps {
  password: string;
}

function ExampleGenerator({ password }: ExampleGeneratorProps) {
  const [examples, setExamples] = useState<{ password: string; entropy?: number }[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [generationType, setGenerationType] = useState<GenerationType>("password");
  const { toast } = useToast();
  
  const generateMutation = useMutation({
    mutationFn: async (type: GenerationType) => {
      const res = await apiRequest("POST", "/api/examples", { password, count: 3, type });
      return res.json() as Promise<{ examples: { password: string; entropy?: number }[] }>;
    },
    onSuccess: (data) => {
      setExamples(data.examples);
      setIsVisible(true);
    },
    onError: () => {
      toast({ title: "Failed to generate examples", variant: "destructive" });
    },
  });
  
  const handleGenerate = (type: GenerationType) => {
    setGenerationType(type);
    generateMutation.mutate(type);
  };
  
  const handleToggleVisibility = () => {
    if (isVisible) {
      setIsVisible(false);
    } else {
      generateMutation.mutate(generationType);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={generationType === "password" && isVisible ? "default" : "outline"}
          onClick={() => handleGenerate("password")}
          disabled={generateMutation.isPending || !password}
          className="flex-1 gap-2"
          data-testid="button-generate-passwords"
        >
          {generateMutation.isPending && generationType === "password" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Key className="h-4 w-4" />
          )}
          Strong Passwords
        </Button>
        <Button
          variant={generationType === "passphrase" && isVisible ? "default" : "outline"}
          onClick={() => handleGenerate("passphrase")}
          disabled={generateMutation.isPending || !password}
          className="flex-1 gap-2"
          data-testid="button-generate-passphrases"
        >
          {generateMutation.isPending && generationType === "passphrase" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          Passphrases
        </Button>
      </div>
      
      <AnimatePresence>
        {isVisible && examples.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
            data-testid="list-example-passwords"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                {generationType === "passphrase" ? "Memorable Passphrases" : "Strong Passwords"}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => generateMutation.mutate(generationType)}
                disabled={generateMutation.isPending}
                className="gap-2"
                data-testid="button-regenerate-examples"
              >
                <RefreshCw className={`h-4 w-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
            {examples.map((example, idx) => (
              <ExamplePassword key={idx} password={example.password} entropy={example.entropy} index={idx} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const RISK_LEVEL_INFO: Record<RiskLevel, { label: string; description: string }> = {
  LOW: { label: "Low Risk", description: "Personal accounts, forums" },
  MEDIUM: { label: "Medium Risk", description: "Email, social media" },
  HIGH: { label: "High Risk", description: "Banking, healthcare" },
};

interface PasswordInputWidgetProps {
  password: string;
  onPasswordChange: (password: string) => void;
  evaluation: PasswordEvaluationResponse | null;
  isLoading: boolean;
  riskLevel: RiskLevel;
  onRiskLevelChange: (level: RiskLevel) => void;
  onEvaluate: () => void;
}

function PasswordInputWidget({ password, onPasswordChange, evaluation, isLoading, riskLevel, onRiskLevelChange, onEvaluate }: PasswordInputWidgetProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  const hasPassword = password.length > 0;
  const hasEvaluation = evaluation !== null;
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && hasPassword && !isLoading) {
      onEvaluate();
    }
  };
  
  return (
    <Card className="p-6 md:p-8 shadow-lg space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl md:text-2xl font-semibold">Check Your Password</h2>
        <Badge variant="secondary" className="gap-1.5 text-xs">
          <Shield className="h-3 w-3" />
          No storage
        </Badge>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="risk-level" className="text-sm font-medium">Account Sensitivity</Label>
          <Select value={riskLevel} onValueChange={(v) => onRiskLevelChange(v as RiskLevel)}>
            <SelectTrigger id="risk-level" data-testid="select-risk-level">
              <SelectValue placeholder="Select risk level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW" data-testid="option-risk-low">
                <div className="flex flex-col items-start">
                  <span>{RISK_LEVEL_INFO.LOW.label}</span>
                </div>
              </SelectItem>
              <SelectItem value="MEDIUM" data-testid="option-risk-medium">
                <div className="flex flex-col items-start">
                  <span>{RISK_LEVEL_INFO.MEDIUM.label}</span>
                </div>
              </SelectItem>
              <SelectItem value="HIGH" data-testid="option-risk-high">
                <div className="flex flex-col items-start">
                  <span>{RISK_LEVEL_INFO.HIGH.label}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{RISK_LEVEL_INFO[riskLevel].description}</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password-input" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Input
              id="password-input"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password..."
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-10 pr-10"
              data-testid="input-password"
              aria-label="Password input"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-10 w-10"
              onClick={() => setShowPassword(!showPassword)}
              data-testid="button-toggle-password-visibility"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
      
      <Button
        onClick={onEvaluate}
        disabled={!hasPassword || isLoading}
        className="w-full gap-2"
        size="lg"
        data-testid="button-check-password"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
        {isLoading ? "Checking..." : "Check Password Strength"}
      </Button>
      
      <AnimatePresence>
        {hasEvaluation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <StrengthMeter 
              score={evaluation.score} 
              label={evaluation.label}
              isLoading={false}
              entropy={evaluation.entropy}
            />
            
            {evaluation.factors.length > 0 && (
              <FactorAnalysisPanel factors={evaluation.factors} />
            )}
            
            <SuggestionsPanel suggestions={evaluation.suggestions} />
            
            {hasPassword && <ExampleGenerator password={password} />}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function InfoCard({ icon, title, description }: InfoCardProps) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </Card>
  );
}

function EducationalSection() {
  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-3">
          <InfoCard
            icon={<Sparkles className="h-5 w-5" />}
            title="How It Works"
            description="Our AI analyzes your password against known attack patterns, dictionary words, and leaked password databases to estimate real-world cracking difficulty."
          />
          <InfoCard
            icon={<Shield className="h-5 w-5" />}
            title="Privacy Promise"
            description="Your passwords are never stored or logged. All analysis happens in-memory and is immediately discarded after processing."
          />
          <InfoCard
            icon={<Lightbulb className="h-5 w-5" />}
            title="Best Practices"
            description="Use passphrases with 4+ random words, avoid personal information, and never reuse passwords across different accounts."
          />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-muted-foreground">
          No passwords stored. All processing happens securely in-memory.
        </p>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm flex-wrap">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-about">
            About
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-privacy">
            Privacy Policy
          </a>
          <Link href="/analytics" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1" data-testid="link-analytics">
            <BarChart3 className="h-3 w-3" />
            Analytics
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const [password, setPassword] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("MEDIUM");
  const [evaluation, setEvaluation] = useState<PasswordEvaluationResponse | null>(null);
  
  const evaluateMutation = useMutation({
    mutationFn: async ({ pwd, risk }: { pwd: string; risk: RiskLevel }) => {
      const res = await apiRequest("POST", "/api/evaluate", { password: pwd, riskLevel: risk });
      return res.json() as Promise<PasswordEvaluationResponse>;
    },
    onSuccess: (data) => {
      setEvaluation(data);
    },
  });
  
  const handleEvaluate = useCallback(() => {
    if (password.length > 0) {
      evaluateMutation.mutate({ pwd: password, risk: riskLevel });
    }
  }, [password, riskLevel, evaluateMutation]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <PasswordInputWidget
            password={password}
            onPasswordChange={setPassword}
            evaluation={evaluation}
            isLoading={evaluateMutation.isPending}
            riskLevel={riskLevel}
            onRiskLevelChange={setRiskLevel}
            onEvaluate={handleEvaluate}
          />
        </div>
      </main>
      
      <EducationalSection />
      <Footer />
    </div>
  );
}
