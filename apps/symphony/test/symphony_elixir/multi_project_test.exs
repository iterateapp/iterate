defmodule SymphonyElixir.MultiProjectTest do
  use SymphonyElixir.TestSupport

  alias SymphonyElixir.{CLI, Config, MultiOrchestrator, Orchestrator, ProjectConfig, StatusDashboard, Workspace, WorkflowStore}

  describe "ProjectConfig threading" do
    test "Workspace.create_for_issue/2 uses project_config workspace_root" do
      custom_root = Path.join(System.tmp_dir!(), "custom_ws_#{System.unique_integer()}")
      File.mkdir_p!(custom_root)

      config = %ProjectConfig{
        workspace_root: custom_root,
        workspace_hooks: %{after_create: nil, before_run: nil, after_run: nil, before_remove: nil, timeout_ms: 60_000}
      }

      issue = %SymphonyElixir.Linear.Issue{
        id: "test-1",
        identifier: "TST-001",
        title: "Test",
        state: "Todo"
      }

      assert {:ok, workspace_path} = Workspace.create_for_issue(issue, project_config: config)
      assert String.starts_with?(workspace_path, custom_root)

      on_exit(fn -> File.rm_rf(custom_root) end)
    end

    test "Config.resolve/1 produces independent configs for two projects" do
      config_a = Config.resolve(%{
        "tracker" => %{"kind" => "linear", "api_key" => "tok_a", "project_slug" => "proj-a"},
        "agent" => %{"max_concurrent_agents" => 2}
      })
      config_b = Config.resolve(%{
        "tracker" => %{"kind" => "linear", "api_key" => "tok_b", "project_slug" => "proj-b"},
        "agent" => %{"max_concurrent_agents" => 5}
      })

      assert config_a.linear_project_slug == "proj-a"
      assert config_b.linear_project_slug == "proj-b"
      assert config_a.max_concurrent_agents == 2
      assert config_b.max_concurrent_agents == 5
    end
  end

  describe "Orchestrator per-project config" do
    test "Orchestrator stores project_config in state" do
      name = :"test_orch_#{System.unique_integer([:positive])}"
      {:ok, orch} = Orchestrator.start_link(name: name, workflow_store_name: WorkflowStore)

      assert Process.alive?(orch)

      on_exit(fn ->
        if Process.alive?(orch), do: GenServer.stop(orch)
      end)
    end
  end

  describe "MultiOrchestrator" do
    test "add_project starts WorkflowStore and Orchestrator for a project" do
      workflow_path = Workflow.workflow_file_path()
      sup_name = :"test_multi_orch_#{System.unique_integer([:positive])}"

      {:ok, sup} = MultiOrchestrator.start_link(name: sup_name)

      on_exit(fn ->
        if is_pid(sup) and Process.alive?(sup), do: catch_exit(DynamicSupervisor.stop(sup))
      end)

      assert :ok = MultiOrchestrator.add_project(sup, workflow_path)

      projects = MultiOrchestrator.list_projects(sup)
      assert length(projects) == 1
      assert Enum.all?(projects, & &1.alive)
    end

    test "add_project is idempotent" do
      workflow_path = Workflow.workflow_file_path()
      sup_name = :"test_multi_idem_#{System.unique_integer([:positive])}"

      {:ok, sup} = MultiOrchestrator.start_link(name: sup_name)

      on_exit(fn ->
        if is_pid(sup) and Process.alive?(sup), do: catch_exit(DynamicSupervisor.stop(sup))
      end)

      assert :ok = MultiOrchestrator.add_project(sup, workflow_path)
      assert :ok = MultiOrchestrator.add_project(sup, workflow_path)

      projects = MultiOrchestrator.list_projects(sup)
      assert length(projects) == 1
    end

    test "add_project returns error for missing file" do
      sup_name = :"test_multi_missing_#{System.unique_integer([:positive])}"
      {:ok, sup} = MultiOrchestrator.start_link(name: sup_name)

      on_exit(fn ->
        if is_pid(sup) and Process.alive?(sup), do: catch_exit(DynamicSupervisor.stop(sup))
      end)

      assert {:error, {:workflow_file_not_found, _}} =
               MultiOrchestrator.add_project(sup, "/nonexistent/WORKFLOW.md")
    end

    test "two projects run independently with separate configs" do
      tmp = System.tmp_dir!()
      path_a = Path.join(tmp, "workflow_a_#{System.unique_integer()}.md")
      path_b = Path.join(tmp, "workflow_b_#{System.unique_integer()}.md")

      write_workflow_file!(path_a,
        tracker_project_slug: "project-a",
        poll_interval_ms: 60_000,
        max_concurrent_agents: 2
      )
      write_workflow_file!(path_b,
        tracker_project_slug: "project-b",
        poll_interval_ms: 30_000,
        max_concurrent_agents: 5
      )

      sup_name = :"test_integration_#{System.unique_integer([:positive])}"
      {:ok, sup} = MultiOrchestrator.start_link(name: sup_name)

      :ok = MultiOrchestrator.add_project(sup, path_a)
      :ok = MultiOrchestrator.add_project(sup, path_b)

      Process.sleep(100)

      projects = MultiOrchestrator.list_projects(sup)
      assert length(projects) == 2
      assert Enum.all?(projects, & &1.alive)

      on_exit(fn ->
        File.rm(path_a)
        File.rm(path_b)
        if is_pid(sup) and Process.alive?(sup), do: catch_exit(DynamicSupervisor.stop(sup))
      end)
    end
  end

  describe "StatusDashboard multi-project aggregation" do
    setup do
      SymphonyElixir.StatusDashboard.reset()
      :ok
    end

    test "StatusDashboard aggregates snapshots from multiple project IDs" do
      # Simulate updates from two projects
      StatusDashboard.update(%{
        project_id: "project_a",
        running: [%{issue_identifier: "A-1", session_id: "s1", turn_count: 1, tokens: %{total: 100}, started_at: DateTime.utc_now(), last_event: nil, last_message: nil}],
        retrying: [],
        codex_totals: %{input_tokens: 50, output_tokens: 50, total_tokens: 100, seconds_running: 10},
        codex_rate_limits: nil
      })
      StatusDashboard.update(%{
        project_id: "project_b",
        running: [%{issue_identifier: "B-1", session_id: "s2", turn_count: 2, tokens: %{total: 200}, started_at: DateTime.utc_now(), last_event: nil, last_message: nil}],
        retrying: [],
        codex_totals: %{input_tokens: 100, output_tokens: 100, total_tokens: 200, seconds_running: 20},
        codex_rate_limits: nil
      })

      # snapshot/0 should return aggregated view
      snapshot = StatusDashboard.snapshot()
      assert snapshot != nil
      running_identifiers = Enum.map(snapshot.running, & &1.issue_identifier)
      assert "A-1" in running_identifiers
      assert "B-1" in running_identifiers
    end

    test "snapshot/0 returns nil when no snapshots have been stored" do
      assert StatusDashboard.snapshot() == nil
    end

    test "StatusDashboard.update/1 is idempotent for same project_id" do
      StatusDashboard.update(%{
        project_id: "project_idempotent",
        running: [%{issue_identifier: "X-1", session_id: "s1", turn_count: 1, tokens: %{total: 50}, started_at: DateTime.utc_now(), last_event: nil, last_message: nil}],
        retrying: [],
        codex_totals: %{input_tokens: 25, output_tokens: 25, total_tokens: 50, seconds_running: 5},
        codex_rate_limits: nil
      })
      StatusDashboard.update(%{
        project_id: "project_idempotent",
        running: [%{issue_identifier: "X-2", session_id: "s2", turn_count: 3, tokens: %{total: 150}, started_at: DateTime.utc_now(), last_event: nil, last_message: nil}],
        retrying: [],
        codex_totals: %{input_tokens: 75, output_tokens: 75, total_tokens: 150, seconds_running: 15},
        codex_rate_limits: nil
      })

      snapshot = StatusDashboard.snapshot()
      assert snapshot != nil
      running_identifiers = Enum.map(snapshot.running, & &1.issue_identifier)
      # Second update replaces first for same project_id
      assert "X-2" in running_identifiers
      refute "X-1" in running_identifiers
    end
  end

  describe "CLI multi-path support" do
    test "run/2 accepts list of workflow paths" do
      workflow_path = Workflow.workflow_file_path()

      deps = %{
        file_regular?: fn path -> path == workflow_path end,
        set_workflow_file_path: fn _path -> :ok end,
        set_logs_root: fn _path -> :ok end,
        set_server_port_override: fn _port -> :ok end,
        ensure_all_started: fn -> {:ok, []} end,
        add_project: fn _path -> :ok end
      }

      assert :ok = CLI.run([workflow_path], deps)
    end

    test "evaluate/2 routes multi-path args to run/2 as list" do
      workflow_path = Workflow.workflow_file_path()

      {:ok, calls} = Agent.start_link(fn -> [] end)

      deps = %{
        file_regular?: fn _path -> true end,
        set_workflow_file_path: fn path ->
          Agent.update(calls, fn acc -> [{:set, path} | acc] end)
          :ok
        end,
        set_logs_root: fn _path -> :ok end,
        set_server_port_override: fn _port -> :ok end,
        ensure_all_started: fn -> {:ok, []} end,
        add_project: fn path ->
          Agent.update(calls, fn acc -> [{:add, path} | acc] end)
          :ok
        end
      }

      ack_flag = "--i-understand-that-this-will-be-running-without-the-usual-guardrails"
      args = [ack_flag, workflow_path, workflow_path]
      assert :ok = CLI.evaluate(args, deps)

      recorded = Agent.get(calls, & &1)
      # set_workflow_file_path was called with first path
      assert Enum.any?(recorded, fn {k, _v} -> k == :set end)
      # add_project was called for the second path
      assert Enum.any?(recorded, fn {k, _v} -> k == :add end)

      Agent.stop(calls)
    end
  end
end
