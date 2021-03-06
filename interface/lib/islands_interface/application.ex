defmodule IslandsInterface.Application do
  use Application

  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  def start(_type, _args) do
    import Supervisor.Spec

    # make sure that the island type atoms exisit before the application is started
    IslandsEngine.Island.types()

    # Define workers and child supervisors to be supervised
    children = [
      # Start the endpoint when the application starts
      supervisor(IslandsInterfaceWeb.Endpoint, []),
      supervisor(IslandsInterfaceWeb.Presence, []),
      # Start your own worker by calling: IslandsInterface.Worker.start_link(arg1, arg2, arg3)
      # worker(IslandsInterface.Worker, [arg1, arg2, arg3]),
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: IslandsInterface.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  def config_change(changed, _new, removed) do
    IslandsInterfaceWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
