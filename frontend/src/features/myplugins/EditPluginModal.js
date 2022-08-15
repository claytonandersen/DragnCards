import React, { useMemo, useRef, useState } from "react";
import { Redirect } from "react-router";
import Select from 'react-select'
import { v4 as uuidv4 } from 'uuid';
import axios from "axios";
import ReactModal from "react-modal";
import Button from "../../components/basic/Button";
import useProfile from "../../hooks/useProfile";
import useIsLoggedIn from "../../hooks/useIsLoggedIn";
import { Link } from "react-router-dom";
import { useSiteL10n } from "../../hooks/useSiteL10n";
import { isObject } from "../store/updateValues";
import useForm from "../../hooks/useForm";
import useAuth from "../../hooks/useAuth";
import { setShowModal } from "../store/playerUiSlice";
const { convertCSVToArray } = require('convert-csv-to-array');
const converter = require('convert-csv-to-array');

export const deepMerge = (obj1, obj2) => {
  // If they are already equal, we are done
  if (obj1 === obj2) return;
  // If obj1 does not exist, set it to obj2
  if (!obj1) {
    obj1 = obj2;
    return;
  }
  // The we loop through obj2 properties and update obj1
  for (var p in obj2) {
    // Ignore prototypes
    if (!obj2.hasOwnProperty(p)) continue;
    // If property does not exists in obj1, add it to obj1
    if (!obj1.hasOwnProperty(p)) {
      obj1[p] = obj2[p];
      continue;
    }
    // Both objects have the property
    // If they have the same strict value or identity then no need to update
    if (obj1[p] === obj2[p]) continue;
    // Objects are not equal. We need to examine their data type to decide what to do
    if (Array.isArray(obj1[p]) && Array.isArray(obj2[p])) {
      // Both values are arrays. Concatenate them.
      obj1[p] = obj1[p].concat(obj2[p]);
    } else if (isObject(obj1[p]) && isObject(obj2[p])) {
      // Both values are objects
      deepMerge(obj1[p], obj2[p]);
    }
  }
} 

const mergeJSONs = (jsonList) => {
  const json0 = JSON.parse(jsonList[0]);
  for (var i = 1; i < jsonList.length; i++) {
    deepMerge(json0, JSON.parse(jsonList[i]));
  }
  return json0;
}

/* const csvToJson = (csv) => {
  const json0 = JSON.parse(jsonList[0]);
  for (var i = 1; i < jsonList.length; i++) {
    deepMerge(json0, JSON.parse(jsonList[i]));
  }
  return json0;
} */

const checkValidGameDef = (gameDef) => {
  // Needs to be a non-empty string
  const pluginName = gameDef?.pluginName;
  if (pluginName && (typeof pluginName === 'string' || pluginName instanceof String) && pluginName.length > 0) {
    return true;
  } else {
    return "Invalid or missing pluginName value."
  }
}


ReactModal.setAppElement("#root");

export const EditPluginModal = ({ isOpen, closeModal, shareReplayId}) => {
  const { authToken, renewToken, setAuthAndRenewToken } = useAuth();
  const authOptions = useMemo(
    () => ({
      headers: {
        Authorization: authToken,
      },
    }),
    [authToken]
  );
  const [checked, setChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");

  const [validGameDef, setValidGameDef] = useState(false);
  const [validCardDb, setValidCardDb] = useState(false);
  const [errorMessageGameDef, setErrorMessageGameDef] = useState("");
  const [errorMessageCardDb, setErrorMessageCardDb] = useState("");

  const [successMessageGameDef, setSuccessMessageGameDef] = useState("");
  const [successMessageCardDb, setSuccessMessageCardDb] = useState("");
  const l10n = useSiteL10n();

  const inputFileGameDef = useRef(null);
  const inputFileCardDb = useRef(null);

  const { inputs, handleSubmit, handleInputChange, setInputs } = useForm(async () => {
    console.log("inputs", inputs);
    if (!inputs.gameDef.pluginName || inputs.gameDef.pluginName.length == 0) {
      setErrorMessage("Invalid plugin name");
      return;
    }
/*     if (!inputs.gameDef) {
      setErrorMessage("No game definition specified.");
      return;
    }
    if (!inputs.cardDb) {
      setErrorMessage("No card database specified.");
      return;
    } */
    const updateData = {
      plugin: {
        plugin_uuid: uuidv4(),
        game_def: inputs.gameDef,
        card_db: inputs.cardDb,
        public: inputs.public || false,
      },
    };
    //const res = await axios.post("/be/api/v1/profile/update", data);

    setSuccessMessage("");
    setErrorMessage("");
    setLoadingMessage("Please wait...");
    const res = await axios.post("/be/api/myplugins", updateData, authOptions);
    if (
      res.status === 200
    ) {
      setSuccessMessage("Plugin created.");
      setErrorMessage("");
      setLoadingMessage("");
      closeModal();
    } else {
      setSuccessMessage("");
      setErrorMessage("Error."); 
      setLoadingMessage("");
    }
    
  });

  function readFileAsText(file){
    return new Promise(function(resolve,reject){
      let fr = new FileReader();

      fr.onload = function(){
          resolve(fr.result);
      };

      fr.onerror = function(){
          reject(fr);
      };

      fr.readAsText(file);
    });
  }

  const uploadGameDefJson = async(event) => {
    event.preventDefault();
    const files = event.target.files;
    let readers = [];
  
    // Abort if there were no files selected
    if(!files.length) return;
  
    // Store promises in array
    for(let i = 0; i < files.length; i++){
        readers.push(readFileAsText(files[i]));
    }
    
    // Trigger Promises
    Promise.all(readers).then((jsonList) => {
      console.log("unmerged",jsonList);
      const mergedJSONs = mergeJSONs(jsonList);
      console.log("mergedJSONs", mergedJSONs)
      const isValid = checkValidGameDef(mergedJSONs);
      if (isValid === true) {
        setSuccessMessageGameDef(`Game definition uploaded successfully: ${mergedJSONs.pluginName}`);
        setErrorMessageGameDef("");
        setValidGameDef(true);
        setInputs({...inputs, gameDef: mergedJSONs});
      } else {
        setErrorMessageGameDef(`Error: ${isValid}`)
      }
    });
    inputFileGameDef.current.value = "";
  }


  const processArrayOfRows = (arrayOfRows) => {
    const header0 = arrayOfRows[0][0];
    if (!header0.includes("uuid")) throw new Error("Missing uuid column.")
    if (!header0.includes("deckbuilderQuantity")) throw new Error("Missing deckbuilderQuantity column.")
    if (!header0.includes("imageUrl")) throw new Error("Missing imageUrl column.")
    if (!header0.includes("cardBack")) throw new Error("Missing cardBack column.")
    const header0Str = JSON.stringify(header0);
    const cardDb = {};
    for (var rows of arrayOfRows) {
      const headerStr = JSON.stringify(rows[0]);
      if (header0Str !== header0Str) throw new Error("File headers do not match.")
      for (var i=1; i<rows.length; i++) {
        const row = rows[i];
        const faceA = row;
        var faceB = {};
        if (faceA.cardBack === "double_sided") {
          faceB = rows[i+1];
          i += 1;
        } else {
          for (var key of header0) {
            faceB[key] = null;
          }
          faceB["name"] = faceA.cardBack;
          if (!inputs?.gameDef?.cardBacks || !Object.keys(inputs.gameDef.cardBacks).includes(faceB["name"])) throw new Error(`cardBack for ${faceA.name} not found in gameDef.cardBacks`)
        }
        cardDb[faceA.uuid] = {
          "A": faceA,
          "B": faceB
        }
      }
    }
    console.log("database", cardDb)
    return cardDb;
  }

  const uploadCardDbTsv = async(event) => {
    event.preventDefault();
    const files = event.target.files;
    let readers = [];
  
    // Abort if there were no files selected
    if(!files.length) return;
  
    // Store promises in array
    for(let i = 0; i < files.length; i++){
        readers.push(readFileAsText(files[i]));
    }
    
    // Trigger Promises
    Promise.all(readers).then((tsvList) => {
      console.log("unmerged",tsvList);
      const arrayOfRows = []; // Each element is a 2D array representing a tsv file
      for (var tsvString of tsvList) {
        try {
          const rows = convertCSVToArray(tsvString, {
            separator: '\t',
          });
          arrayOfRows.push(rows)
        } catch(err) {
          console.log("err",err)
          var message = "Error";
          if (err.message.includes("data does not include separator")) message += ": Invalid file format. Make sure the data is tab-separated."
          setErrorMessageCardDb(message);
          return;
        }
      }
      try {
        const cardDb = processArrayOfRows(arrayOfRows);
        setSuccessMessageCardDb(`Card database uploaded successfully: ${Object.keys(cardDb).length} cards.`);
        setErrorMessageCardDb("");
        setValidCardDb(true);
        setInputs({...inputs, cardDb: cardDb});
      } catch(err) {
        setErrorMessageCardDb("Error: "+err.message);
      }
    });
    inputFileGameDef.current.value = "";
  }

  const loadFileGameDef = () => {
    inputFileGameDef.current.click();
  }
  const loadFileCardDb = () => {
    inputFileCardDb.current.click();
  }

  const downloadGameDefJson = () => {
    const exportName = inputs.gameDef.pluginName.replaceAll(" ", "-");
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inputs.gameDef));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
  
  return (
    <ReactModal
      closeTimeoutMS={200}
      isOpen={isOpen}
      onRequestClose={closeModal}
      contentLabel="New Plugin"
      overlayClassName="fixed inset-0 bg-black-50 z-50"
      className="insert-auto p-5 bg-gray-700 border mx-auto my-12 rounded-lg outline-none"
      style={{
        overlay: {
        },
        content: {
          width: '500px',
        }
      }}
    >
      
      <h1 className="mb-2">New Plugin</h1>

      <form action="POST" onSubmit={handleSubmit}>
        <fieldset>{/* 
            <label className="block text-sm font-bold mb-2 mt-4">
              Game Name
            </label>
            <input
              name="plugin_name"
              className="form-control w-full mb-2"
              onChange={handleInputChange}
              value={inputs.plugin_name || ""}
            /> */}
          <label className="block text-sm font-bold mb-2 mt-4 text-white">
            Game definition (.json)
          </label>
          <label className="block text-xs mb-2 text-white">
            You may upload multiple jsons at once that define different aspects of the game and they will be merged automatically.
          </label>
          <Button onClick={() => loadFileGameDef()}>
            {l10n("Load game definition (.json)")}
            <input type='file' multiple id='file' ref={inputFileGameDef} style={{display: 'none'}} onChange={uploadGameDefJson} accept=".json"/>
          </Button>
          {successMessageGameDef && (
            <div className="alert alert-info mt-4">{successMessageGameDef}</div>
          )}
          {errorMessageGameDef && (
            <div className="alert alert-danger mt-4">{errorMessageGameDef}</div>
          )}
          <label className="block text-sm font-bold mb-2 mt-4 text-white">
            Card database (.tsv)
          </label>
          <label className="block text-xs mb-2 text-white">
            You may upload multiple tab-separated-value (.tsv) files at once that define different cards and they will be merged automatically. Eech file must share the same header information. A valid game definition must be uploaded first.
          </label>
          <Button disabled={!validGameDef} onClick={() => loadFileCardDb()}>
            {l10n("Load card database (.tsv)")}
            <input type='file' multiple id='file' ref={inputFileCardDb} style={{display: 'none'}} onChange={uploadCardDbTsv} accept=".tsv"/>
          </Button>
          {successMessageCardDb && (
            <div className="alert alert-info mt-4">{successMessageCardDb}</div>
          )}
          {errorMessageCardDb && (
            <div className="alert alert-danger mt-4">{errorMessageCardDb}</div>
          )}
          <label className="block text-sm font-bold mb-2 mt-4 text-white">
            Visibility
          </label>
          <select 
            name="public"
            className="form-control w-full"
            onChange={handleInputChange}
            value={inputs.public || false}>
            <option value={false}>{l10n("Private")}</option>
            <option value={true}>{l10n("Public")}</option>
          </select>
          <Button disabled={!validGameDef || !validCardDb} isSubmit isPrimary className="mt-2">
            Create Plugin
          </Button>
          {successMessage && (
            <div className="alert alert-info mt-4">{successMessage}</div>
          )}
          {errorMessage && (
            <div className="alert alert-danger mt-4">{errorMessage}</div>
          )}
          {loadingMessage && (
            <div className="alert alert-info mt-4">{loadingMessage}</div>
          )}
        </fieldset>
      </form>
{/*       <Button onClick={(event) => {uploadGameDefJson(event)}} isPrimary className="mx-2 mt-2">Upload</Button>
 */}
    </ReactModal>
  );
};
export default EditPluginModal;