// Import dependencies
import "phoenix_html"
import {Socket} from "phoenix"

console.log("Islands interface loaded.  Try running one of the following commands.")
console.log("channel = player1() // start game, autoplay")
console.log("channel = player2() // join game, autoplay")
console.log("channel = player3() // join game, message test")
console.log("channel = player4() // join game")

let socket = new Socket("/socket", {params: {token: window.userToken}})
socket.connect()

const public_interface = {}

public_interface.new_channel = (subtopic, screen_name) =>
  socket.channel("game:" + subtopic, {screen_name: screen_name})

public_interface.join = (channel) =>
  channel.join()
    .receive("ok", response => { console.log("Joined successfully.", response) } )
    .receive("error", response => { console.log("Unable to join.", response) } )

public_interface.leave = (channel) =>
  channel.leave()
    .receive("ok", response => { console.log("Left successfully.", response) } )
    .receive("error", response => { console.log("Unable to leave.", response) } )

public_interface.show_subscribers = (channel) =>
  channel.push("show_subscribers")
    .receive("error", response => { console.log("Unable to show subscribers.", response.message) } )

public_interface.say_hello = (channel, greeting) =>
  channel.push("hello", {"message": greeting})
    .receive("ok", response => { console.log("Hello.", response.message) } )
    .receive("error", response => { console.log("Unable to say hello to the channel.", response.message) } )

public_interface.new_game = (channel) =>
  channel.push("new_game")
    .receive("ok", response => { console.log("New game!", response) } )
    .receive("error", response => { console.log("Unable to start a new game.", response) } )

public_interface.add_player = (channel, player) =>
  channel.push("add_player", player)
    .receive("error", response => { console.log("Unable to add new player: " + player, response) } )

public_interface.position_island = (channel, player, island, row, col) => {
  var params = {"player": player, "island": island, "row": row, "col": col}
  channel.push("position_island", params)
    .receive("ok", response => { console.log("Island positioned", response) } )
    .receive("error", response => { console.log("Unable to position island.", response) } )
}

public_interface.set_islands = (channel, player) =>
  channel.push("set_islands", player)
    .receive("ok", response => { console.log("Here is the board:"); console.dir(response.board) } )
    .receive("error", response => { console.log("Unable to set islands for: " + player, response) } )

public_interface.guess_coordinate = (channel, player, row, col) => {
  var params = {"player": player, "row": row, "col": col}
  channel.push("guess_coordinate", params)
    .receive("error", response => { console.log("Unable to guess a coordinate: " + player, response) } )
}

public_interface.new_player = (subtopic, screen_name) => {
  console.log("Player: " + screen_name + ", Subtopic: " + subtopic)
  let channel = new_channel(subtopic, screen_name)
  channel.on("subscribers", response => { console.log("These players have joined: ", response) } )
  channel.on("said_hello", response => { console.log("Returned Greeting:", response) } )
  channel.on("player_added", response => { console.log("Player added.") } )
  channel.on("player_set_islands", response => { console.log("Player set islands.", response) } )
  channel.on("player_guessed_coordinate", response => { console.log("Player '" + response.player + "' guessed coordinate: ", response.result) } )
  join(channel)
  show_subscribers(channel)
  return channel
}

public_interface.position_all_islands = (channel, screen_name) => {
  position_island(channel, screen_name, "atoll", 1, 1)
  position_island(channel, screen_name, "dot", 1, 5)
  position_island(channel, screen_name, "l_shape", 1, 7)
  position_island(channel, screen_name, "s_shape", 5, 1)
  position_island(channel, screen_name, "square", 5, 5)
  set_islands(channel, screen_name)
}

public_interface.autoguess = (channel, screen_name, my_turn = false) => {
  let guess_index = 100
  let next_guess = () => {
    if (0 < guess_index--) {
      let x = Math.floor(guess_index / 10) + 1
      let y = Math.floor(guess_index % 10) + 1
      console.log("Automatically guessed coordinate: (" + x + ", " + y + ")")
      guess_coordinate(channel, screen_name, x, y)
    }
  }
  let guess_callback = response => {
    if ("win" == response.result.win) {
      console.log("Game over. Player " + response.player + " won.")
      guess_index = 0
    }
    if (response.player != screen_name) {
      next_guess()
    }
  }
  channel.on("player_guessed_coordinate", guess_callback)
  // this is here so that the same closure can be used to conveniently start guessing in turn
  if (my_turn) {
    next_guess()
  }
}

public_interface.player1 = (screen_name = "player1") => {
  let channel = new_player(screen_name, screen_name)
  new_game(channel)
  // player1 waits to take actions until player2 has set islands
  channel.on("player_set_islands", response => {
    if (response.player != screen_name) {
      position_all_islands(channel, screen_name)
      autoguess(channel, screen_name, true)
    }
  } )
  return channel
}

public_interface.player2 = (subtopic = "player1", screen_name = "player2") => {
  let channel = new_player(subtopic, screen_name)
  add_player(channel, screen_name)
  autoguess(channel, screen_name, false)
  position_all_islands(channel, screen_name)
  return channel
}

public_interface.player3 = (subtopic = "player1", screen_name = "player3") => {
  let channel = new_player(subtopic, screen_name)
  say_hello(channel, "World!")
  say_hello(channel, "error")
  add_player(channel, screen_name)
  return channel
}

public_interface.player4 = (subtopic = "player1", screen_name = "player4") => {
  let channel = new_player(subtopic, screen_name)
  add_player(channel, screen_name)
  return channel
}

// exposes functions to browser console
// also allows unmodified function bodies to work despite being added to an object
Object.keys(public_interface).forEach(key => window[key] = public_interface[key])

module.exports = public_interface

