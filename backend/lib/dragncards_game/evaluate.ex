defmodule DragnCardsGame.Evaluate do
  @moduledoc """
  Module that defines and evaluates the LISP-like language used to modify the game state.
  """
  require Logger
  alias DragnCardsGame.{GameUI}

  def assert(test_num, evaluated, result) do
    if evaluated != result do
      raise "Failed test #{test_num}. Expected #{result} got #{evaluated}"
    else
      IO.puts("passed test #{test_num}")
    end
  end

  def evaluate(game, code) do
    #IO.inspect(code)
    if is_list(code) && Enum.count(code) > 0 do
      if is_list(Enum.at(code, 0)) do
        #actions = Enum.slice(code, 1, Enum.count(code))
        Enum.reduce(code, game, fn(action, acc) ->
          evaluate(acc, action)
        end)
      else
        # code = Enum.reduce(code, [], fn(code_line, acc) ->
        #   IO.puts("evaluating")
        #   IO.inspect(code_line)
        #   acc ++ [evaluate(game, code_line)]
        # end)

        case Enum.at(code,0) do
          "LOGGER" ->
            statements = Enum.slice(code, 1, Enum.count(code))
            message = Enum.reduce(statements, "", fn(statement, acc) ->
              str_statement = inspect(evaluate(game, statement))
              acc <> String.replace(str_statement,"\"","")
            end)
            IO.inspect(message)
            game
          "DEFINE" ->
            var_name = Enum.at(code, 1)
            value = evaluate(game, Enum.at(code, 2))
            put_in(game, ["variables", var_name], value)
          "LIST" ->
            list = Enum.slice(code, 1, Enum.count(code))
            Enum.reduce(list, [], fn(item,acc)->
              acc ++ [evaluate(game, item)]
            end)
          "NEXT_PLAYER" ->
            current_player_i = evaluate(game, Enum.at(code, 1))
            current_i = String.to_integer(String.slice(current_player_i, -1..-1))
            next_i = current_i + 1
            next_i = if next_i > game["numPlayers"] do 1 else next_i end
            "player" <> Integer.to_string(next_i)
          "GET_INDEX" ->
            list = evaluate(game, Enum.at(code, 1))
            value = evaluate(game, Enum.at(code, 2))
            Enum.find_index(list, fn(x) -> x == value end)
          "AT_INDEX" ->
            #raise "stop"
            list = evaluate(game, Enum.at(code, 1))
            index = evaluate(game, Enum.at(code, 2))
            if list do Enum.at(list, index) else nil end
          "LENGTH" ->
            Enum.count(evaluate(game, Enum.at(code,1)))
          "AND" ->
            statements = Enum.slice(code, 1, Enum.count(code))
            Enum.reduce_while(statements, false, fn(statement, acc) ->
              if evaluate(game, statement) == true do
                {:cont, true}
              else
                {:halt, false}
              end
            end)
          "EQUAL" ->
            evaluate(game, Enum.at(code,1)) == evaluate(game, Enum.at(code,2))
          "LESS_THAN" ->
            evaluate(game, Enum.at(code,1)) < evaluate(game, Enum.at(code,2))
          "GREATER_THAN" ->
            evaluate(game, Enum.at(code,1)) > evaluate(game, Enum.at(code,2))
          "LESS_EQUAL" ->
            evaluate(game, Enum.at(code,1)) <= evaluate(game, Enum.at(code,2))
          "GREATER_EQUAL" ->
            evaluate(game, Enum.at(code,1)) >= evaluate(game, Enum.at(code,2))
          "NOT" ->
            !evaluate(game, Enum.at(code,1))
          "JOIN_STRING" ->
            evaluate(game, Enum.at(code,1)) <> evaluate(game, Enum.at(code,2))
          "ADD" ->
            (evaluate(game, Enum.at(code,1)) || 0) + (evaluate(game, Enum.at(code,2)) || 0)
          "SUBTRACT" ->
            (evaluate(game, Enum.at(code,1)) || 0) - (evaluate(game, Enum.at(code,2)) || 0)
          "MULTIPLY" ->
            (evaluate(game, Enum.at(code,1)) || 0) * (evaluate(game, Enum.at(code,2)) || 0)
          "DIVIDE" ->
            divisor = (evaluate(game, Enum.at(code,2)) || 0)
            if divisor do (evaluate(game, Enum.at(code,1)) || 0) / divisor else nil end
          "OBJ_GET_VAL" ->
            map = evaluate(game, Enum.at(code,1))
            key = evaluate(game, Enum.at(code,2))
            map[key]
          "OBJ_GET_BY_PATH" ->
            map = evaluate(game, Enum.at(code,1))
            path = evaluate(game, Enum.at(code,2))
            get_in(map, path)
          "GAME_GET_VAL" ->
            path = evaluate(game, Enum.at(code,1))
            get_in(game, path)
          "GET_STACK_ID" ->
            group_id = evaluate(game, Enum.at(code,1))
            stack_index = evaluate(game, Enum.at(code,2))
            if group_id do evaluate(game, ["AT_INDEX", "$GAME.groupById." <> group_id <> ".stackIds", stack_index]) else nil end
          "GET_CARD_ID" ->
            group_id = evaluate(game, Enum.at(code,1))
            stack_index = evaluate(game, Enum.at(code,2))
            stack_id = evaluate(game, ["GET_STACK_ID", group_id, stack_index])
            card_index = evaluate(game, Enum.at(code,3))
            if stack_id do evaluate(game, ["AT_INDEX", "$GAME.stackById." <> stack_id <> ".cardIds", card_index]) else nil end
          "OBJ_SET_VAL" ->
            case Enum.count(code) do
              4 ->
                obj = evaluate(game, Enum.at(code,1))
                key = evaluate(game, Enum.at(code,2))
                value = evaluate(game, Enum.at(code,3))
                put_in(obj[key], value)
              5 ->
                obj = evaluate(game, Enum.at(code,1))
                path = evaluate(game, Enum.at(code,2))
                key = evaluate(game, Enum.at(code,3))
                value = evaluate(game, Enum.at(code,4))
                put_in(obj, path ++ [key], value)
            end
          "GAME_SET_VAL" ->
            path = Enum.slice(code, 1, Enum.count(code)-2)
            path = Enum.reduce(path, [], fn(path_item, acc)->
              eval_path_item = evaluate(game, path_item)
              if is_binary(eval_path_item) do
                acc ++ [eval_path_item]
              else
                acc ++ eval_path_item
              end
            end)
            value = evaluate(game, Enum.at(code, Enum.count(code)-1))
            put_in(game, path, value)
          "GAME_INCREASE_VAL" ->
            path = Enum.slice(code, 1, Enum.count(code)-2)
            path = Enum.reduce(path, [], fn(path_item, acc)->
              eval_path_item = evaluate(game, path_item)
              if is_binary(eval_path_item) do
                acc ++ [eval_path_item]
              else
                acc ++ eval_path_item
              end
            end)
            delta = evaluate(game, Enum.at(code, Enum.count(code)-1))
            old_value = get_in(game, path)
            put_in(game, path, old_value + delta)
          "GAME_DECREASE_VAL" ->
            path = Enum.slice(code, 1, Enum.count(code)-2)
            delta = evaluate(game, Enum.at(code, Enum.count(code)-1))
            evaluate(game, ["GAME_INCREASE_VAL"] ++ path ++ [-delta])
          "COND" ->
            ifthens = Enum.slice(code, 1, Enum.count(code))
            Enum.reduce_while(0..Enum.count(ifthens)-1//2, nil, fn(i, acc) ->
              IO.puts("checking if")
              IO.inspect(Enum.at(ifthens, i))
              if evaluate(game, Enum.at(ifthens, i)) == true do
                IO.puts("true")
                {:halt, evaluate(game, Enum.at(ifthens, i+1))}
              else
                IO.puts("false")
                {:cont, nil}
              end
            end)
            #IO.puts("COND then")
            #IO.inspect("then")
            #evaluate(game, then)
          "GAME_ADD_MESSAGE" ->
            statements = Enum.slice(code, 1, Enum.count(code))
            message = Enum.reduce(statements, "", fn(statement, acc) ->
              str_statement = inspect(evaluate(game, statement))
              acc <> String.replace(str_statement,"\"","")
            end)
            put_in(game["messages"], game["messages"] ++ [message])
          "FOR_EACH_START_STOP_STEP" ->
            var_name = Enum.at(code, 1)
            start = evaluate(game, Enum.at(code, 2))
            stop = evaluate(game, Enum.at(code, 3))
            step = evaluate(game, Enum.at(code, 4))
            function = Enum.at(code, 5)
            Enum.reduce(start..stop-1//step, game, fn(i, acc) ->
              acc = put_in(acc, ["variables", var_name], i)
              acc = evaluate(acc, function)
            end)
          "FOR_EACH_KEY_VAL" ->
            argc = Enum.count(code) - 1
            key_name = Enum.at(code, 1)
            val_name = Enum.at(code, 2)
            old_list = evaluate(game, Enum.at(code, 3))
            #old_list = evaluate(game, ["GAME_GET_VAL", obj_path])
            function = Enum.at(code, 4)
            old_list = if argc >= 5 do
              order = if argc >= 6 and evaluate(game, Enum.at(code, 6)) == "DESC" do :desc else :asc end
              Enum.sort_by(old_list, fn({key, obj}) -> get_in(obj, evaluate(game,Enum.at(code, 5))) end, order)
            else
              old_list
            end
            Enum.reduce(old_list, game, fn({key, val}, acc) ->
              acc = put_in(acc, ["variables", key_name], key)
              acc = put_in(acc, ["variables", val_name], val)
              evaluate(acc, function)
            end)
          "FOR_EACH_VAL" ->
            argc = Enum.count(code) - 1
            val_name = Enum.at(code, 1)
            list = evaluate(game, Enum.at(code, 2))
            #old_list = evaluate(game, ["GAME_GET_VAL", obj_path])
            function = Enum.at(code, 3)
            Enum.reduce(list, game, fn(val, acc) ->
              acc = put_in(acc, ["variables", val_name], val)
              evaluate(acc, function)
            end)
          "MOVE_CARD" ->
            argc = Enum.count(code) - 1
            card_id = evaluate(game, Enum.at(code, 1))
            if card_id do
              dest_group_id = evaluate(game, Enum.at(code, 2))
              dest_stack_index = evaluate(game, Enum.at(code, 3))
              dest_card_index = evaluate(game, Enum.at(code, 4))
              combine = if argc >= 5 do evaluate(game, Enum.at(code, 5)) else nil end
              preserve_state = if argc >= 6 do evaluate(game, Enum.at(code, 6)) else nil end
              GameUI.move_card(game, card_id, dest_group_id, dest_stack_index, dest_card_index, combine, preserve_state)
            else
              game
            end
          "DISCARD_CARD" ->
            card_id = evaluate(game, Enum.at(code, 1))
            card = game["cardById"][card_id]
            IO.inspect(card_id)
            IO.inspect(card)
            Logger.debug("here")
            GameUI.move_card(game, card_id, card["discardGroupId"], 0, 0)
          "ATTACH_CARD" ->
            card_id = evaluate(game, Enum.at(code, 1))
            dest_card_id = evaluate(game, Enum.at(code, 2))
            dest_card = game["cardById"][dest_card_id]
            GameUI.move_card(game, card_id, dest_card["groupId"], dest_card["stackIndex"], -1, true, false)
          "DRAW_CARD" ->
            argc = Enum.count(code) - 1
            num = if argc == 0 do 1 else evaluate(game, Enum.at(code, 1)) end
            player_n = if argc == 2 do evaluate(game, Enum.at(code, 2)) else game["playerUi"]["playerN"] end
            GameUI.move_stacks(game, player_n <> "Deck", player_n <> "Hand", num, "bottom")
          "MOVE_STACK" ->
            argc = Enum.count(code) - 1
            stack_id = evaluate(game, Enum.at(code, 1))
            dest_group_id = evaluate(game, Enum.at(code, 2))
            dest_stack_index = evaluate(game, Enum.at(code, 3))
            combine = if argc >= 4 do evaluate(game, Enum.at(code, 4)) else nil end
            preserve_state = if argc >= 5 do evaluate(game, Enum.at(code, 5)) else nil end
            GameUI.move_stack(game, stack_id, dest_group_id, dest_stack_index, combine, preserve_state)
          "DISCARD_STACK" ->
            stack_id = evaluate(game, Enum.at(code, 1))
            stack = game["stackById"][stack_id]
            card_ids = stack["cardIds"]
            Enum.reduce(card_ids, game, fn(card_id, acc) ->
              evaluate(acc, ["DISCARD_CARD", card_id])
            end)
          "MOVE_STACKS" ->
            argc = Enum.count(code) - 1
            orig_group_id = evaluate(game, Enum.at(code, 1))
            dest_group_id = evaluate(game, Enum.at(code, 2))
            top_n = evaluate(game, Enum.at(code, 3))
            position = evaluate(game, Enum.at(code, 4))
            GameUI.move_stacks(game, orig_group_id, dest_group_id, top_n, position)
          "SHUFFLE_GROUP" ->
            group_id = evaluate(game, Enum.at(code, 1))
            stack_ids = game["groupById"][group_id]["stackIds"]
            shuffled_stack_ids = stack_ids |> Enum.shuffle
            put_in(game, ["groupById", group_id, "stack_ids"], shuffled_stack_ids)
          "FACEUP_NAME_FROM_STACK_ID" ->
            stack_id = evaluate(game, Enum.at(code, 1))
            card_id = Enum.at(game["stackById"][stack_id]["cardIds"],0)
            evaluate(game, ["FACEUP_NAME_FROM_CARD_ID", card_id])
          "FACEUP_NAME_FROM_CARD_ID" ->
            card_id = evaluate(game, Enum.at(code, 1))
            card = game["cardById"][card_id]
            face = card["sides"][card["currentSide"]]
            face["name"]
          "ACTION_LIST" ->
            action_list_id = evaluate(game, Enum.at(code, 1))
            evaluate(game, game["actionLists"][action_list_id])
          _ ->
            code
        end
      end
    else # value
      #IO.puts("parsing value #{code}")
      cond do
        code == "$PLAYER_N" ->
          game["playerUi"]["playerN"]
        code == "$GAME" ->
          game
        code == "$GAME_PATH" ->
          []
        code == "$CARD_BY_ID" ->
          game["cardById"]
        code == "$CARD_BY_ID_PATH" ->
          ["cardById"]
        code == "$PLAYER_DATA" ->
          game["playerData"]
        code == "$PLAYER_DATA_PATH" ->
          ["playerData"]
        code == "$ACTIVE_CARD_PATH" ->
          ["cardById", game["playerUi"]["activeCardId"]]
        code == "$ACTIVE_FACE_PATH" ->
          active_card = evaluate(game, "$ACTIVE_CARD")
          evaluate(game, "$ACTIVE_CARD_PATH") ++ ["sides", active_card["currentSide"]]
        code == "$ACTIVE_TOKENS_PATH" ->
          evaluate(game, "$ACTIVE_CARD_PATH") ++ ["tokens"]
        code == "$ACTIVE_CARD" ->
          get_in(game, evaluate(game, "$ACTIVE_CARD_PATH"))
        code == "$ACTIVE_FACE" ->
          get_in(game, evaluate(game, "$ACTIVE_FACE_PATH"))
        code == "$ACTIVE_TOKENS" ->
          get_in(game, evaluate(game, "$ACTIVE_TOKENS_PATH"))
        Map.has_key?(game, "variables") && Map.has_key?(game["variables"], code) ->
          game["variables"][code]
        is_binary(code) and String.starts_with?(code, "$") and String.contains?(code, ".") ->
          split = String.split(code, ".")
          obj = evaluate(game, Enum.at(split, 0))
          path = ["LIST"] ++ Enum.slice(split, 1, Enum.count(split))
          evaluate(game, ["OBJ_GET_BY_PATH", obj, path])
        true ->
          code
      end
    end
  end
end