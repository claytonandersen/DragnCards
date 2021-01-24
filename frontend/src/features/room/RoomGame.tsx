import React, {useState, useEffect} from "react";
import ReactDOM from "react-dom";
import { Groups } from "./Groups";
import { useActiveCard, useSetActiveCard } from "../../contexts/ActiveCardContext";
import { useKeypress, useSetKeypress} from "../../contexts/KeypressContext";
import { ChatMessage } from "elixir-backend";

var delayBroadcast: number;

const keyTokenMap: { [id: string] : Array<string | number>; } = {
  "1": ["resource",1],
  "2": ["progress",1],
  "3": ["damage",1],
  "4": ["time",1],
  "5": ["threat",1],
  "6": ["willpower",1],
  "7": ["attack",1],
  "8": ["defense",1],
  "q": ["resource",-1],
  "w": ["progress",-1],
  "e": ["damage",-1],
  "r": ["time",-1],
  "t": ["threat",-1],
  "y": ["willpower",-1],
  "u": ["attack",-1],
  "i": ["defense",-1],
}

interface Props {
  gameBroadcast: (eventName: string, payload: object) => void;
  chatBroadcast: (eventName: string, payload: object) => void;
  messages: Array<ChatMessage>;
}



// class RoomGame extends React.Component<Props> {

  

//   handleKeyDown(event: any) {
//     let ac = ReactDOM.findDOMNode(this)?.getElementsByClassName('isActive') // Returns the elements
//     console.log(event.key);
//   }

//   componentWillMount(): void {
//     window.addEventListener('keydown', this.handleKeyDown);
//   }

//   componentWillUnmount(): void {
//     window.removeEventListener('keydown', this.handleKeyDown);
//   }

//   render() {
//     return(
//         <Groups 
//           gameBroadcast={this.props.gameBroadcast}
//         />
//     )
//   }

// 

const RoomGame: React.FC<Props> = ({ gameBroadcast, chatBroadcast, messages }) => {
  console.log('rendering roomgame');
  //const gameUIView = React.useContext(GameUIViewContext);
  //if (gameUIView) gameBroadcast("update_groups",{groups: gameUIView.game_ui.game.groups});

/*   const setKeypress = useSetKeypress();
  const activeCard = useActiveCard();

  const onKeyDown = (event: any) => {
      console.log(event.key);
      setKeypress([event.key]);
      if (activeCard) {
        if (event.key === "1") {
          console.log("Logged activeCard",activeCard);
        }
      }
      document.removeEventListener('keydown', onKeyDown);
  }
  const onKeyUp = (event: any) => {
      console.log(event.key);
      setKeypress([]);
      document.removeEventListener('keyup', onKeyUp);
  }
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
 */
  const [typing, setTyping] = useState<Boolean>(false);
  const keypress = useKeypress();
  const setKeypress = useSetKeypress();
  const activeCardAndLoc = useActiveCard();
  const setActiveCardAndLoc = useSetActiveCard();
  const [keyDownList, setKeyDownList] = useState<Array<string>>([]);

  useEffect(() => {
    const onKeyDown = (event: any) => {
      if (typing) return;
      const k = event.key;
      console.log(k);
      // Keep track of last pressed key
      setKeypress([...keypress, k]);
      // General hotkeys
      if (k === "Tab") {
        gameBroadcast("reveal_card",{})
      } else if (k === "Space") {
        gameBroadcast("draw_card",{})
      }

      // Card specific hotkeys
      if (activeCardAndLoc != null) {   
        var newCard = activeCardAndLoc.card;
        var newTokens = newCard.tokens;
        var cardChanged = false;
        const cardName = newCard["sides"][newCard["currentSide"]].name;
        // Increment token 
        if (keyTokenMap[k] != undefined) {
          const tokenType = keyTokenMap[k][0];
          const delta = keyTokenMap[k][1];
          newTokens = {
            ...newTokens,
            [tokenType]: newTokens[tokenType]+delta,
          }
          newCard = {...newCard, tokens: newTokens}
          cardChanged = true;
          gameBroadcast("increment_token",{group_id: activeCardAndLoc.groupID, stack_index: activeCardAndLoc.stackIndex, card_index: activeCardAndLoc.cardIndex, token_type: tokenType, increment: delta})
          if (delta > 0) {
            if (delta === 1) {
                chatBroadcast("game_update",{message: "added "+delta+" "+tokenType+" token to "+cardName+"."});
            } else {
                chatBroadcast("game_update",{message: "added "+delta+" "+tokenType+" tokens to "+cardName+"."});
            }
          } else {
            if (delta === -1) {
                chatBroadcast("game_update",{message: "removed "+(-delta)+" "+tokenType+" token from "+cardName+"."});
            } else {
                chatBroadcast("game_update",{message: "removed "+(-delta)+" "+tokenType+" tokens from "+cardName+"."});
            }                
          }
        }
        // Set tokens to 0
        else if (k === "0") {
          newTokens = {
            ...newTokens,
            "resource": 0,
            "progress": 0,
            "damage": 0,
            "time": 0,
            "threat": 0,
            "willpower": 0,
            "attack": 0,
            "defense": 0,
          }
          newCard = {...newCard, tokens: newTokens}
          cardChanged = true;
          gameBroadcast("update_card", {card: newCard, group_id: activeCardAndLoc.groupID, stack_index: activeCardAndLoc.stackIndex, card_index: activeCardAndLoc.cardIndex});
          chatBroadcast("game_update", {message: "cleared all tokens from "+cardName+"."});
        }
        // Flip card
        else if (k === "f") {
          if (newCard.currentSide === "A") {
            newCard = {...newCard, currentSide: "B"}
          } else {
            newCard = {...newCard, currentSide: "A"}
          }
          cardChanged = true;
          const newCardName = newCard["sides"][newCard["currentSide"]].name;
          gameBroadcast("update_card", {card: newCard, group_id: activeCardAndLoc.groupID, stack_index: activeCardAndLoc.stackIndex, card_index: activeCardAndLoc.cardIndex});
          if (cardName==="Player Card" || cardName==="Encounter Card") {
            chatBroadcast("game_update", {message: "flipped "+newCardName+" faceup."});
          } else {
            chatBroadcast("game_update", {message: "flipped "+cardName+" over."});
          }
        }
        // Exhaust card
        else if (k === "a") {
          if (newCard.exhausted) {
            newCard = {...newCard, exhausted: false, rotation: 0}
            chatBroadcast("game_update", {message: "readied "+cardName+"."});
          } else {
            newCard = {...newCard, exhausted: true, rotation: 90}
            chatBroadcast("game_update", {message: "exhausted "+cardName+"."});
          }
          cardChanged = true;
          gameBroadcast("update_card", {card: newCard, group_id: activeCardAndLoc.groupID, stack_index: activeCardAndLoc.stackIndex, card_index: activeCardAndLoc.cardIndex});
        }
        // Deal shadow card
        else if (k === "s") {
          gameBroadcast("deal_shadow", {group_id: activeCardAndLoc.groupID, stack_index: activeCardAndLoc.stackIndex});
          chatBroadcast("game_update", {message: "dealt a shadow card to "+cardName+"."});
        }        
        // Send to appropriate discard pile
        else if (k === "x") {
          console.log('1');
          chatBroadcast("game_update", {message: "discarded "+cardName+" to ."});
          gameBroadcast("discard_card", {group_id: activeCardAndLoc.groupID, stack_index: activeCardAndLoc.stackIndex});
        }
        if (cardChanged) setActiveCardAndLoc({card: newCard, groupID: activeCardAndLoc.groupID, stackIndex: activeCardAndLoc.stackIndex, cardIndex: activeCardAndLoc.cardIndex});
      }
    }

    const onKeyUp = (event: any) => {
      setKeypress([""]);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    return () => {
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCardAndLoc, keyDownList]);


  return (
      <Groups 
        gameBroadcast={gameBroadcast}
        chatBroadcast={chatBroadcast}
        messages={messages}
        setTyping={setTyping}
      />
    
  )
}   

export default RoomGame;
