import React, { useEffect, useState } from "react";
import { Container } from "reactstrap";
import { getTokenOrRefresh } from "./token_util";
import "./custom.css";
import { ResultReason } from "microsoft-cognitiveservices-speech-sdk";

const speechsdk = require("microsoft-cognitiveservices-speech-sdk");

const App = () => {
  const [displayText, setDisplayText] = useState(
    "INITIALIZED: ready to test speech..."
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [recognizer, setRecognizer] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      const tokenRes = await getTokenOrRefresh();

      if (tokenRes.authToken === null) {
        setDisplayText("FATAL_ERROR: " + tokenRes.error);
      } else {
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(
          tokenRes.authToken,
          tokenRes.region
        );
        speechConfig.speechRecognitionLanguage = "en-US";
        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        setRecognizer(
          new speechsdk.SpeechRecognizer(speechConfig, audioConfig)
        );
      }
    };

    fetchToken();
  }, []);

  if (recognizer) {
    recognizer.sessionStarted = (s, e) => {
      console.log("\nSession started.");
      //   setDisplayText("");
    };

    recognizer.recognizing = (s, e) => {
      // console.log(`RECOGNIZING: Text=${e.result.text}`);
      setDisplayText(e.result.text);
    };

    recognizer.recognized = (s, e) => {
      if (e.result.reason == speechsdk.ResultReason.RecognizedSpeech) {
        // setDisplayText(displayText + " " + e.result.text);
        console.log(`RECOGNIZED: Text=${e.result.text}`);
      } else if (e.result.reason == speechsdk.ResultReason.NoMatch) {
        // console.log("NOMATCH: Speech could not be recognized.");
      }
    };

    recognizer.canceled = (s, e) => {
      console.log(`CANCELED: Reason=${e.reason}`);

      if (e.reason == speechsdk.CancellationReason.Error) {
        console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
        console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
        console.log(
          "CANCELED: Did you set the speech resource key and region values?"
        );
      }
      recognizer.stopContinuousRecognitionAsync();
    };

    recognizer.sessionStopped = (s, e) => {
      console.log("\nSession stopped event.");
      recognizer.stopContinuousRecognitionAsync();
    };
  }

  const sttFromMic = async () => {
    if (isPlaying === true) {
      recognizer.stopContinuousRecognitionAsync();
      setIsPlaying(!isPlaying);
      return;
    }

    setIsPlaying(!isPlaying);
    setDisplayText("");

    recognizer &&
      recognizer.startContinuousRecognitionAsync((result) => {
        let displayText;
        if (result.reason === ResultReason.RecognizedSpeech) {
          displayText = `${result.text}`;
        } else {
          displayText =
            "ERROR: Speech was cancelled or could not be recognized. Ensure your microphone is working properly.";
        }

        setDisplayText(displayText);
      });
  };

  return (
    <Container className="app-container">
      <h1 className="display-4 mb-3 mt-5 fw-bold">Real Time Speech-to-Text</h1>
      <div className="row main-container">
        <div className="col-6 h4 ">
          <div className="d-flex">
            {isPlaying ? (
              <div className="me-5 stop">
                <i
                  className="fas fa-stop fa-lg me-2"
                  onClick={() => sttFromMic()}
                ></i>
                <span className="ml-4 pl-4">Stop</span>
              </div>
            ) : (
              <div className="me-5 play">
                <i
                  className="fas fa-play fa-lg me-2"
                  onClick={() => sttFromMic()}
                ></i>
                <span className="ml-4 pl-4">Start</span>
              </div>
            )}
            <div>
              <i
                className="fas fa-trash fa-lg me-2"
                onClick={() => setDisplayText("")}
              ></i>
              <span className="ml-4 pl-4">Clear</span>
            </div>
          </div>
        </div>
        <div className="col-6 output-display rounded pt-2">
          <code className="fs-4">{displayText}</code>
        </div>
      </div>
    </Container>
  );
};

export default App;
