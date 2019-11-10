import React from "react";
import cx from "classnames";
import PlayerSeat from "./PlayerSeat";
import SmartTable from "./SmartTable";
import Hand from "./Hand";
import Bid from "./Bid";
import ScoreHeader from "../score/ScoreHeader";
import { GameUIView } from "elixir-backend";

interface Props {
  gameUIView: GameUIView | null;
  broadcast: (eventName: string, payload: object) => void;
}

const RoomGame: React.FC<Props> = ({ gameUIView, broadcast }) => {
  if (gameUIView == null) {
    return null;
  }

  const { seats, game } = gameUIView.game_ui;
  const rowMaxWidth = "max-w-xl";
  const showHand = true;
  const showBid = game.status === "bidding" && game.turn === gameUIView.my_seat;

  return (
    <>
      <div className={cx("flex mt-12", rowMaxWidth)}>
        <ScoreHeader score={gameUIView.game_ui.game.score} />
      </div>
      <div className={cx("flex mt-2", rowMaxWidth)}>
        <div className="w-1/5 h-12"></div>
        <div className="w-3/5 h-12 flex justify-center items-center">
          {/* Top Player */}
          <PlayerSeat
            seatState={seats}
            broadcast={broadcast}
            whichSeat="north"
          />
        </div>
        <div className="w-1/5 xbg-gray-100 h-12"></div>
      </div>
      <div className={cx("flex my-1 h-56", rowMaxWidth)}>
        <div className="h-full w-1/5 h-32 flex items-center justify-center">
          {/* Left Player */}
          <PlayerSeat
            seatState={seats}
            broadcast={broadcast}
            whichSeat="west"
          />
        </div>
        <div className="h-56 w-3/5 relative">
          <SmartTable gameUIView={gameUIView} />
        </div>
        <div className="h-full w-1/5 h-32 flex items-center justify-center">
          {/* Right player */}
          <PlayerSeat
            seatState={seats}
            broadcast={broadcast}
            whichSeat="east"
          />
        </div>
      </div>

      {showBid && (
        <div className={cx("flex mb-2", rowMaxWidth)}>
          <div className="w-3/5 mx-auto">
            <Bid broadcast={broadcast} />
          </div>
        </div>
      )}

      {showHand && (
        <div className={cx(rowMaxWidth, "flex justify-center ml-8")}>
          <Hand cards={gameUIView.my_hand} broadcast={broadcast} />
        </div>
      )}

      <div className={cx("flex mb-12", rowMaxWidth)}>
        <div className="w-1/5 h-12"></div>
        <div className="w-3/5 h-12 flex justify-center items-start">
          {/* Bottom player */}
          <PlayerSeat
            seatState={seats}
            broadcast={broadcast}
            whichSeat="south"
          />
        </div>
        <div className="w-1/5 h-12"></div>
      </div>
    </>
  );
};
export default RoomGame;
