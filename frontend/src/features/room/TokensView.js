import React, {useContext} from "react";
import { Token } from "./Token";
import {useKeypress} from "../../contexts/KeypressContext";


const InnerTokensView = React.memo(({ 
    card,
    showButtons,
    broadcast,
    groupID,
    stackIndex,
    cardIndex,
 }) => (
    <div>
        <Token type="threat" card={card} left={"10%"} top={"0%"} showButtons={showButtons} broadcast={broadcast} groupID={groupID} stackIndex={stackIndex} cardIndex={cardIndex}></Token>
        <Token type="willpower" card={card} left={"10%"} top={"25%"} showButtons={showButtons} broadcast={broadcast} groupID={groupID} stackIndex={stackIndex} cardIndex={cardIndex}></Token>
        <Token type="attack" card={card} left={"10%"} top={"50%"} showButtons={showButtons} broadcast={broadcast} groupID={groupID} stackIndex={stackIndex} cardIndex={cardIndex}></Token>
        <Token type="defense" card={card} left={"10%"} top={"75%"} showButtons={showButtons} broadcast={broadcast} groupID={groupID} stackIndex={stackIndex} cardIndex={cardIndex}></Token>
        <Token type="resource" card={card} left={"55%"} top={"0%"} showButtons={showButtons} broadcast={broadcast} groupID={groupID} stackIndex={stackIndex} cardIndex={cardIndex}></Token>
        <Token type="damage" card={card} left={"55%"} top={"25%"} showButtons={showButtons} broadcast={broadcast} groupID={groupID} stackIndex={stackIndex} cardIndex={cardIndex}></Token>
        <Token type="progress" card={card} left={"55%"} top={"50%"} showButtons={showButtons} broadcast={broadcast} groupID={groupID} stackIndex={stackIndex} cardIndex={cardIndex}></Token>
        <Token type="time" card={card} left={"55%"} top={"75%"} showButtons={showButtons} broadcast={broadcast} groupID={groupID} stackIndex={stackIndex} cardIndex={cardIndex}></Token>
    </div>
));
  
export const TokensView = ({
    card,
    isHighlighted,
    broadcast,
    groupID,
    stackIndex,
    cardIndex,
}) => {
    const keypress = useKeypress();
    const showButtons = keypress[0] === "Shift" && isHighlighted;
    return (
        <InnerTokensView 
            card={card}
            showButtons={showButtons}
            broadcast={broadcast}
            groupID={groupID}
            stackIndex={stackIndex}
            cardIndex={cardIndex}
        />
    );
};
  
export default TokensView;