import type { CodexTask, CodexTaskResult } from "../types"

const CODEX_API_BASE = "https://api.openai.com/v1/codex"

/**
 * OpenAI Codex integration for autonomous code generation.
 * Submits tasks that generate PRs against a target repository.
 */
export function createCodexProvider(apiKey?: string) {
  const key = apiKey ?? process.env.OPENAI_API_KEY

  async function submitTask(task: CodexTask): Promise<CodexTaskResult> {
    const response = await fetch(`${CODEX_API_BASE}/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: task.prompt,
        repo_url: task.repoUrl,
        branch: task.branch ?? "main",
        sandbox: task.sandboxConfig
          ? {
              install_command: task.sandboxConfig.install,
              lint_command: task.sandboxConfig.lint,
              test_command: task.sandboxConfig.test,
            }
          : undefined,
      }),
    })

    if (!response.ok) {
      throw new Error(
        `Codex API error: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()

    return {
      taskId: data.id,
      status: data.status,
      pullRequestUrl: data.pull_request_url,
      output: data.output,
    }
  }

  async function getTaskStatus(taskId: string): Promise<CodexTaskResult> {
    const response = await fetch(`${CODEX_API_BASE}/tasks/${taskId}`, {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    })

    if (!response.ok) {
      throw new Error(
        `Codex API error: ${response.status} ${response.statusText}`
      )
    }

    const data = await response.json()

    return {
      taskId: data.id,
      status: data.status,
      pullRequestUrl: data.pull_request_url,
      output: data.output,
    }
  }

  async function pollUntilComplete(
    taskId: string,
    intervalMs = 5000,
    maxAttempts = 120
  ): Promise<CodexTaskResult> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await getTaskStatus(taskId)
      if (result.status === "completed" || result.status === "failed") {
        return result
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
    throw new Error(`Codex task ${taskId} timed out after ${maxAttempts} polls`)
  }

  return {
    submitTask,
    getTaskStatus,
    pollUntilComplete,
  }
}

export type CodexProvider = ReturnType<typeof createCodexProvider>
