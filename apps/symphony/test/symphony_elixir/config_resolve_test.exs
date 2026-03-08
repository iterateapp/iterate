defmodule SymphonyElixir.ConfigResolveTest do
  use SymphonyElixir.TestSupport

  alias SymphonyElixir.ProjectConfig

  test "Config.resolve/1 builds ProjectConfig from workflow map" do
    workflow_map = %{
      "tracker" => %{
        "kind" => "linear",
        "api_key" => "tok_abc",
        "project_slug" => "my-project",
        "active_states" => ["Todo", "In Progress"],
        "terminal_states" => ["Done"]
      },
      "polling" => %{"interval_ms" => 15_000},
      "agent" => %{"max_concurrent_agents" => 3, "max_turns" => 5},
      "codex" => %{"command" => "codex app-server"}
    }

    assert %ProjectConfig{} = config = Config.resolve(workflow_map)
    assert config.tracker_kind == "linear"
    assert config.linear_api_token == "tok_abc"
    assert config.linear_project_slug == "my-project"
    assert config.poll_interval_ms == 15_000
    assert config.max_concurrent_agents == 3
    assert config.agent_max_turns == 5
    assert config.codex_command == "codex app-server"
  end

  test "Config.resolve_from_workflow/1 works with loaded workflow struct" do
    {:ok, workflow} = Workflow.load()

    assert %ProjectConfig{} = config = Config.resolve_from_workflow(workflow)
    assert config.tracker_kind == "linear"
    assert is_binary(config.workspace_root)
  end

  test "Config.resolve/1 applies defaults for missing values" do
    config = Config.resolve(%{})
    assert config.poll_interval_ms == 30_000
    assert config.max_concurrent_agents == 10
    assert config.agent_max_turns == 20
    assert config.codex_command == "codex app-server"
    assert config.linear_active_states == ["Todo", "In Progress"]
  end

  test "Config.resolve/1 resolves codex_approval_policy from config" do
    workflow_map = %{
      "codex" => %{
        "approval_policy" => %{"reject" => %{"sandbox_approval" => true}}
      }
    }

    config = Config.resolve(workflow_map)
    assert config.codex_approval_policy == %{"reject" => %{"sandbox_approval" => true}}
  end

  test "Config.resolve/1 resolves codex_thread_sandbox from config" do
    workflow_map = %{
      "codex" => %{"thread_sandbox" => "unrestricted"}
    }

    config = Config.resolve(workflow_map)
    assert config.codex_thread_sandbox == "unrestricted"
  end

  test "Config.resolve/1 uses defaults for codex_approval_policy when missing" do
    config = Config.resolve(%{})

    assert config.codex_approval_policy == %{
             "reject" => %{"sandbox_approval" => true, "rules" => true, "mcp_elicitations" => true}
           }
  end

  test "Config.resolve/1 uses default thread_sandbox when missing" do
    config = Config.resolve(%{})
    assert config.codex_thread_sandbox == "workspace-write"
  end

  test "Config.resolve/1 sets workspace_root to default when not specified" do
    config = Config.resolve(%{})
    assert is_binary(config.workspace_root)
    assert String.contains?(config.workspace_root, "symphony_workspaces")
  end

  test "Config.resolve/1 populates workspace_hooks" do
    workflow_map = %{
      "hooks" => %{
        "after_create" => "echo hello",
        "timeout_ms" => 90_000
      }
    }

    config = Config.resolve(workflow_map)
    assert config.workspace_hooks.after_create == "echo hello"
    assert config.workspace_hooks.timeout_ms == 90_000
    assert config.workspace_hooks.before_run == nil
  end
end
