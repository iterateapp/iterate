import { AppShell } from "@/components/app-shell";
import { getThreads, getIterationSteps, getGitHubData } from "@/lib/queries";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [threads, iterationSteps, githubData] = await Promise.all([
    getThreads(),
    getIterationSteps(),
    getGitHubData(),
  ]);

  return (
    <AppShell
      initialThreads={threads}
      iterationSteps={iterationSteps}
      repoInfo={githubData.repoInfo}
    >
      {children}
    </AppShell>
  );
}
