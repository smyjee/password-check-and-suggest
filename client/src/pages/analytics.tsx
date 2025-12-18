import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, Calendar, Lock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AnalyticsSummary, StrengthLabel } from "@shared/schema";
import { strengthConfig } from "@shared/schema";

function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight" data-testid="text-analytics-title">
                Analytics Dashboard
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Password Strength Metrics
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

interface DistributionBarProps {
  label: StrengthLabel;
  count: number;
  percentage: number;
}

function DistributionBar({ label, count, percentage }: DistributionBarProps) {
  const config = strengthConfig[label];
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${config.color} border-current text-xs`}>
            {config.label}
          </Badge>
          <span className="text-sm text-muted-foreground">{count} evaluations</span>
        </div>
        <span className="text-sm font-medium tabular-nums">{percentage.toFixed(1)}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <Card className="text-center py-16">
        <CardContent className="space-y-4">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Data Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start checking passwords to see analytics here. All data is anonymized and only tracks score distributions.
          </p>
          <Link href="/">
            <Button data-testid="button-check-password">
              Check a Password
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Analytics() {
  const { data, isLoading, error } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics"],
    refetchInterval: 30000,
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <LoadingState />
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <EmptyState />
      </div>
    );
  }
  
  if (data.totalEvaluations === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <EmptyState />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-5xl space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Evaluations"
              value={data.totalEvaluations.toLocaleString()}
              description="All-time password checks"
              icon={<Users className="h-4 w-4" />}
            />
            <StatCard
              title="Average Score"
              value={data.averageScore.toFixed(1)}
              description="Out of 100 points"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatCard
              title="Today"
              value={data.evaluationsToday.toLocaleString()}
              description="Evaluations today"
              icon={<Calendar className="h-4 w-4" />}
            />
            <StatCard
              title="This Week"
              value={data.evaluationsThisWeek.toLocaleString()}
              description="Evaluations this week"
              icon={<BarChart3 className="h-4 w-4" />}
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>
                Breakdown of password strength across all evaluations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {data.scoreDistribution.map(dist => (
                <DistributionBar
                  key={dist.label}
                  label={dist.label}
                  count={dist.count}
                  percentage={dist.percentage}
                />
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Privacy Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This dashboard shows anonymized aggregate data only. Individual passwords are never stored, 
                logged, or transmitted beyond the evaluation request. Only statistical data like score 
                distributions and password lengths are recorded for analytics purposes.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
