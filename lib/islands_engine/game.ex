defmodule IslandsEngine.Game do
  use GenServer

  def init(args) do
    {:ok, args}
  end

  def demo_call(game) do
    GenServer.call(game, :demo_call)
  end

  def demo_cast(game, new_value) do
    GenServer.cast(game, {:demo_cast, new_value})
  end

  def handle_call(:demo_call, _from, state) do
    {:reply, state, state}
  end

  def handle_cast({:demo_cast, new_value}, state) do
    {:noreply, Map.put(state, :test, new_value)}
  end

  def handle_info(:first, state) do
    IO.puts "This message has been handled by handle_info/2, matching :first."
    {:noreply, state}
  end
end

