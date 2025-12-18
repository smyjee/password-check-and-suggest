import { useState, useCallback, useEffect } from "react";
import { Lock, Eye, EyeOff, Check, AlertTriangle, Copy, Lightbulb, Shield, Sparkles, ChevronDown, ChevronUp, RefreshCw, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PasswordEvaluationResponse, PasswordFactor, PasswordSuggestion, StrengthLabel } from "@shared/schema";
import { strengthConfig } from "@shared/schema";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

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
}

function StrengthMeter({ score, label, isLoading }: StrengthMeterProps) {
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
      <span className={`text-sm ${isPositive ? "text-foreground" : "text-muted-foreground"}`}>
        {factor.message}
      </span>
    </motion.div>
  );
}

interface FactorAnalysisPanelProps {
  factors: PasswordFactor[];
}

function FactorAnalysisPanel({ factors }: FactorAnalysisPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const positiveFactors = factors.filter(f => f.type === "positive");
  const negativeFactors = factors.filter(f => f.type === "negative");
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between px-0 font-medium text-sm uppercase tracking-wide"
          data-testid="button-toggle-factors"
        >
          <span>Analysis Details</span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-4">
        {negativeFactors.length > 0 && (
          <div className="space-y-3" data-testid="list-negative-factors">
            {negativeFactors.map((factor, idx) => (
              <FactorItem key={`neg-${idx}`} factor={factor} />
            ))}
          </div>
        )}
        {positiveFactors.length > 0 && (
          <div className="space-y-3" data-testid="list-positive-factors">
            {positiveFactors.map((factor, idx) => (
              <FactorItem key={`pos-${idx}`} factor={factor} />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface SuggestionCardProps {
  suggestion: PasswordSuggestion;
  index: number;
}

function SuggestionCard({ suggestion, index }: SuggestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex gap-4 rounded-lg border p-4"
      data-testid={`card-suggestion-${suggestion.id}`}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
        {index + 1}
      </div>
      <div className="space-y-1">
        <p className="font-medium text-sm">{suggestion.title}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{suggestion.description}</p>
      </div>
    </motion.div>
  );
}

interface SuggestionsPanelProps {
  suggestions: PasswordSuggestion[];
}

function SuggestionsPanel({ suggestions }: SuggestionsPanelProps) {
  if (suggestions.length === 0) return null;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-strength-moderate" />
        <h3 className="font-medium text-sm uppercase tracking-wide">Improvement Suggestions</h3>
      </div>
      <div className="space-y-3" data-testid="list-suggestions">
        {suggestions.map((suggestion, idx) => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} index={idx} />
        ))}
      </div>
    </div>
  );
}

interface ExamplePasswordProps {
  password: string;
  index: number;
}

function ExamplePassword({ password, index }: ExamplePasswordProps) {
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
      <code className="font-mono text-sm break-all">{password}</code>
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

interface ExampleGeneratorProps {
  password: string;
}

function ExampleGenerator({ password }: ExampleGeneratorProps) {
  const [examples, setExamples] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();
  
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/examples", { password, count: 3 });
      return res.json() as Promise<{ examples: string[] }>;
    },
    onSuccess: (data) => {
      setExamples(data.examples);
      setIsVisible(true);
    },
    onError: () => {
      toast({ title: "Failed to generate examples", variant: "destructive" });
    },
  });
  
  const handleGenerate = () => {
    if (isVisible) {
      setIsVisible(false);
    } else {
      generateMutation.mutate();
    }
  };
  
  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        onClick={handleGenerate}
        disabled={generateMutation.isPending || !password}
        className="w-full gap-2"
        data-testid="button-generate-examples"
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : isVisible ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Hide Examples
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Show Stronger Password Examples
          </>
        )}
      </Button>
      
      <AnimatePresence>
        {isVisible && examples.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
            data-testid="list-example-passwords"
          >
            {examples.map((example, idx) => (
              <ExamplePassword key={idx} password={example} index={idx} />
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="gap-2"
              data-testid="button-regenerate-examples"
            >
              <RefreshCw className={`h-4 w-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
              Generate New
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PasswordInputWidgetProps {
  password: string;
  onPasswordChange: (password: string) => void;
  evaluation: PasswordEvaluationResponse | null;
  isLoading: boolean;
}

function PasswordInputWidget({ password, onPasswordChange, evaluation, isLoading }: PasswordInputWidgetProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  const defaultEvaluation: PasswordEvaluationResponse = {
    score: 0,
    label: "VERY_WEAK",
    factors: [],
    suggestions: [],
  };
  
  const currentEvaluation = evaluation || defaultEvaluation;
  const hasPassword = password.length > 0;
  
  return (
    <Card className="p-6 md:p-8 shadow-lg space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl md:text-2xl font-semibold">Check Your Password</h2>
        <Badge variant="secondary" className="gap-1.5 text-xs">
          <Shield className="h-3 w-3" />
          No storage
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password..."
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="h-14 md:h-16 text-lg pr-12"
            data-testid="input-password"
            aria-label="Password input"
            autoComplete="off"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={() => setShowPassword(!showPassword)}
            data-testid="button-toggle-password-visibility"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {(hasPassword || isLoading) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <StrengthMeter 
            score={currentEvaluation.score} 
            label={currentEvaluation.label}
            isLoading={isLoading && !evaluation}
          />
          
          {currentEvaluation.factors.length > 0 && (
            <FactorAnalysisPanel factors={currentEvaluation.factors} />
          )}
          
          <SuggestionsPanel suggestions={currentEvaluation.suggestions} />
          
          {hasPassword && <ExampleGenerator password={password} />}
        </motion.div>
      )}
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
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-about">
            About
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-privacy">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const [password, setPassword] = useState("");
  const [evaluation, setEvaluation] = useState<PasswordEvaluationResponse | null>(null);
  const debouncedPassword = useDebounce(password, 300);
  
  const evaluateMutation = useMutation({
    mutationFn: async (pwd: string) => {
      const res = await apiRequest("POST", "/api/evaluate", { password: pwd });
      return res.json() as Promise<PasswordEvaluationResponse>;
    },
    onSuccess: (data) => {
      setEvaluation(data);
    },
  });
  
  useEffect(() => {
    if (debouncedPassword.length > 0) {
      evaluateMutation.mutate(debouncedPassword);
    } else {
      setEvaluation(null);
    }
  }, [debouncedPassword]);
  
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
          />
        </div>
      </main>
      
      <EducationalSection />
      <Footer />
    </div>
  );
}
